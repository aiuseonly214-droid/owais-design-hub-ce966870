import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DocListPage } from "@/components/doc/DocListPage";
import { fetchQuotations, deleteQuotation } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/quotations/")({
  head: () => ({
    meta: [
      { title: "Quotations · Owais Interior Designer CRM" },
      { name: "description", content: "All interior design quotations with status and totals." },
      { property: "og:title", content: "Quotations · Owais Interior Designer CRM" },
      { property: "og:description", content: "Create and track interior design quotations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotationsList,
});

function QuotationsList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["quotations", search],
    queryFn: () => fetchQuotations(search),
  });

  const remove = useMutation({
    mutationFn: deleteQuotation,
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete"),
  });

  return (
    <DocListPage
      onDelete={(id) => remove.mutate(id)}
      title="Quotations"
      description="Estimates shared with your customers."
      newTo="/quotations/new"
      isLoading={isLoading}
      search={search}
      onSearch={setSearch}
      rows={data.map((q) => ({
        id: q.id,
        code: q.code,
        date: q.date,
        customerName: q.customers?.name,
        amount: q.grand_total,
        status: q.status,
      }))}
      hrefFor={(id) => (
        <Button asChild size="sm" variant="ghost">
          <Link to="/quotations/$id" params={{ id }}>
            Open
          </Link>
        </Button>
      )}
    />
  );
}
