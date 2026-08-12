import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchCustomers, saveCustomer } from "@/lib/crm";
import { isValidMobile, onlyDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Searchable customer picker with an inline "add new customer" shortcut,
 * so a document can be raised without leaving the form.
 */
export function CustomerPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: "", mobile: "", city: "" });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers", ""],
    queryFn: () => fetchCustomers(""),
  });

  const selected = useMemo(
    () => customers.find((c) => c.id === value),
    [customers, value],
  );

  async function createCustomer() {
    if (!draft.name.trim()) return toast.error("Name is required");
    if (!isValidMobile(draft.mobile)) {
      return toast.error("Mobile must be 10 digits and start with 6-9");
    }
    setSaving(true);
    try {
      const id = await saveCustomer({
        name: draft.name.trim(),
        mobile: draft.mobile.trim(),
        city: draft.city.trim() || null,
      });
      await qc.invalidateQueries({ queryKey: ["customers"] });
      onChange(id);
      setAdding(false);
      setDraft({ name: "", mobile: "", city: "" });
      toast.success("Customer added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add the customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between font-normal"
            >
              {selected ? `${selected.name} — ${selected.mobile}` : "Select or search a customer"}
              <ChevronsUpDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Type a name, mobile or code…" />
              <CommandList>
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandGroup>
                  {customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.mobile} ${c.code} ${c.city ?? ""}`}
                      onSelect={() => {
                        onChange(c.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn("size-4", value === c.id ? "opacity-100" : "opacity-0")}
                      />
                      <span className="truncate">
                        {c.name} — {c.mobile}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button type="button" variant="secondary" onClick={() => setAdding(true)}>
          <Plus className="size-4" /> New
        </Button>
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New customer</DialogTitle>
            <DialogDescription>
              Saved to the customer directory and selected on this document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label className="mb-1.5 block">Name *</Label>
              <Input
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Mobile * (10 digits)</Label>
              <Input
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                value={draft.mobile}
                onChange={(e) => setDraft({ ...draft, mobile: onlyDigits(e.target.value) })}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">City</Label>
              <Input
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={createCustomer} disabled={saving}>
              Add customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
