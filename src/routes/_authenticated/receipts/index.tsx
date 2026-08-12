import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DocListPage } from "@/components/doc/DocListPage";
import { fetchReceipts, deleteReceipt } from "@/lib/crm";
import { labelOf, PAYMENT_MODES } from "@/lib/options";

export const Route = createFileRoute("/_authenticated/receipts/")({
  head: () => ({
    meta: [
      { title: "Receipts · Owais Interior Designer CRM" },
      { name: "description", content: "Payment receipts issued to customers with balance tracking." },
      { property: "og:title", content: "Receipts · Owais Interior Designer CRM" },
      { property: "og:description", content: "Record payments and print A4 receipts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceiptsList,
});

function ReceiptsList() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["receipts", search],
    queryFn: () => fetchReceipts(search),
  });

  const remove = useMutation({
    mutationFn: deleteReceipt,
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["receipts"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete"),
  });

  return (
    <DocListPage
      onDelete={(id) => remove.mutate(id)}
      title="Receipts"
      description="Money received against invoices and projects."
      newTo="/receipts/new"
      isLoading={isLoading}
      search={search}
      onSearch={setSearch}
      amountLabel="Received"
      rows={data.map((r) => ({
        id: r.id,
        code: r.code,
        date: r.date,
        customerName: r.customers?.name,
        amount: r.amount_received,
        status: labelOf(PAYMENT_MODES, r.mode),
      }))}
      hrefFor={(id) => (
        <Button asChild size="sm" variant="ghost">
          <Link to="/receipts/$id" params={{ id }}>
            Open
          </Link>
        </Button>
      )}
    />
  );
}
