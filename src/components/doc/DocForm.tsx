import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerPicker } from "@/components/doc/CustomerPicker";
import {
  fetchCompany,
  saveInvoice,
  saveQuotation,
  type DocItem,
} from "@/lib/crm";
import { INVOICE_STATUS, QUOTATION_STATUS, UNITS } from "@/lib/options";
import { addDaysISO, amountInWords, formatINR, onlyNumeric, toNumber, todayISO } from "@/lib/format";


export type DocFormValues = {
  id?: string;
  customer_id: string;
  date: string;
  secondaryDate: string;
  subject: string;
  discount: number;
  terms: string;
  status: string;
  show_totals: boolean;
  quotation_id?: string | null;
};

const emptyItem = (): DocItem => ({
  sr: 1,
  particular: "",
  description: null,
  unit: "Nos",
  qty: 1,
  rate: 0,
  amount: 0,
  include_in_total: true,
});

export function DocForm({
  kind,
  initialDoc,
  initialItems,
}: {
  kind: "quotation" | "invoice";
  initialDoc?: Partial<DocFormValues>;
  initialItems?: DocItem[];
}) {
  const navigate = useNavigate();
  const { data: company } = useQuery({ queryKey: ["company"], queryFn: fetchCompany });
  const statusOptions = kind === "quotation" ? QUOTATION_STATUS : INVOICE_STATUS;


  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DocFormValues>({
    customer_id: "",
    date: todayISO(),
    secondaryDate: kind === "quotation" ? addDaysISO(15) : "",
    subject: "",
    discount: 0,
    terms: "",
    status: kind === "quotation" ? "draft" : "unpaid",
    show_totals: true,
    ...initialDoc,
  });
  const [items, setItems] = useState<DocItem[]>(
    initialItems?.length ? initialItems : [emptyItem()],
  );
  // Discount is captured as a percentage; the rupee value is derived from the subtotal.
  const [discountPct, setDiscountPct] = useState(() => {
    const sub = (initialItems ?? []).reduce((s, it) => s + toNumber(it.qty) * toNumber(it.rate), 0);
    const amt = toNumber(initialDoc?.discount ?? 0);
    return sub > 0 && amt > 0 ? Math.round((amt / sub) * 10000) / 100 : 0;
  });

  const termsValue = form.terms || company?.default_terms || "";

  const totals = useMemo(() => {
    // Only rows flagged "in total" are summed; the rest are printed as options.
    const subtotal = items.reduce(
      (s, it) => (it.include_in_total === false ? s : s + toNumber(it.qty) * toNumber(it.rate)),
      0,
    );
    const pct = Math.min(Math.max(toNumber(discountPct), 0), 100);
    const discount = Math.round(((subtotal * pct) / 100) * 100) / 100;
    return { subtotal, discount, grand: subtotal - discount, pct };
  }, [items, discountPct]);

  function patchItem(idx: number, patch: Partial<DocItem>) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, ...patch };
        next.amount = toNumber(next.qty) * toNumber(next.rate);
        return next;
      }),
    );
  }

  async function handleSave() {
    if (!form.customer_id) return toast.error("Please select a customer");
    const valid = items.filter((it) => it.particular.trim());
    if (!valid.length) return toast.error("Add at least one item with a particular");
    if (valid.some((it) => toNumber(it.qty) <= 0 || toNumber(it.rate) <= 0)) {
      return toast.error("Every item needs a quantity and a rate greater than zero");
    }

    setSaving(true);
    try {
      const base = {
        id: form.id,
        customer_id: form.customer_id,
        date: form.date,
        subject: form.subject || null,
        subtotal: totals.subtotal,
        discount: totals.discount,
        grand_total: totals.grand,
        amount_words: amountInWords(totals.grand),
        terms: termsValue,
        status: form.status,
        show_totals: form.show_totals,
      };
      const rows = valid.map((it, i) => ({ ...it, sr: i + 1, amount: toNumber(it.qty) * toNumber(it.rate) }));

      if (kind === "quotation") {
        const id = await saveQuotation({ ...base, valid_till: form.secondaryDate || null } as any, rows);
        toast.success("Quotation saved");
        navigate({ to: "/quotations/$id", params: { id } });
      } else {
        const id = await saveInvoice(
          { ...base, due_date: null, quotation_id: form.quotation_id ?? null } as any,
          rows,
        );
        toast.success("Invoice saved");
        navigate({ to: "/invoices/$id", params: { id } });
      }

    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Customer *</Label>
            <CustomerPicker
              value={form.customer_id}
              onChange={(v) => setForm({ ...form, customer_id: v })}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          {kind === "quotation" && (
            <div>
              <Label className="mb-1.5 block">Valid Till</Label>
              <Input
                type="date"
                value={form.secondaryDate}
                onChange={(e) => setForm({ ...form, secondaryDate: e.target.value })}
              />
            </div>
          )}

          <div className="lg:col-span-4">
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <Label className="mb-1.5 block">Subject</Label>
            <Input
              placeholder="e.g. Interior work for 2BHK — living room & kitchen"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Items</CardTitle>
          <Button size="sm" variant="secondary" onClick={() => setItems([...items, emptyItem()])}>
            <Plus className="size-4" /> Add row
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Item {idx + 1}
                  {it.include_in_total === false && (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-muted-foreground">
                      Option — total me nahi judega
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      className="size-3.5 accent-primary"
                      checked={it.include_in_total !== false}
                      onChange={(e) => patchItem(idx, { include_in_total: e.target.checked })}
                    />
                    Total me jodo
                  </label>
                  <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  disabled={items.length === 1}
                  aria-label={`Remove item ${idx + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-12">
                <div className="md:col-span-5">
                  <Label className="mb-1 block text-xs">Particular</Label>
                  <Input
                    value={it.particular}
                    onChange={(e) => patchItem(idx, { particular: e.target.value })}
                    placeholder="False ceiling — gypsum with cove lighting"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-1 block text-xs">Unit</Label>
                  <Select
                    value={it.unit || "Nos"}
                    onValueChange={(v) => patchItem(idx, { unit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="mb-1 block text-xs">Qty</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    className="text-right tabular-nums"
                    value={it.qty === 0 ? "" : String(it.qty)}
                    placeholder="0"
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => patchItem(idx, { qty: toNumber(onlyNumeric(e.target.value)) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-1 block text-xs">Rate (₹)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    className="text-right tabular-nums"
                    value={it.rate === 0 ? "" : String(it.rate)}
                    placeholder="0"
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => patchItem(idx, { rate: toNumber(onlyNumeric(e.target.value)) })}
                  />

                </div>
                <div className="md:col-span-1">
                  <Label className="mb-1 block text-xs">Amount</Label>
                  <div className="flex h-9 items-center justify-end rounded-md border bg-background px-2 text-sm font-medium tabular-nums">
                    {formatINR(toNumber(it.qty) * toNumber(it.rate))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms &amp; Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={7}
              value={termsValue}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sub Total</span>
              <span className="font-medium tabular-nums">{formatINR(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <Label htmlFor="discount" className="text-muted-foreground">
                Discount (%)
              </Label>
              <Input
                id="discount"
                type="text"
                inputMode="decimal"
                placeholder="0"
                className="w-28 text-right tabular-nums"
                value={discountPct === 0 ? "" : String(discountPct)}
                onFocus={(e) => e.currentTarget.select()}
                onChange={(e) => {
                  const n = toNumber(onlyNumeric(e.target.value));
                  setDiscountPct(Math.min(Math.max(n, 0), 100));
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Discount amount</span>
              <span className="font-medium tabular-nums">− {formatINR(totals.discount)}</span>
            </div>

            <div className="flex items-center justify-between rounded-md bg-primary px-3 py-2.5 text-primary-foreground">
              <span className="text-sm font-semibold">Grand Total</span>
              <span className="font-display text-lg tabular-nums">{formatINR(totals.grand)}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {amountInWords(totals.grand)}
            </p>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save {kind === "quotation" ? "Quotation" : "Invoice"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
