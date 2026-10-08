import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export const EXPENSE_CATEGORIES = [
  "Site Material / Hardware",
  "Carpenter / Labour Wages",
  "Office Rent & Electricity",
  "Transport / Petrol",
  "Software / Subscriptions",
  "Refreshments / Misc",
] as const;

export type Staff = {
  id: string;
  name: string;
  designation: string | null;
  phone: string | null;
  joining_date: string | null;
  monthly_salary: number;
  active: boolean;
  notes: string | null;
};
export type SalaryPayment = {
  id: string;
  staff_id: string;
  period: string;
  amount: number;
  paid_on: string;
  mode: string;
  notes: string | null;
  staff_members?: { name: string } | null;
};
export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  mode: string;
  reference: string | null;
  notes: string | null;
  customer_id: string | null;
  customers?: { name: string } | null;
};

function check<T>(r: { data: T; error: any }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}
async function uid() {
  return (await supabase.auth.getUser()).data.user?.id ?? null;
}

export async function fetchStaff(): Promise<Staff[]> {
  return check(await db.from("staff_members").select("*").order("name"));
}
export async function saveStaff(s: Partial<Staff> & { name: string }) {
  const { id, ...rest } = s;
  if (id) return check(await db.from("staff_members").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id));
  return check(await db.from("staff_members").insert({ ...rest, created_by: await uid() }));
}
export async function deleteStaff(id: string) {
  return check(await db.from("staff_members").delete().eq("id", id));
}

export async function fetchSalaries(): Promise<SalaryPayment[]> {
  return check(await db.from("salary_payments").select("*, staff_members(name)").order("paid_on", { ascending: false }));
}
export async function addSalary(p: Omit<SalaryPayment, "id" | "staff_members">) {
  return check(await db.from("salary_payments").insert({ ...p, created_by: await uid() }));
}
export async function deleteSalary(id: string) {
  return check(await db.from("salary_payments").delete().eq("id", id));
}

export async function fetchExpenses(): Promise<Expense[]> {
  return check(await db.from("expenses").select("*, customers(name)").order("date", { ascending: false }));
}
export async function addExpense(e: Omit<Expense, "id" | "customers">) {
  return check(await db.from("expenses").insert({ ...e, created_by: await uid() }));
}
export async function deleteExpense(id: string) {
  return check(await db.from("expenses").delete().eq("id", id));
}

/** Admin cash position: receipts in vs expenses + salaries out. */
export async function fetchCashflow() {
  const [r, e, s] = await Promise.all([
    db.from("receipts").select("amount_received, date"),
    db.from("expenses").select("amount, date"),
    db.from("salary_payments").select("amount, paid_on"),
  ]);
  const sum = (rows: any[] | null, k: string) => (rows ?? []).reduce((a, x) => a + Number(x[k] || 0), 0);
  const month = new Date().toISOString().slice(0, 7);
  const inflow = sum(r.data, "amount_received");
  const expenses = sum(e.data, "amount");
  const salaries = sum(s.data, "amount");
  const monthExpenses = sum((e.data ?? []).filter((x: any) => String(x.date).startsWith(month)), "amount");
  const monthSalaries = sum((s.data ?? []).filter((x: any) => String(x.paid_on).startsWith(month)), "amount");
  return { inflow, expenses, salaries, outflow: expenses + salaries, net: inflow - expenses - salaries, monthExpenses, monthSalaries };
}
