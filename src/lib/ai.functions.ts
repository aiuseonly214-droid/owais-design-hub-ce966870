import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiText, parseAiJson } from "./ai.server";
import { UNITS, SERVICES } from "./options";

// ---------- AI Quotation Writer ----------

export type AiQuotationItem = {
  particular: string;
  unit: string;
  qty: number;
  rate: number;
};

export type AiQuotationSection = {
  name: string;
  items: AiQuotationItem[];
};

export type AiQuotationDraft = {
  subject: string;
  sections: AiQuotationSection[];
};

export const aiQuotationDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        requirement: z.string().min(5),
        customerName: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<AiQuotationDraft> => {
    const units = UNITS.join(", ");
    const text = await aiText([
      {
        role: "system",
        content:
          "You are an estimator for an Indian interior design firm (Owais Interior Designer, Nashik). " +
          "Given a customer requirement, draft a quotation with realistic market rates in INR. " +
          "Reply with ONLY a JSON object, no markdown, shaped exactly: " +
          '{"subject": string, "sections": [{"name": string, "items": [{"particular": string, "unit": string, "qty": number, "rate": number}]}]}. ' +
          `Rules: unit must be one of: ${units}. Group related work into named sections (e.g. "False Ceiling", "Modular Kitchen"); use 1-4 sections, 1-8 items each. ` +
          "Rates must be plausible Indian interior-work rates. Keep particulars short and specific. All numbers positive.",
      },
      {
        role: "user",
        content: `Customer: ${data.customerName || "N/A"}\nRequirement: ${data.requirement}`,
      },
    ]);
    const raw = parseAiJson<AiQuotationDraft>(text);
    // Clamp/validate so bad model output degrades instead of crashing the form.
    const sections = (Array.isArray(raw.sections) ? raw.sections : [])
      .slice(0, 6)
      .map((s) => ({
        name: String(s?.name || "Work").slice(0, 80),
        items: (Array.isArray(s?.items) ? s.items : []).slice(0, 15).map((it) => ({
          particular: String(it?.particular || "Item").slice(0, 120),
          unit: UNITS.includes(it?.unit as (typeof UNITS)[number]) ? it.unit : "Nos",
          qty: Math.max(0, Number(it?.qty) || 1),
          rate: Math.max(0, Number(it?.rate) || 0),
        })),
      }))
      .filter((s) => s.items.length > 0);
    if (sections.length === 0) throw new Error("AI ne items nahi banaye. Requirement thoda detail me likhein.");
    return { subject: String(raw.subject || "Interior Work Quotation").slice(0, 150), sections };
  });

// ---------- Inquiry Auto-Fill ----------

export type AiInquiryParse = {
  name: string;
  mobile: string;
  email: string;
  city: string;
  address: string;
  service: string;
  budget: string;
  notes: string;
};

export const aiParseInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ text: z.string().min(5) }).parse(data))
  .handler(async ({ data }): Promise<AiInquiryParse> => {
    const services = SERVICES.join(", ");
    const text = await aiText([
      {
        role: "system",
        content:
          "Extract customer inquiry details from messy text (Hindi/English/Hinglish, WhatsApp style). " +
          "Reply with ONLY a JSON object, no markdown: " +
          '{"name": string, "mobile": string, "email": string, "city": string, "address": string, "service": string, "budget": string, "notes": string}. ' +
          `service must be one of: ${services} (pick closest). mobile: digits only, 10 digits if present, else empty. ` +
          "budget: number as string if mentioned, else empty. Unknown fields = empty string. notes: short summary of the requirement.",
      },
      { role: "user", content: data.text },
    ]);
    const raw = parseAiJson<Partial<AiInquiryParse>>(text);
    const mobile = String(raw.mobile || "").replace(/\D/g, "").slice(0, 10);
    return {
      name: String(raw.name || "").slice(0, 80),
      mobile,
      email: String(raw.email || "").slice(0, 120),
      city: String(raw.city || "").slice(0, 60),
      address: String(raw.address || "").slice(0, 200),
      service: SERVICES.includes(raw.service as (typeof SERVICES)[number])
        ? (raw.service as string)
        : "Other",
      budget: String(raw.budget || "").replace(/[^\d.]/g, "").slice(0, 12),
      notes: String(raw.notes || "").slice(0, 500),
    };
  });

// ---------- Business Insights ----------

export const aiBusinessInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [inq, cust, quo, inv, rec] = await Promise.all([
      supabase.from("inquiries").select("status, created_at"),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("quotations").select("grand_total, status, date"),
      supabase.from("invoices").select("grand_total, status, date"),
      supabase.from("receipts").select("amount_received, date"),
    ]);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const inquiries = inq.data ?? [];
    const thisMonthInq = inquiries.filter((i) => i.created_at >= monthStart);
    const won = inquiries.filter((i) => i.status === "won").length;
    const invoices = inv.data ?? [];
    const receipts = rec.data ?? [];
    const invoicedTotal = invoices.reduce((s, i) => s + Number(i.grand_total || 0), 0);
    const receivedTotal = receipts.reduce((s, r) => s + Number(r.amount_received || 0), 0);
    const unpaidInvoices = invoices.filter((i) => i.status === "unpaid" || i.status === "partial");

    const stats = {
      total_inquiries: inquiries.length,
      inquiries_this_month: thisMonthInq.length,
      conversion_percent: inquiries.length ? Math.round((won / inquiries.length) * 100) : 0,
      total_customers: cust.count ?? 0,
      total_quotations: (quo.data ?? []).length,
      quotations_approved: (quo.data ?? []).filter((q) => q.status === "approved").length,
      total_invoiced_inr: Math.round(invoicedTotal),
      total_received_inr: Math.round(receivedTotal),
      outstanding_inr: Math.round(invoicedTotal - receivedTotal),
      unpaid_invoice_count: unpaidInvoices.length,
    };

    const text = await aiText([
      {
        role: "system",
        content:
          "You are a business advisor for a small Indian interior design firm. Given their CRM stats, give 4-6 short, " +
          "practical insights in simple Hinglish (Roman script). Use bullet points starting with '• '. " +
          "Focus on: follow-ups, pending payments, conversion improvement, and one growth tip. No markdown headers, no bold. Keep under 120 words.",
      },
      { role: "user", content: JSON.stringify(stats) },
    ]);
    return { insights: text.trim(), stats };
  });
