import { createFileRoute } from "@tanstack/react-router";
import { LoginPortal } from "@/components/LoginPortal";

export const Route = createFileRoute("/employee-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Employee Portal · Owais Interior Designer CRM" },
      { name: "description", content: "Employee sign in for quotations, invoices and receipts." },
      { property: "og:title", content: "Employee Portal · Owais Interior Designer CRM" },
      { property: "og:description", content: "Employee sign in for quotations, invoices and receipts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LoginPortal portal="employee" />,
});
