import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { DocForm } from "@/components/doc/DocForm";
import { fetchInvoice } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/invoices/$id_/edit")({
  head: () => ({
    meta: [
      { title: "Edit invoice · Owais Interior Designer CRM" },
      { name: "description", content: "Update line items, discount and terms on an invoice." },
      { property: "og:title", content: "Edit invoice · Owais Interior Designer CRM" },
      { property: "og:description", content: "Update an existing customer invoice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditInvoice,
});

function EditInvoice() {
  const { id } = Route.useParams();
  const { data } = useQuery({ queryKey: ["invoice", id], queryFn: () => fetchInvoice(id) });

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title={`Edit ${data.doc.code}`} />
      <DocForm
        kind="invoice"
        initialItems={data.items}
        initialDoc={{
          id: data.doc.id,
          customer_id: data.doc.customer_id,
          date: data.doc.date,
          secondaryDate: "",
          subject: data.doc.subject ?? "",
          discount: Number(data.doc.discount),
          terms: data.doc.terms ?? "",
          status: data.doc.status,
          quotation_id: data.doc.quotation_id,
        }}
      />
    </div>
  );
}
