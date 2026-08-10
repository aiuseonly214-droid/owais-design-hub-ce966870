import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
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
import {
  fetchCustomers,
  fetchInvoice,
  fetchPaidSoFar,
  saveReceipt,
  syncInvoiceStatus,
} from "@/lib/crm";

import { amountInWords, formatINR, todayISO, toNumber } from "@/lib/format";
import { PAYMENT_MODES } from "@/lib/options";

type NewReceiptSearch = { invoice?: string };

export const Route = createFileRoute("/_authenticated/receipts/new")({
  validateSearch: (search: Record<string, unknown>): NewReceiptSearch => ({
    invoice: typeof search['invoice'] === "string" ? search['invoice'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New receipt · Owais Interior Designer CRM" },
      { name: "description", content: "Record a customer payment and issue an A4 receipt." },
      { property: "og:title", content: "New receipt · Owais Interior Designer CRM" },
      { property: "og:description", content: "Cash, UPI, bank, cheque and card payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewReceipt,
});

function NewReceipt() {
  const navigate = useNavigate();
  const { invoice: invoiceId } = Route.useSearch();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers", ""],
    queryFn: () => fetchCustomers(""),
  });
  const { data: invoice } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => fetchInvoice(invoiceId!),
    enabled: !!invoiceId,
  });

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    date: todayISO(),
    total_amount: 0,
    previous_paid: 0,
    amount_received: 0,
    mode: "cash",
    txn_id: "",
    notes: "",
  });

  const { data: paidSoFar } = useQuery({
    queryKey: ["paid-so-far", form.customer_id],
    queryFn: () => fetchPaidSoFar(form.customer_id),
    enabled: !!form.customer_id,
  });

  useEffect(() => {
    if (!invoice) return;
    setForm((f) => ({
      ...f,
      customer_id: invoice.doc.customer_id,
      total_amount: Number(invoice.doc.grand_total),
    }));
  }, [invoice]);

  useEffect(() => {
    if (paidSoFar === undefined) return;
    setForm((f) => ({ ...f, previous_paid: paidSoFar }));
  }, [paidSoFar]);

  const balance = useMemo(
    () =>
      Math.max(
        0,
        toNumber(form.total_amount) - toNumber(form.previous_paid) - toNumber(form.amount_received),
      ),
    [form.total_amount, form.previous_paid, form.amount_received],
  );

  async function submit() {
    if (!form.customer_id) return toast.error("Please select a customer");
    if (toNumber(form.amount_received) <= 0) return toast.error("Enter the amount received");
    setSaving(true);
    try {
      const id = await saveReceipt({
        customer_id: form.customer_id,
        invoice_id: invoiceId ?? null,
        date: form.date,
        total_amount: toNumber(form.total_amount),
        previous_paid: toNumber(form.previous_paid),
        amount_received: toNumber(form.amount_received),
        balance,
        mode: form.mode,
        txn_id: form.txn_id || null,
        amount_words: amountInWords(toNumber(form.amount_received)),
        notes: form.notes || null,
      } as never);
      if (invoiceId) await syncInvoiceStatus(invoiceId);
      toast.success("Receipt saved");
      navigate({ to: "/receipts/$id", params: { id } });

    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the receipt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="New Receipt"
        description={invoice ? `Payment against ${invoice.doc.code}` : "Record a customer payment."}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Customer *</Label>
              <Select
                value={form.customer_id}
                onValueChange={(v) => setForm({ ...form, customer_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.mobile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Payment mode</Label>
              <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Transaction / cheque no.</Label>
              <Input
                value={form.txn_id}
                onChange={(e) => setForm({ ...form, txn_id: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block">Notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Total amount (₹)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.total_amount}
                onChange={(e) => setForm({ ...form, total_amount: toNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Previously paid (₹)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.previous_paid}
                onChange={(e) => setForm({ ...form, previous_paid: toNumber(e.target.value) })}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Amount received now (₹) *</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.amount_received}
                onChange={(e) => setForm({ ...form, amount_received: toNumber(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between rounded-md bg-primary px-3 py-2.5 text-primary-foreground">
              <span className="text-sm font-semibold">Balance</span>
              <span className="font-display text-lg tabular-nums">{formatINR(balance)}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {amountInWords(toNumber(form.amount_received))}
            </p>
            <Button className="w-full" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Receipt
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
