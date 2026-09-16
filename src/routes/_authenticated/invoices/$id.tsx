import { useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocActions } from "@/components/doc/DocActions";
import { TradeDocSheet } from "@/components/doc/TradeDocSheet";
import { fetchCompany, fetchInvoice } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  head: () => ({
    meta: [
      { title: "Invoice · Owais Interior Designer CRM" },
      { name: "description", content: "View, print or download a customer invoice." },
      { property: "og:title", content: "Invoice · Owais Interior Designer CRM" },
      { property: "og:description", content: "A4 invoice with print and PDF export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoiceView,
});

function InvoiceView() {
  const { id } = Route.useParams();
  const sheetRef = useRef<HTMLDivElement>(null);
  const { data: company } = useQuery({ queryKey: ["company"], queryFn: fetchCompany });
  const { data } = useQuery({ queryKey: ["invoice", id], queryFn: () => fetchInvoice(id) });

  if (!company || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { doc, items } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DocActions filename={doc.code} targetRef={sheetRef}>
        <Button asChild size="sm" variant="outline">
          <Link to="/invoices/$id/edit" params={{ id }}>
            <Pencil className="size-4" /> Edit
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/receipts/new" search={{ invoice: id }}>
            <IndianRupee className="size-4" /> Record Payment
          </Link>
        </Button>
      </DocActions>

      <TradeDocSheet
        ref={sheetRef}
        kind="INVOICE"
        company={company}
        customer={doc.customers}
        items={items}
        doc={{
          code: doc.code,
          date: doc.date,
          secondaryDate: doc.due_date,
          subject: doc.subject,
          subtotal: doc.subtotal,
          discount: doc.discount,
          grand_total: doc.grand_total,
          amount_words: doc.amount_words,
          terms: doc.terms,
          show_totals: doc.show_totals,
        }}
      />
    </div>
  );
}
