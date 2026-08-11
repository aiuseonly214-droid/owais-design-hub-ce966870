import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Keep the public entry point deterministic during SSR. The auth page
    // performs the client-side session check and forwards signed-in users.
    throw redirect({ to: "/auth", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Owais Interior Designer CRM" },
      {
        name: "description",
        content: "Secure quotation, invoice and receipt management for Owais Interior Designer.",
      },
      { property: "og:title", content: "Owais Interior Designer CRM" },
      {
        property: "og:description",
        content: "Secure quotation, invoice and receipt management for Owais Interior Designer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
