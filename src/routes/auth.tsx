import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logoAsset from "@/assets/owais-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · Owais Interior Designer CRM" },
      {
        name: "description",
        content:
          "Sign in to the Owais Interior Designer CRM to create quotations, invoices and payment receipts.",
      },
      { property: "og:title", content: "Sign in · Owais Interior Designer CRM" },
      {
        property: "og:description",
        content: "Quotation, invoice and receipt management for Owais Interior Designer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          // Expired / corrupt stored session — wipe it so the form works again.
          void supabase.auth.signOut({ scope: "local" });
          return;
        }
        if (data.user) navigate({ to: "/dashboard", replace: true });
      })
      .catch(() => {
        void supabase.auth.signOut({ scope: "local" });
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        return toast.error("Email ya password sahi nahi hai. Dobara check karein.");
      }
      return toast.error(error.message);
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success("Account created");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.success("Account created. Check your email to confirm, then sign in.");
    }
  }

  async function forgotPassword() {
    if (!email) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent to your email");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src={logoAsset.url}
            alt="Owais Interior Designer logo"
            className="mb-3 size-24 rounded-full bg-white object-contain p-1"
          />
          <h1 className="font-display text-2xl text-sidebar-primary">Owais Interior Designer</h1>
          <p className="text-xs uppercase tracking-[0.22em] text-sidebar-foreground/70">
            Quotation &amp; Billing CRM
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in, or create the first admin account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form className="space-y-4" onSubmit={signIn}>
                  <div>
                    <Label htmlFor="email" className="mb-1.5 block">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="mb-1.5 block">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" disabled={busy}>
                    {busy && <Loader2 className="size-4 animate-spin" />} Sign in
                  </Button>
                  <button
                    type="button"
                    onClick={forgotPassword}
                    className="w-full text-center text-xs text-muted-foreground underline"
                  >
                    Forgot password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form className="space-y-4" onSubmit={signUp}>
                  <div>
                    <Label htmlFor="name" className="mb-1.5 block">
                      Full name
                    </Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email2" className="mb-1.5 block">
                      Email
                    </Label>
                    <Input
                      id="email2"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password2" className="mb-1.5 block">
                      Password
                    </Label>
                    <Input
                      id="password2"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" disabled={busy}>
                    {busy && <Loader2 className="size-4 animate-spin" />} Create account
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    The first account created becomes the Administrator.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
