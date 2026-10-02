import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoginShell } from "@/components/LoginPortal";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · Owais Interior Designer CRM" },
      {
        name: "description",
        content: "Choose the Admin or Employee portal to sign in to the Owais Interior Designer CRM.",
      },
      { property: "og:title", content: "Sign in · Owais Interior Designer CRM" },
      { property: "og:description", content: "Quotation, invoice and receipt management for Owais Interior Designer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthChooser,
});

function AuthChooser() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) return void supabase.auth.signOut({ scope: "local" });
        if (data.user) navigate({ to: "/dashboard", replace: true });
      })
      .catch(() => void supabase.auth.signOut({ scope: "local" }));
  }, [navigate]);

  const option = "flex items-center gap-4 rounded-lg border bg-card p-5 text-left transition-colors hover:border-primary";
  return (
    <LoginShell subtitle="Quotation & Billing CRM">
      <div className="space-y-3">
        <Link to="/admin-login" className={option}>
          <ShieldCheck className="size-8 text-primary" />
          <div>
            <p className="font-semibold text-card-foreground">Admin Portal</p>
            <p className="text-sm text-muted-foreground">Owner / administrator login</p>
          </div>
        </Link>
        <Link to="/employee-login" className={option}>
          <UserRound className="size-8 text-accent" />
          <div>
            <p className="font-semibold text-card-foreground">Employee Portal</p>
            <p className="text-sm text-muted-foreground">Staff login aur access request</p>
          </div>
        </Link>
      </div>
    </LoginShell>
  );
}
