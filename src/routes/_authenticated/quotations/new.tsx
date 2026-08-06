import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { DocForm } from "@/components/doc/DocForm";

export const Route = createFileRoute("/_authenticated/quotations/new")({
  head: () => ({
    meta: [
      { title: "New quotation · Owais Interior Designer CRM" },
      { name: "description", content: "Build a new interior design quotation with live totals." },
      { property: "og:title", content: "New quotation · Owais Interior Designer CRM" },
      { property: "og:description", content: "Line items, discount and amount in words." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewQuotation,
});

function NewQuotation() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="New Quotation" description="Add items and totals calculate live." />
      <DocForm kind="quotation" />
    </div>
  );
}
