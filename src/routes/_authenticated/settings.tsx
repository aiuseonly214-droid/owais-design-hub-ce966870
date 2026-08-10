import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fetchCompany, updateCompany, type CompanyProfile } from "@/lib/crm";
import { fileToDataUrl } from "@/lib/image";
import { useRole, useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Owais Interior Designer CRM" },
      { name: "description", content: "Company profile, branding, default terms and password." },
      { property: "og:title", content: "Settings · Owais Interior Designer CRM" },
      { property: "og:description", content: "Update letterhead details used on every document." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const { data: role } = useRole(user?.id);
  const isAdmin = role === "admin";

  const { data: company } = useQuery({ queryKey: ["company"], queryFn: fetchCompany });
  const [form, setForm] = useState<CompanyProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (company) setForm(company);
  }, [company]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const { id, ...patch } = form;
      await updateCompany(id, patch);
      qc.invalidateQueries({ queryKey: ["company"] });
      toast.success("Company profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function pick(field: "logo_url" | "stamp_url" | "signature_url", file?: File | null) {
    if (!file || !form) return;
    try {
      const url = await fileToDataUrl(file, 600);
      setForm({ ...form, [field]: url });
      toast.success("Image ready — press Save to apply");
    } catch {
      toast.error("Could not read that image");
    }
  }

  async function changePassword() {
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    setPassword("");
    toast.success("Password updated");
  }

  if (!form) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Everything here appears on your quotations, invoices and receipts."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Row label="Business name" full>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Row>
            <Row label="Tagline" full>
              <Input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </Row>
            <Row label="Address" full>
              <Textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Row>
            <Row label="Mobile 1">
              <Input
                value={form.mobile1}
                onChange={(e) => setForm({ ...form, mobile1: e.target.value })}
              />
            </Row>
            <Row label="Mobile 2">
              <Input
                value={form.mobile2 ?? ""}
                onChange={(e) => setForm({ ...form, mobile2: e.target.value })}
              />
            </Row>
            <Row label="Email">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Row>
            <Row label="Website">
              <Input
                value={form.website ?? ""}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </Row>
            <Row label="Default terms & conditions" full>
              <Textarea
                rows={6}
                value={form.default_terms}
                onChange={(e) => setForm({ ...form, default_terms: e.target.value })}
              />
            </Row>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Branding</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <ImageField
                label="Logo"
                value={form.logo_url}
                onFile={(f) => pick("logo_url", f)}
                onClear={() => setForm({ ...form, logo_url: null })}
              />
              <ImageField
                label="Stamp"
                value={form.stamp_url}
                onFile={(f) => pick("stamp_url", f)}
                onClear={() => setForm({ ...form, stamp_url: null })}
              />
              <ImageField
                label="Signature"
                value={form.signature_url}
                onFile={(f) => pick("signature_url", f)}
                onClear={() => setForm({ ...form, signature_url: null })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change password</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <Label className="mb-1.5 block">New password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <Button variant="secondary" onClick={changePassword}>
                Update
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={save} disabled={saving || !isAdmin}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save company profile
        </Button>
        {!isAdmin && (
          <p className="text-sm text-muted-foreground">Only an administrator can edit these.</p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function ImageField({
  label,
  value,
  onFile,
  onClear,
}: {
  label: string;
  value: string | null;
  onFile: (f: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className="flex h-24 items-center justify-center rounded-md border bg-muted/30 p-2">
        {value ? (
          <img src={value} alt={`${label} preview`} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent">
          <Upload className="size-3.5" /> Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {value && (
          <button type="button" className="text-xs text-destructive" onClick={onClear}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
