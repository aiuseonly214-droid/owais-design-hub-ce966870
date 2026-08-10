import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "employee";

export type CompanyProfile = {
  id: string;
  name: string;
  tagline: string;
  address: string;
  mobile1: string;
  mobile2: string | null;
  email: string;
  website: string | null;
  logo_url: string | null;
  stamp_url: string | null;
  signature_url: string | null;
  currency: string;
  default_terms: string;
};

export type Customer = {
  id: string;
  code: string;
  name: string;
  mobile: string;
  alt_mobile: string | null;
  email: string | null;
  site_address: string | null;
  billing_address: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
};

export type DocItem = {
  id?: string;
  sr: number;
  particular: string;
  description: string | null;
  unit: string | null;
  qty: number;
  rate: number;
  amount: number;
};

export type Quotation = {
  id: string;
  code: string;
  customer_id: string;
  date: string;
  valid_till: string | null;
  subject: string | null;
  subtotal: number;
  discount: number;
  grand_total: number;
  amount_words: string | null;
  terms: string | null;
  status: string;
  created_at: string;
  customers?: Customer | null;
};

export type Invoice = {
  id: string;
  code: string;
  customer_id: string;
  quotation_id: string | null;
  date: string;
  due_date: string | null;
  subject: string | null;
  subtotal: number;
  discount: number;
  grand_total: number;
  amount_words: string | null;
  terms: string | null;
  status: string;
  created_at: string;
  customers?: Customer | null;
};

export type Receipt = {
  id: string;
  code: string;
  customer_id: string;
  invoice_id: string | null;
  date: string;
  total_amount: number;
  previous_paid: number;
  amount_received: number;
  balance: number;
  mode: string;
  txn_id: string | null;
  amount_words: string | null;
  notes: string | null;
  created_at: string;
  customers?: Customer | null;
};

const db = supabase as unknown as {
  from: (table: string) => any;
};

/** Current signed-in user id, used to stamp `created_by` on new rows. */
async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}


/* ---------------- company ---------------- */

export async function fetchCompany(): Promise<CompanyProfile> {
  const { data, error } = await db.from("company_profile").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data as CompanyProfile;
}

export async function updateCompany(id: string, patch: Partial<CompanyProfile>) {
  const { error } = await db.from("company_profile").update(patch).eq("id", id);
  if (error) throw error;
}

/* ---------------- role ---------------- */

export async function fetchMyRole(userId: string): Promise<Role> {
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle();
  return (data?.role as Role) ?? "employee";
}

/* ---------------- customers ---------------- */

