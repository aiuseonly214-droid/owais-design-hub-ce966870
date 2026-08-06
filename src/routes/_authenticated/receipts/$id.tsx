import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DocActions } from "@/components/doc/DocActions";
import { ReceiptSheet } from "@/components/doc/ReceiptSheet";
import { fetchCompany, fetchReceipt } from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/receipts/$id")({
  head: () => ({
    meta: [
      { title: "Receipt · Owais Interior Designer CRM" },
      { name: "description", content: "View, print or download a customer payment receipt." },
      { property: "og:title", content: "Receipt · Owais Interior Designer CRM" },
      { property: "og:description", content: "A4 payment receipt with print and PDF export." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceiptView;
});

function ReceiptView() {
  const { id } = Route.useParams();
  const sheetRef = useRef<HTMLDivElement>(null);
  const { data: company } = useQuery({ queryKey: ["company"], queryFn: fetchCompany });
  const { data: receipt } = useQuery({ queryKey: ["receipt", id], queryFn: () => fetchReceipt(id) });

  if (!company || !receipt) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <DocActions filename={receipt.code} targetRef={sheetRef} />
      <ReceiptSheet
        ref={sheetRef}
        company={company}
        customer={receipt.customers}
        receipt={receipt}
      />
    </div>
  );
}
