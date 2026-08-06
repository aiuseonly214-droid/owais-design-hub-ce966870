import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCustomer, fetchCustomers, saveCustomer, type Customer } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers · Owais Interior Designer CRM" },
      { name: "description", content: "Add, search and manage interior design customers." },
      { property: "og:title", content: "Customers · Owais Interior Designer CRM" },
      { property: "og:description", content: "Customer directory for quotations and invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersPage,
});

type Draft = Partial<Customer>;

function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => fetchCustomers(search),
  });

  const save = useMutation({
    mutationFn: (d: Draft) => saveCustomer(d),
    onSuccess: () => {
      toast.success("Customer saved");
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success("Customer deleted");
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: () => toast.error("Cannot delete — this customer has linked documents"),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Customers"
        description="Everyone you quote, bill and collect from."
        action={
          <Button onClick={() => setDraft({ name: "", mobile: "" })}>
            <Plus className="size-4" /> New customer
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, mobile, code or city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="w-[110px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No customers yet
                    </TableCell>
                  </TableRow>
                )}
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.code}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.mobile}</TableCell>
                    <TableCell>{c.city || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        aria-label={`Edit ${c.name}`}
                        onClick={() => setDraft(c)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        aria-label={`Delete ${c.name}`}
                        onClick={() => remove.mutate(c.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit customer" : "New customer"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name *">
                <Input
                  value={draft.name ?? ""}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Mobile *">
                <Input
                  value={draft.mobile ?? ""}
                  onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
                />
              </Field>
              <Field label="Alternate mobile">
                <Input
                  value={draft.alt_mobile ?? ""}
                  onChange={(e) => setDraft({ ...draft, alt_mobile: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={draft.email ?? ""}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </Field>
              <Field label="City">
                <Input
                  value={draft.city ?? ""}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                />
              </Field>
              <Field label="Site address" full>
                <Textarea
                  rows={2}
                  value={draft.site_address ?? ""}
                  onChange={(e) => setDraft({ ...draft, site_address: e.target.value })}
                />
              </Field>
              <Field label="Billing address" full>
                <Textarea
                  rows={2}
                  value={draft.billing_address ?? ""}
                  onChange={(e) => setDraft({ ...draft, billing_address: e.target.value })}
                />
              </Field>
              <Field label="Notes" full>
                <Textarea
                  rows={2}
                  value={draft.notes ?? ""}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              disabled={save.isPending}
              onClick={() => {
                if (!draft?.name?.trim() || !draft?.mobile?.trim()) {
                  return toast.error("Name and mobile are required");
                }
                save.mutate(draft);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
