import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { DocForm } from "@/components/doc/DocForm";
import { fetchQuotation } from "@/lib/crm";
import { todayISO } from "@/lib/format";

type NewInvoiceSearch = { from?: string };

export const Route = createFileRoute("/_authenticated/invoices/new")({
  validateSearch: (search: Record<string, unknown>): NewInvoiceSearch => ({
    from: typeof search['from'] === "string" ? search['from'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New invoice · Owais Interior Designer CRM" },
      { name: "description", content: "Raise a new invoice, or convert an approved quotation." },
      { property: "og:title", content: "New invoice · Owais Interior Designer CRM" },
      { property: "og:description", content: "Line items, discount and amount in words." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewInvoice,
});

function NewInvoice() {
  const { from } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["quotation", from],
    queryFn: () => fetchQuotation(from!),
    enabled: !!from,
  });

  if (from && isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="New Invoice"
        description={data ? `Converted from ${data.doc.code}` : "Add items and totals calculate live."}
      />
      <DocForm
        kind="invoice"
        initialItems={data?.items}
        initialDoc={
          data
            ? {
                customer_id: data.doc.customer_id,
                date: todayISO(),
                secondaryDate: "",
                subject: data.doc.subject ?? "",
                discount: Number(data.doc.discount),
                terms: data.doc.terms ?? "",
                status: "unpaid",
                show_totals: data.doc.show_totals !== false,
                show_section_subtotals: data.doc.show_section_subtotals !== false,
                quotation_id: data.doc.id,
              }
            : undefined
        }
      />
    </div>
  );
}
