import { createFileRoute } from "@tanstack/react-router";
import { LoginPortal } from "@/components/LoginPortal";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Portal · Owais Interior Designer CRM" },
      { name: "description", content: "Administrator sign in for the Owais Interior Designer CRM." },
      { property: "og:title", content: "Admin Portal · Owais Interior Designer CRM" },
      { property: "og:description", content: "Administrator sign in for the Owais Interior Designer CRM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LoginPortal portal="admin" />,
});
