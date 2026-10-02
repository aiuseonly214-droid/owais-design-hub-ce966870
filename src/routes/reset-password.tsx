import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginShell } from "@/components/LoginPortal";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password · Owais Interior Designer CRM" },
      { name: "description", content: "Set a new password for your Owais Interior Designer CRM account." },
      { property: "og:title", content: "Reset password · Owais Interior Designer CRM" },
      { property: "og:description", content: "Set a new password for your CRM account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

type Stage = "checking" | "ready" | "invalid" | "done";

function ResetPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("checking");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Expired / reused links come back with an error in the URL hash or query.
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
    const err = params.get("error_code") || params.get("error");
    if (err) {
      setReason(
        err === "otp_expired"
          ? "Ye reset link expire ho gaya hai ya pehle use ho chuka hai."
          : params.get("error_description") ?? "Reset link valid nahi hai.",
      );
      setStage("invalid");
      return;
    }
    let settled = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && !settled)) {
        settled = true;
        setStage("ready");
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true;
        setStage("ready");
      }
    });
    const t = setTimeout(() => {
      if (!settled) {
        setReason("Reset link nahi mila ya expire ho gaya.");
        setStage("invalid");
      }
    }, 4000);
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password kam se kam 8 characters ka ho");
    if (password !== confirm) return toast.error("Dono password match nahi kar rahe");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    await supabase.auth.signOut();
    setStage("done");
    toast.success("Password update ho gaya. Naye password se login karein.");
    setTimeout(() => navigate({ to: "/auth", replace: true }), 1500);
  }

  return (
    <LoginShell subtitle="Password reset">
      <Card>
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Kam se kam 8 characters, dono box me same password.</CardDescription>
        </CardHeader>
        <CardContent>
          {stage === "checking" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Link verify ho raha hai…
            </p>
          )}
          {stage === "invalid" && (
            <div className="space-y-3 text-sm">
              <p className="text-destructive">{reason}</p>
              <p className="text-muted-foreground">Login page par "Forgot password?" se naya link mangwayein.</p>
              <Button asChild className="w-full"><Link to="/auth">Back to sign in</Link></Button>
            </div>
          )}
          {stage === "done" && <p className="text-sm">Password update ho gaya. Sign in page par le ja rahe hain…</p>}
          {stage === "ready" && (
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <Label htmlFor="np" className="mb-1.5 block">New password</Label>
                <Input id="np" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cp" className="mb-1.5 block">Confirm password</Label>
                <Input id="cp" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button className="w-full" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />} Update password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </LoginShell>
  );
}
