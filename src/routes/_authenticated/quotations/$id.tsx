import { useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, FileText, Loader2, Pencil, Send, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DocActions } from "@/components/doc/DocActions";
import { TradeDocSheet } from "@/components/doc/TradeDocSheet";
import { fetchCompany, fetchQuotation, saveQuotation } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/quotations/$id")({
  head: () => ({
    meta: [
      { title: "Quotation · Owais Interior Designer CRM" },
      { name: "description", content: "View, print or download an interior design quotation." },
      { property: "og:title", content: "Quotation · Owais Interior Designer CRM" },
      { property: "og:description", content: "A4 quotation with print and PDF export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotationView,
});

function QuotationView() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const sheetRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  async function setStatus(status: "draft" | "sent" | "approved" | "rejected") {
    const { error } = await supabase.from("quotations").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Quotation marked ${status}`);
    qc.invalidateQueries({ queryKey: ["quotation", id] });
    qc.invalidateQueries({ queryKey: ["quotations"] });
  }

  const { data: company } = useQuery({ queryKey: ["company"], queryFn: fetchCompany });
  const { data } = useQuery({ queryKey: ["quotation", id], queryFn: () => fetchQuotation(id) });

  if (!company || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { doc, items } = data;

  async function duplicate() {
    if (!data) return;
    try {
      const newId = await saveQuotation(
        {
          customer_id: data.doc.customer_id,
          date: data.doc.date,
          valid_till: data.doc.valid_till,
          subject: data.doc.subject,
          subtotal: data.doc.subtotal,
          discount: data.doc.discount,
          grand_total: data.doc.grand_total,
          amount_words: data.doc.amount_words,
          terms: data.doc.terms,
          status: "draft",
          show_totals: data.doc.show_totals !== false,
          show_section_subtotals: data.doc.show_section_subtotals !== false,
          show_running_subtotals: data.doc.show_running_subtotals === true,
        } as never,
        data.items,
      );
      toast.success("Quotation duplicated");
      navigate({ to: "/quotations/$id", params: { id: newId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not duplicate");
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DocActions filename={doc.code} targetRef={sheetRef}>
        <Button asChild size="sm" variant="outline">
          <Link to="/quotations/$id/edit" params={{ id }}>
            <Pencil className="size-4" /> Edit
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={duplicate}>
          <Copy className="size-4" /> Duplicate
        </Button>
        {doc.status === "approved" ? (
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/invoices/new" search={{ from: id }}>
              <FileText className="size-4" /> Convert to Invoice
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled title="Pehle quotation Approved karein">
            <FileText className="size-4" /> Convert to Invoice
          </Button>
        )}
      </DocActions>

      <div className="no-print mb-5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge variant="secondary" className="capitalize">{doc.status}</Badge>
        {doc.status !== "sent" && doc.status !== "approved" && (
          <Button size="sm" variant="outline" onClick={() => setStatus("sent")}>
            <Send className="size-4" /> Mark as Sent
          </Button>
        )}
        {doc.status !== "approved" && (
          <Button size="sm" variant="outline" onClick={() => setStatus("approved")}>
            <Check className="size-4" /> Mark as Approved
          </Button>
        )}
        {doc.status !== "rejected" && (
          <Button size="sm" variant="outline" onClick={() => setStatus("rejected")}>
            <X className="size-4" /> Mark as Rejected
          </Button>
        )}
        {doc.status !== "draft" && (
          <Button size="sm" variant="ghost" onClick={() => setStatus("draft")}>
            Back to Draft
          </Button>
        )}
      </div>

      <TradeDocSheet
        ref={sheetRef}
        kind="QUOTATION"
        company={company}
        customer={doc.customers}
        items={items}
        doc={{
          code: doc.code,
          date: doc.date,
          secondaryDate: doc.valid_till,
          subject: doc.subject,
          subtotal: doc.subtotal,
          discount: doc.discount,
          grand_total: doc.grand_total,
          amount_words: doc.amount_words,
          terms: doc.terms,
          show_totals: doc.show_totals,
          show_section_subtotals: doc.show_section_subtotals,
          show_running_subtotals: doc.show_running_subtotals,
        }}
      />
    </div>
  );
}
