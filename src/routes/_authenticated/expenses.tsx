import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDelete } from "@/components/doc/ConfirmDelete";
import { requireAdmin } from "@/lib/guards";
import { EXPENSE_CATEGORIES, addExpense, deleteExpense, fetchCashflow, fetchExpenses } from "@/lib/finance";
import { fetchCustomers } from "@/lib/crm";
import { PAYMENT_MODES } from "@/lib/options";
import { formatDate, formatINR, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses · Owais Interior Designer CRM" },
      { name: "description", content: "Admin-only ledger of studio and site expenditure." },
      { property: "og:title", content: "Expenses · Owais Interior Designer CRM" },
      { property: "og:description", content: "Track office and site kharche with cashflow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => requireAdmin(),
  component: ExpensesPage,
});

const empty = () => ({ date: todayISO(), category: EXPENSE_CATEGORIES[0] as string, amount: "", mode: "cash", reference: "", notes: "", customer_id: "none" });

function ExpensesPage() {
  const qc = useQueryClient();
  const [f, setF] = useState(empty());
  const { data: rows = [] } = useQuery({ queryKey: ["expenses"], queryFn: fetchExpenses });
  const { data: cash } = useQuery({ queryKey: ["cashflow"], queryFn: fetchCashflow });
  const { data: customers = [] } = useQuery({ queryKey: ["customers", ""], queryFn: () => fetchCustomers("") });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["expenses"] });
    qc.invalidateQueries({ queryKey: ["cashflow"] });
  };
  const add = useMutation({
    mutationFn: () => {
      const amount = Number(f.amount);
      if (!(amount > 0)) throw new Error("Amount 0 se zyada hona chahiye");
      return addExpense({
        date: f.date, category: f.category, amount, mode: f.mode,
        reference: f.reference || null, notes: f.notes || null,
        customer_id: f.customer_id === "none" ? null : f.customer_id,
      });
    },
    onSuccess: () => { toast.success("Expense saved"); setF(empty()); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({ mutationFn: deleteExpense, onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });

  const byCat = EXPENSE_CATEGORIES.map((c) => ({ c, v: rows.filter((r) => r.category === c).reduce((s, r) => s + Number(r.amount), 0) }));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Expenses" description="Office aur site ke saare kharche — sirf admin ko dikhte hain." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["This month expenses", cash?.monthExpenses],
          ["This month salaries", cash?.monthSalaries],
          ["Total outflow", cash?.outflow],
          ["Net cash (in − out)", cash?.net],
        ].map(([l, v]) => (
          <Card key={l as string}><CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p>
            <p className="font-display text-xl">{formatINR(Number(v ?? 0))}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Add expense</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
            <div><Label>Date</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
            <div><Label>Category</Label>
              <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Amount (₹)</Label><Input type="number" min="0" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
            <div><Label>Mode</Label>
              <Select value={f.mode} onValueChange={(v) => setF({ ...f, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Bill / Ref no.</Label><Input value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} /></div>
            <div><Label>Site / Customer (optional)</Label>
              <Select value={f.customer_id} onValueChange={(v) => setF({ ...f, customer_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— General / Office —</SelectItem>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
            <div className="flex items-end"><Button type="submit" disabled={add.isPending} className="w-full"><Plus className="size-4" /> Save expense</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {byCat.map(({ c, v }) => (
          <div key={c} className="flex justify-between rounded-md border bg-card px-3 py-2 text-sm"><span className="text-muted-foreground">{c}</span><span className="tabular-nums">{formatINR(v)}</span></div>
        ))}
      </div>

      <Card><CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Site</TableHead><TableHead>Mode</TableHead><TableHead>Ref / Notes</TableHead><TableHead className="text-right">Amount</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No expenses yet</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{formatDate(r.date)}</TableCell>
                <TableCell>{r.category}</TableCell>
                <TableCell>{r.customers?.name ?? "—"}</TableCell>
                <TableCell className="uppercase">{r.mode}</TableCell>
                <TableCell className="max-w-[220px] truncate">{[r.reference, r.notes].filter(Boolean).join(" · ") || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatINR(r.amount)}</TableCell>
                <TableCell><ConfirmDelete title="Delete this expense?" description="Ye entry hamesha ke liye hat jayegi." onConfirm={() => del.mutate(r.id)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