export async function fetchCustomers(search = ""): Promise<Customer[]> {
  let q = db.from("customers").select("*").order("created_at", { ascending: false });
  if (search.trim()) {
    const s = `%${search.trim()}%`;
    q = q.or(`name.ilike.${s},mobile.ilike.${s},code.ilike.${s},city.ilike.${s}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const { data, error } = await db.from("customers").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Customer;
}

export async function saveCustomer(payload: Partial<Customer> & { id?: string }) {
  if (payload.id) {
    const { id, ...rest } = payload;
    const { error } = await db.from("customers").update(rest).eq("id", id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await db.from("customers").insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteCustomer(id: string) {
  const { error } = await db.from("customers").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- quotations ---------------- */

export async function fetchQuotations(search = ""): Promise<Quotation[]> {
  let q = db
    .from("quotations")
    .select("*, customers(*)")
    .order("created_at", { ascending: false });
  if (search.trim()) q = q.ilike("code", `%${search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Quotation[];
}

export async function fetchQuotation(id: string) {
  const { data, error } = await db.from("quotations").select("*, customers(*)").eq("id", id).single();
  if (error) throw error;
  const { data: items, error: e2 } = await db
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", id)
    .order("sr");
  if (e2) throw e2;
  return { doc: data as Quotation, items: (items ?? []) as DocItem[] };
}

export async function saveQuotation(doc: Partial<Quotation> & { id?: string }, items: DocItem[]) {
  let id = doc.id;
  const { id: _omit, customers: _c, code: _code, created_at: _ca, ...body } = doc as any;
  if (id) {
    const { error } = await db.from("quotations").update(body).eq("id", id);
    if (error) throw error;
    await db.from("quotation_items").delete().eq("quotation_id", id);
  } else {
    const { data, error } = await db.from("quotations").insert(body).select("id").single();
    if (error) throw error;
    id = data.id as string;
  }
  if (items.length) {
    const rows = items.map((it, i) => ({
      quotation_id: id,
      sr: i + 1,
      particular: it.particular,
      description: it.description,
      unit: it.unit,
      qty: it.qty,
      rate: it.rate,
      amount: it.amount,
    }));
    const { error } = await db.from("quotation_items").insert(rows);
    if (error) throw error;
  }
  return id as string;
}

export async function deleteQuotation(id: string) {
  const { error } = await db.from("quotations").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- invoices ---------------- */

export async function fetchInvoices(search = ""): Promise<Invoice[]> {
  let q = db.from("invoices").select("*, customers(*)").order("created_at", { ascending: false });
  if (search.trim()) q = q.ilike("code", `%${search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Invoice[];
}

export async function fetchInvoice(id: string) {
  const { data, error } = await db.from("invoices").select("*, customers(*)").eq("id", id).single();
  if (error) throw error;
  const { data: items, error: e2 } = await db
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("sr");
  if (e2) throw e2;
  return { doc: data as Invoice, items: (items ?? []) as DocItem[] };
}

export async function saveInvoice(doc: Partial<Invoice> & { id?: string }, items: DocItem[]) {
  let id = doc.id;
  const { id: _omit, customers: _c, code: _code, created_at: _ca, ...body } = doc as any;
  if (id) {
    const { error } = await db.from("invoices").update(body).eq("id", id);
    if (error) throw error;
    await db.from("invoice_items").delete().eq("invoice_id", id);
  } else {
    const { data, error } = await db.from("invoices").insert(body).select("id").single();
    if (error) throw error;
    id = data.id as string;
  }
  if (items.length) {
    const rows = items.map((it, i) => ({
      invoice_id: id,
      sr: i + 1,
      particular: it.particular,
      description: it.description,
      unit: it.unit,
      qty: it.qty,
      rate: it.rate,
      amount: it.amount,
    }));
    const { error } = await db.from("invoice_items").insert(rows);
    if (error) throw error;
  }
  return id as string;
}

export async function deleteInvoice(id: string) {
  const { error } = await db.from("invoices").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- receipts ---------------- */

export async function fetchReceipts(search = ""): Promise<Receipt[]> {
  let q = db.from("receipts").select("*, customers(*)").order("created_at", { ascending: false });
  if (search.trim()) q = q.ilike("code", `%${search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Receipt[];
}

export async function fetchReceipt(id: string): Promise<Receipt> {
  const { data, error } = await db.from("receipts").select("*, customers(*)").eq("id", id).single();
  if (error) throw error;
  return data as Receipt;
}

export async function saveReceipt(doc: Partial<Receipt> & { id?: string }) {
  const { id, customers: _c, code: _code, created_at: _ca, ...body } = doc as any;
  if (id) {
    const { error } = await db.from("receipts").update(body).eq("id", id);
    if (error) throw error;
    return id as string;
  }
  const { data, error } = await db.from("receipts").insert(body).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteReceipt(id: string) {
  const { error } = await db.from("receipts").delete().eq("id", id);
  if (error) throw error;
}

/** Sum of everything already received from a customer (optionally excluding one receipt). */
export async function fetchPaidSoFar(customerId: string, excludeReceiptId?: string) {
  let q = db.from("receipts").select("amount_received").eq("customer_id", customerId);
  if (excludeReceiptId) q = q.neq("id", excludeReceiptId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).reduce((s: number, r: any) => s + Number(r.amount_received || 0), 0);
}

/* ---------------- dashboard ---------------- */

export async function fetchSummary() {
  const [c, q, i, r] = await Promise.all([
    db.from("customers").select("id", { count: "exact", head: true }),
    db.from("quotations").select("id", { count: "exact", head: true }),
    db.from("invoices").select("grand_total"),
    db.from("receipts").select("amount_received"),
  ]);
  const invoiced = (i.data ?? []).reduce((s: number, x: any) => s + Number(x.grand_total || 0), 0);
  const received = (r.data ?? []).reduce((s: number, x: any) => s + Number(x.amount_received || 0), 0);
  return {
    customers: c.count ?? 0,
    quotations: q.count ?? 0,
    invoices: (i.data ?? []).length,
    invoiced,
    received,
    outstanding: Math.max(0, invoiced - received),
  };
}
