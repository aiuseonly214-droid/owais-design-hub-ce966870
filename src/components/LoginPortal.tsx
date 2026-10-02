import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logoAsset from "@/assets/owais-logo.png.asset.json";

export type Portal = "admin" | "employee";

/** Returns the caller's role row, or null when no access has been granted. */
async function readRole(userId: string): Promise<Portal | null> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role as string);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("employee")) return "employee";
  return null;
}

export function LoginShell({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
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
          <p className="text-xs uppercase tracking-[0.22em] text-sidebar-foreground/70">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

export function LoginPortal({ portal }: { portal: Portal }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const isAdmin = portal === "admin";

  useEffect(() => {
    let active = true;
    supabase.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) return void supabase.auth.signOut({ scope: "local" });
        if (data.user && (await readRole(data.user.id))) navigate({ to: "/dashboard", replace: true });
      })
      .catch(() => void supabase.auth.signOut({ scope: "local" }));
    return () => {
      active = false;
    };
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setBusy(false);
      if (error.message.toLowerCase().includes("invalid login credentials")) {
        return toast.error("Email ya password sahi nahi hai. Dobara check karein.");
      }
      return toast.error(error.message);
    }
    const role = await readRole(data.user.id);
    setBusy(false);
    if (!role) {
      await supabase.auth.signOut();
      return toast.error("Aapko abhi access nahi mila hai. Admin se role assign karwayein.");
    }
    if (role !== portal) {
      await supabase.auth.signOut();
      return toast.error(
        role === "admin"
          ? "Ye Administrator account hai — Admin Portal se login karein."
          : "Ye Employee account hai — Employee Portal se login karein.",
      );
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) await supabase.auth.signOut();
    toast.success("Account ban gaya. Admin access dene ke baad login karein.");
  }

  async function forgotPassword() {
    if (!email) return toast.error("Pehle apna email likhein");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Reset link email par bhej diya. Link 1 ghante tak valid hai.");
  }

  const signInForm = (
    <form className="space-y-4" onSubmit={signIn}>
      <div>
        <Label htmlFor="email" className="mb-1.5 block">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="password" className="mb-1.5 block">Password</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button className="w-full" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" />} Sign in
      </Button>
      <button type="button" onClick={forgotPassword} className="w-full text-center text-xs text-muted-foreground underline">
        Forgot password?
      </button>
    </form>
  );

  return (
    <LoginShell subtitle={isAdmin ? "Admin Portal" : "Employee Portal"}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isAdmin ? <ShieldCheck className="size-5 text-primary" /> : <UserRound className="size-5 text-primary" />}
            {isAdmin ? "Administrator sign in" : "Employee sign in"}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? "Settings, users aur poore business data ka control."
              : "Quotations, invoices, receipts aur customers par kaam karein."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            signInForm
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Request access</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">{signInForm}</TabsContent>
              <TabsContent value="signup">
                <form className="space-y-4" onSubmit={signUp}>
                  <div>
                    <Label htmlFor="name" className="mb-1.5 block">Full name</Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="email2" className="mb-1.5 block">Email</Label>
                    <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="password2" className="mb-1.5 block">Password</Label>
                    <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button className="w-full" disabled={busy}>
                    {busy && <Loader2 className="size-4 animate-spin" />} Create account
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Admin ke role dene ke baad hi login hoga.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-xs text-sidebar-foreground/70">
        {isAdmin ? "Employee ho? " : "Administrator ho? "}
        <Link to={isAdmin ? "/employee-login" : "/admin-login"} className="text-sidebar-primary underline">
          {isAdmin ? "Employee Portal" : "Admin Portal"}
        </Link>
      </p>
    </LoginShell>
  );
}
