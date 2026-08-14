import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/format";

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
  const { data, error } = await db
    .from("customers")
    .insert({ ...payload, created_by: await currentUserId() })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/**
 * Delete a customer along with their whole paper trail (receipts, invoices,
 * quotations and their line items), because the foreign keys are restrictive.
 */
export async function deleteCustomer(id: string) {
  const { data: invs } = await db.from("invoices").select("id").eq("customer_id", id);
  const { data: qts } = await db.from("quotations").select("id").eq("customer_id", id);
  const invIds = (invs ?? []).map((r: any) => r.id);
  const qtIds = (qts ?? []).map((r: any) => r.id);

  await db.from("receipts").delete().eq("customer_id", id);
  if (invIds.length) {
    await db.from("invoice_items").delete().in("invoice_id", invIds);
    const { error } = await db.from("invoices").delete().in("id", invIds);
    if (error) throw error;
  }
  if (qtIds.length) {
    await db.from("quotation_items").delete().in("quotation_id", qtIds);
    const { error } = await db.from("quotations").delete().in("id", qtIds);
    if (error) throw error;
  }
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
    const { data, error } = await db
      .from("quotations")
      .insert({ ...body, created_by: await currentUserId() })
      .select("id")
      .single();
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
  await db.from("quotation_items").delete().eq("quotation_id", id);
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
    const { data, error } = await db
      .from("invoices")
      .insert({ ...body, created_by: await currentUserId() })
      .select("id")
      .single();
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
  // Totals may have moved, so the paid/partial/unpaid flag has to follow.
  await syncInvoiceStatus(id as string);
  return id as string;
}

