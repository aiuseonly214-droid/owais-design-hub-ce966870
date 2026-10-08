import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDelete } from "@/components/doc/ConfirmDelete";
import { requireAdmin } from "@/lib/guards";
import { addSalary, deleteSalary, deleteStaff, fetchSalaries, fetchStaff, saveStaff } from "@/lib/finance";
import { formatDate, formatINR, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/payroll")({
  head: () => ({
    meta: [
      { title: "Staff & Salary · Owais Interior Designer CRM" },
      { name: "description", content: "Admin-only employee directory and monthly salary payouts." },
      { property: "og:title", content: "Staff & Salary · Owais Interior Designer CRM" },
      { property: "og:description", content: "Team directory with salary payout log." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => requireAdmin(),
  component: PayrollPage,
});

const MODES = [{ v: "bank", l: "Bank" }, { v: "upi", l: "UPI" }, { v: "cash", l: "Cash" }];

function PayrollPage() {
  const qc = useQueryClient();
  const { data: staff = [] } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  const { data: pays = [] } = useQuery({ queryKey: ["salaries"], queryFn: fetchSalaries });
  const refresh = () => ["staff", "salaries", "cashflow"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const [s, setS] = useState({ name: "", designation: "", phone: "", joining_date: "", monthly_salary: "" });
  const addStaff = useMutation({
    mutationFn: () => {
      if (!s.name.trim()) throw new Error("Naam zaroori hai");
      if (s.phone && !/^\d{10}$/.test(s.phone)) throw new Error("Phone 10 digit ka hona chahiye");
      return saveStaff({ name: s.name.trim(), designation: s.designation || null, phone: s.phone || null, joining_date: s.joining_date || null, monthly_salary: Number(s.monthly_salary) || 0, active: true });
    },
    onSuccess: () => { toast.success("Staff added"); setS({ name: "", designation: "", phone: "", joining_date: "", monthly_salary: "" }); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({ mutationFn: (x: { id: string; active: boolean; name: string }) => saveStaff(x), onSuccess: refresh });
  const delStaff = useMutation({ mutationFn: deleteStaff, onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });

  const month = new Date().toISOString().slice(0, 7);
  const [p, setP] = useState({ staff_id: "", period: month, amount: "", paid_on: todayISO(), mode: "bank", notes: "" });
  const pay = useMutation({
    mutationFn: () => {
      if (!p.staff_id) throw new Error("Employee chuniye");
      const amount = Number(p.amount);
      if (!(amount > 0)) throw new Error("Amount 0 se zyada hona chahiye");
      return addSalary({ staff_id: p.staff_id, period: p.period, amount, paid_on: p.paid_on, mode: p.mode, notes: p.notes || null });
    },
    onSuccess: () => { toast.success("Salary recorded"); setP({ ...p, amount: "", notes: "" }); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delPay = useMutation({ mutationFn: deleteSalary, onSuccess: refresh });

  const active = staff.filter((x) => x.active);
  const payroll = active.reduce((a, x) => a + Number(x.monthly_salary), 0);
  const paidThisMonth = pays.filter((x) => x.period === month).reduce((a, x) => a + Number(x.amount), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Staff & Salary" description="Team ki details aur har mahine ki salary — sirf admin ke liye." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[["Active staff", String(active.length)], ["Monthly payroll", formatINR(payroll)], ["Paid this month", formatINR(paidThisMonth)]].map(([l, v]) => (
          <Card key={l}><CardContent className="pt-6"><p className="text-xs uppercase tracking-wider text-muted-foreground">{l}</p><p className="font-display text-xl">{v}</p></CardContent></Card>
        ))}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Add staff member</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); addStaff.mutate(); }}>
              <div><Label>Name</Label><Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></div>
              <div><Label>Designation</Label><Input placeholder="Site Supervisor" value={s.designation} onChange={(e) => setS({ ...s, designation: e.target.value })} /></div>
              <div><Label>Phone</Label><Input inputMode="numeric" maxLength={10} value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value.replace(/\D/g, "") })} /></div>
              <div><Label>Joining date</Label><Input type="date" value={s.joining_date} onChange={(e) => setS({ ...s, joining_date: e.target.value })} /></div>
              <div><Label>Monthly salary (₹)</Label><Input type="number" min="0" value={s.monthly_salary} onChange={(e) => setS({ ...s, monthly_salary: e.target.value })} /></div>
              <div className="flex items-end"><Button type="submit" className="w-full" disabled={addStaff.isPending}><Plus className="size-4" /> Add</Button></div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Record salary payout</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); pay.mutate(); }}>
              <div><Label>Employee</Label>
                <Select value={p.staff_id} onValueChange={(v) => { const st = staff.find((x) => x.id === v); setP({ ...p, staff_id: v, amount: p.amount || String(st?.monthly_salary ?? "") }); }}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{active.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Salary month</Label><Input type="month" value={p.period} onChange={(e) => setP({ ...p, period: e.target.value })} /></div>
              <div><Label>Amount (₹)</Label><Input type="number" min="0" value={p.amount} onChange={(e) => setP({ ...p, amount: e.target.value })} /></div>
              <div><Label>Paid on</Label><Input type="date" value={p.paid_on} onChange={(e) => setP({ ...p, paid_on: e.target.value })} /></div>
              <div><Label>Mode</Label>
                <Select value={p.mode} onValueChange={(v) => setP({ ...p, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODES.map((m) => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Notes / slip</Label><Input value={p.notes} onChange={(e) => setP({ ...p, notes: e.target.value })} /></div>
              <Button type="submit" className="sm:col-span-2" disabled={pay.isPending}>Save payout</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6"><CardHeader><CardTitle className="text-base">Team</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Designation</TableHead><TableHead>Phone</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Salary</TableHead><TableHead>Active</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {staff.length === 0 && <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No staff yet</TableCell></TableRow>}
              {staff.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="font-medium">{x.name}</TableCell>
                  <TableCell>{x.designation ?? "—"}</TableCell>
                  <TableCell>{x.phone ?? "—"}</TableCell>
                  <TableCell>{x.joining_date ? formatDate(x.joining_date) : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(x.monthly_salary)}</TableCell>
                  <TableCell><Switch checked={x.active} onCheckedChange={(v) => toggle.mutate({ id: x.id, active: v, name: x.name })} /></TableCell>
                  <TableCell><ConfirmDelete label="Delete staff member" description="Iske saare salary records bhi hat jayenge." onConfirm={() => delStaff.mutate(x.id)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card><CardHeader><CardTitle className="text-base">Salary payouts</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Month</TableHead><TableHead>Paid on</TableHead><TableHead>Mode</TableHead><TableHead>Notes</TableHead><TableHead className="text-right">Amount</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {pays.length === 0 && <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No payouts yet</TableCell></TableRow>}
              {pays.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>{x.staff_members?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{x.period}</Badge></TableCell>
                  <TableCell>{formatDate(x.paid_on)}</TableCell>
                  <TableCell className="uppercase">{x.mode}</TableCell>
                  <TableCell>{x.notes ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatINR(x.amount)}</TableCell>
                  <TableCell><ConfirmDelete label="Delete payout" description="Ye salary entry hat jayegi." onConfirm={() => delPay.mutate(x.id)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
