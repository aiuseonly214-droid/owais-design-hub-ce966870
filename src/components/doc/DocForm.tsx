import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Save, Loader2, FolderPlus, ArrowUp, ArrowDown } from "lucide-react";
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
  show_section_subtotals: boolean;
  quotation_id?: string | null;
};

const NO_GROUP = "__none__";

const emptyItem = (): DocItem => ({
  sr: 1,
  particular: "",
  description: null,
  unit: "Nos",
  qty: 1,
  rate: 0,
  amount: 0,
  include_in_total: true,
  group_name: null,
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
    show_section_subtotals: true,
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

  // Sections are derived from each item's group_name, so the flat array (and
  // therefore the save path) stays exactly as before.
  const blocks = useMemo(() => {
    const out: { name: string | null; rows: { it: DocItem; idx: number }[]; subtotal: number }[] = [];
    items.forEach((it, idx) => {
      const trimmedName = it.group_name?.trim();
      const name = trimmedName || null;
      let last = out[out.length - 1];
      if (!last || last.name !== name) {
        last = { name, rows: [], subtotal: 0 };
        out.push(last);
      }
      last.rows.push({ it, idx });
      if (it.include_in_total !== false) last.subtotal += toNumber(it.qty) * toNumber(it.rate);
    });
    return out;
  }, [items]);

  const groupNames = useMemo(
    () => Array.from(new Set(blocks.map((b) => b.name).filter(Boolean) as string[])),
    [blocks],
  );

  function addItemTo(name: string | null) {
    setItems((prev) => {
      const next = [...prev];
      let at = next.length;
      for (let i = next.length - 1; i >= 0; i--) {
        const g = next[i]!.group_name?.trim() || null;
        if (g === name) {
          at = i + 1;
          break;
        }
      }
      next.splice(at, 0, { ...emptyItem(), group_name: name });
      return next;
    });
  }

  function addSection() {
    const base = "New Section";
    let name = base;
    let n = 2;
    while (groupNames.includes(name)) name = `${base} ${n++}`;
    setItems((prev) => [...prev, { ...emptyItem(), group_name: name }]);
  }

  function renameGroup(oldName: string, newName: string) {
    setItems((prev) =>
      prev.map((it) => ((it.group_name?.trim() || null) === oldName ? { ...it, group_name: newName } : it)),
    );
  }

  function deleteGroup(name: string) {
    setItems((prev) =>
      prev.map((it) => ((it.group_name?.trim() || null) === name ? { ...it, group_name: null } : it)),
    );
  }

  function moveBlock(bi: number, dir: -1 | 1) {
    const target = bi + dir;
    if (target < 0 || target >= blocks.length) return;
    const a = blocks[Math.min(bi, target)]!;
    const b = blocks[Math.max(bi, target)]!;
    const start = a.rows[0]!.idx;
    const mid = b.rows[0]!.idx;
    const endIdx = b.rows[b.rows.length - 1]!.idx + 1;
    setItems((prev) => [
      ...prev.slice(0, start),
      ...prev.slice(mid, endIdx),
      ...prev.slice(start, mid),
      ...prev.slice(endIdx),
    ]);
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const g = (x?: DocItem) => x?.group_name?.trim() || null;
    if (g(items[idx]) !== g(items[target])) return;
    setItems((prev) => {
      const next = [...prev];
      const [row] = next.splice(idx, 1);
      next.splice(target, 0, row!);
      return next;
    });
  }

  function moveToGroup(idx: number, name: string | null) {
    setItems((prev) => {
      const next = [...prev];
      const [row] = next.splice(idx, 1);
      if (!row) return prev;
      row.group_name = name;
      let at = next.length;
      for (let i = next.length - 1; i >= 0; i--) {
        if ((next[i]!.group_name?.trim() || null) === name) {
          at = i + 1;
          break;
        }
      }
      next.splice(at, 0, row);
      return next;
    });
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
        show_section_subtotals: form.show_section_subtotals,
      };
      const rows = valid.map((it, i) => ({
        ...it,
        sr: i + 1,
        amount: toNumber(it.qty) * toNumber(it.rate),
        group_name: it.group_name?.trim() ? it.group_name.trim() : null,
      }));

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
        <CardHeader className="flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Items</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={addSection}>
              <FolderPlus className="size-4" /> Add section
            </Button>
            <Button size="sm" variant="secondary" onClick={() => addItemTo(null)}>
              <Plus className="size-4" /> Add row
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocks.map((block, bi) => {
            const body = block.rows.map(({ it, idx }) => (
              <div key={idx} className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Item {idx + 1}
                    {it.include_in_total === false && (
                      <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-muted-foreground">
                        Option — total me nahi judega
                      </span>
                    )}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        className="size-3.5 accent-primary"
                        checked={it.include_in_total !== false}
                        onChange={(e) => patchItem(idx, { include_in_total: e.target.checked })}
                      />
                      Total me jodo
                    </label>
                    <Select
                      value={block.name ?? NO_GROUP}
                      onValueChange={(v) => moveToGroup(idx, v === NO_GROUP ? null : v)}
                    >
                      <SelectTrigger className="h-7 w-[150px] text-xs">
                        <SelectValue placeholder="Move to section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_GROUP}>No section</SelectItem>
                        {groupNames.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => moveItem(idx, -1)}
                      aria-label={`Move item ${idx + 1} up`}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => moveItem(idx, 1)}
                      aria-label={`Move item ${idx + 1} down`}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
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
                    <Select value={it.unit || "Nos"} onValueChange={(v) => patchItem(idx, { unit: v })}>
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
            ));

            if (!block.name) return <div key={`u-${bi}`} className="space-y-3">{body}</div>;

            return (
              <div key={`g-${bi}`} className="rounded-lg border border-primary/30 bg-background p-3">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Input
                    value={block.name}
                    onChange={(e) => renameGroup(block.name ?? "", e.target.value)}
                    className="h-8 max-w-[240px] font-medium"
                    placeholder="Section name"
                  />
                  <Button size="sm" variant="ghost" onClick={() => moveBlock(bi, -1)} aria-label="Move section up">
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => moveBlock(bi, 1)} aria-label="Move section down">
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => addItemTo(block.name)}>
                    <Plus className="size-4" /> Add item
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteGroup(block.name ?? "")}
                  >
                    <Trash2 className="size-4" /> Remove section
                  </Button>
                </div>
                <div className="space-y-3">{body}</div>
                <div className="mt-3 flex items-center justify-end gap-3 border-t pt-2 text-sm">
                  <span className="text-muted-foreground">Subtotal — {block.name}</span>
                  <span className="font-semibold tabular-nums">{formatINR(block.subtotal)}</span>
                </div>
              </div>
            );
          })}
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
            <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={form.show_section_subtotals}
                onChange={(e) => setForm({ ...form, show_section_subtotals: e.target.checked })}
              />
              <span>
                Section ke subtotals dikhao
                <span className="block text-xs text-muted-foreground">
                  Har section ke end me uska subtotal print hoga
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={form.show_totals}
                onChange={(e) => setForm({ ...form, show_totals: e.target.checked })}
              />
              <span>
                Final totals dikhao
                <span className="block text-xs text-muted-foreground">
                  Sub Total, Discount, Grand Total aur Amount in Words print honge
                </span>
              </span>
            </label>
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