export async function deleteInvoice(id: string) {
  await db.from("receipts").delete().eq("invoice_id", id);
  await db.from("invoice_items").delete().eq("invoice_id", id);
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
  const { data, error } = await db
    .from("receipts")
    .insert({ ...body, created_by: await currentUserId() })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/**
 * Recalculate an invoice's status from the receipts booked against it:
 * paid when fully settled, partial when something is received, unpaid otherwise.
 */
export async function syncInvoiceStatus(invoiceId: string) {
  const { data: inv } = await db
    .from("invoices")
    .select("grand_total")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv) return;
  const { data: rs } = await db.from("receipts").select("amount_received").eq("invoice_id", invoiceId);
  const paid = (rs ?? []).reduce((s: number, r: any) => s + Number(r.amount_received || 0), 0);
  const total = Number(inv.grand_total || 0);
  const status = paid <= 0 ? "unpaid" : paid + 0.5 >= total ? "paid" : "partial";
  await db.from("invoices").update({ status }).eq("id", invoiceId);
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

/* ---------------- inquiries ---------------- */

export type Inquiry = {
  id: string;
  code: string;
  name: string;
  mobile: string;
  city: string | null;
  source: string;
  service: string | null;
  requirement: string | null;
  budget: number;
  status: string;
  follow_up_date: string | null;
  notes: string | null;
  customer_id: string | null;
  quotation_id: string | null;
  converted_at: string | null;
  created_at: string;
};

export async function fetchInquiries(search = ""): Promise<Inquiry[]> {
  let q = db.from("inquiries").select("*").order("created_at", { ascending: false });
  if (search.trim()) {
    const s = `%${search.trim()}%`;
    q = q.or(`name.ilike.${s},mobile.ilike.${s},code.ilike.${s},city.ilike.${s}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Inquiry[];
}

export async function saveInquiry(payload: Partial<Inquiry> & { id?: string }) {
  const { id, code: _code, created_at: _ca, ...body } = payload as any;
  if (body.status === "won" && !body.converted_at) body.converted_at = new Date().toISOString();
  if (body.status && body.status !== "won") body.converted_at = null;

  if (id) {
    const { error } = await db.from("inquiries").update(body).eq("id", id);
    if (error) throw error;
    return id as string;
  }
  const { data, error } = await db
    .from("inquiries")
    .insert({ ...body, created_by: await currentUserId() })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteInquiry(id: string) {
  const { error } = await db.from("inquiries").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Turn an inquiry into a customer record so a quotation can be raised,
 * and mark the inquiry as won.
 */
export async function convertInquiry(inq: Inquiry): Promise<string> {
  let customerId = inq.customer_id;
  if (!customerId) {
    customerId = await saveCustomer({
      name: inq.name,
      mobile: inq.mobile,
      city: inq.city ?? undefined,
      site_address: inq.requirement ?? undefined,
      notes: `From inquiry ${inq.code}`,
    });
  }
  await saveInquiry({
    id: inq.id,
    customer_id: customerId,
    status: "won",
    converted_at: new Date().toISOString(),
  } as any);
  return customerId as string;
}

/** Inquiry funnel numbers for the dashboard. */
export async function fetchInquiryStats() {
  const { data, error } = await db.from("inquiries").select("status,budget");
  if (error) throw error;
  const rows = (data ?? []) as Array<{ status: string; budget: number }>;
  const total = rows.length;
  const won = rows.filter((r) => r.status === "won").length;
  const lost = rows.filter((r) => r.status === "lost").length;
  const open = total - won - lost;
  const pipeline = rows
    .filter((r) => r.status !== "won" && r.status !== "lost")
    .reduce((s, r) => s + Number(r.budget || 0), 0);
  return {
    total,
    won,
    lost,
    open,
    pipeline,
    conversion: total ? Math.round((won / total) * 1000) / 10 : 0,
  };
}

/* ---------------- outstanding / receivables ---------------- */

export type OutstandingInvoice = {
  id: string;
  code: string;
  date: string;
  due_date: string | null;
  total: number;
  paid: number;
  balance: number;
  status: "paid" | "partial" | "unpaid";
  overdue: boolean;
};

export type OutstandingCustomer = {
  customer_id: string;
  code: string;
  name: string;
  mobile: string;
  city: string | null;
  total: number;
  paid: number;
  balance: number;
  pendingCount: number;
  advance: number;
  oldestDue: string | null;
  invoices: OutstandingInvoice[];
};

/** Effective due date: the stored one, else 15 days after the invoice date. */
function effectiveDue(inv: { date: string; due_date: string | null }): string {
  if (inv.due_date) return inv.due_date;
  const d = new Date(inv.date);
  d.setDate(d.getDate() + 15);
  return d.toISOString().slice(0, 10);
}

/**
 * Customer-wise receivables built purely from live invoice + receipt rows.
 * Receipts booked against an invoice settle that invoice first; anything
 * received without an invoice link is applied oldest-invoice-first, and
 * whatever is left over is reported as an advance.
 */
export async function fetchOutstanding(): Promise<OutstandingCustomer[]> {
  const [{ data: invRows, error: e1 }, { data: recRows, error: e2 }, { data: custRows, error: e3 }] =
    await Promise.all([
      db.from("invoices").select("id,code,date,due_date,grand_total,customer_id").order("date"),
      db.from("receipts").select("customer_id,invoice_id,amount_received"),
      db.from("customers").select("id,code,name,mobile,city"),
    ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;

  const customers = new Map<string, any>((custRows ?? []).map((c: any) => [c.id, c]));
  const today = todayISO();

  // paid-per-invoice from linked receipts
  const linked = new Map<string, number>();
  const loose = new Map<string, number>();
  for (const r of (recRows ?? []) as any[]) {
    const amt = Number(r.amount_received || 0);
    if (!amt) continue;
    if (r.invoice_id) linked.set(r.invoice_id, (linked.get(r.invoice_id) ?? 0) + amt);
    else if (r.customer_id) loose.set(r.customer_id, (loose.get(r.customer_id) ?? 0) + amt);
  }

  const byCustomer = new Map<string, OutstandingCustomer>();
  for (const inv of (invRows ?? []) as any[]) {
    const c = customers.get(inv.customer_id);
    let bucket = byCustomer.get(inv.customer_id);
    if (!bucket) {
      bucket = {
        customer_id: inv.customer_id,
        code: c?.code ?? "—",
        name: c?.name ?? "Unknown customer",
        mobile: c?.mobile ?? "",
        city: c?.city ?? null,
        total: 0,
        paid: 0,
        balance: 0,
        pendingCount: 0,
        advance: 0,
        oldestDue: null,
        invoices: [],
      };
      byCustomer.set(inv.customer_id, bucket);
    }
    const total = Number(inv.grand_total || 0);
    const paid = Math.min(linked.get(inv.id) ?? 0, total);
    bucket.invoices.push({
      id: inv.id,
      code: inv.code,
      date: inv.date,
      due_date: inv.due_date,
      total,
      paid,
      balance: Math.max(0, total - paid),
      status: "unpaid",
      overdue: false,
    });
  }

  const out: OutstandingCustomer[] = [];
  for (const bucket of byCustomer.values()) {
    // apply unlinked receipts oldest invoice first
    let pool = loose.get(bucket.customer_id) ?? 0;
    for (const inv of bucket.invoices) {
      if (pool <= 0) break;
      const take = Math.min(pool, inv.balance);
      inv.paid += take;
      inv.balance -= take;
      pool -= take;
    }
    bucket.advance = Math.round(pool * 100) / 100;

    for (const inv of bucket.invoices) {
      inv.paid = Math.round(inv.paid * 100) / 100;
      inv.balance = Math.round(inv.balance * 100) / 100;
      inv.status = inv.balance <= 0.5 ? "paid" : inv.paid > 0 ? "partial" : "unpaid";
      inv.overdue = inv.status !== "paid" && effectiveDue(inv) < today;
      bucket.total += inv.total;
      bucket.paid += inv.paid;
      bucket.balance += inv.balance;
      if (inv.status !== "paid") {
        bucket.pendingCount += 1;
        const due = effectiveDue(inv);
        if (!bucket.oldestDue || due < bucket.oldestDue) bucket.oldestDue = due;
      }
    }
    bucket.total = Math.round(bucket.total * 100) / 100;
    bucket.paid = Math.round(bucket.paid * 100) / 100;
    bucket.balance = Math.round(bucket.balance * 100) / 100;
    bucket.invoices.sort((a, b) => (a.date < b.date ? 1 : -1));
    out.push(bucket);
  }

  out.sort((a, b) => b.balance - a.balance);
  return out;
}

/** Amount already received against a single invoice (linked receipts only). */
export async function fetchInvoicePaid(invoiceId: string): Promise<number> {
  const { data, error } = await db
    .from("receipts")
    .select("amount_received")
    .eq("invoice_id", invoiceId);
  if (error) throw error;
  return (data ?? []).reduce((s: number, r: any) => s + Number(r.amount_received || 0), 0);
}
