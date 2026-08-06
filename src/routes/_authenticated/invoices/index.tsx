import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DocListPage } from "@/components/doc/DocListPage";
import { fetchInvoices } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/invoices/")({
  head: () => ({
    meta: [
      { title: "Invoices · Owais Interior Designer CRM" },
      { name: "description", content: "All customer invoices with payment status and totals." },
      { property: "og:title", content: "Invoices · Owais Interior Designer CRM" },
      { property: "og:description", content: "Create and track interior design invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoicesList,
});

function InvoicesList() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["invoices", search],
    queryFn: () => fetchInvoices(search),
  });

  return (
    <DocListPage
      title="Invoices"
      description="Bills raised against completed or ongoing work."
      newTo="/invoices/new"
      isLoading={isLoading}
      search={search}
      onSearch={setSearch}
      rows={data.map((i) => ({
        id: i.id,
        code: i.code,
        date: i.date,
        customerName: i.customers?.name,
        amount: i.grand_total,
        status: i.status,
      }))}
      hrefFor={(id) => (
        <Button asChild size="sm" variant="ghost">
          <Link to="/invoices/$id" params={{ id }}>
            Open
          </Link>
        </Button>
      )}
    />
  );
}
