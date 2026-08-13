import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Pencil, Plus, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDelete } from "@/components/doc/ConfirmDelete";
import { formatDate, formatINR, isValidMobile, onlyDigits, onlyNumeric } from "@/lib/format";
import { INQUIRY_SOURCES, INQUIRY_STATUS, SERVICES, labelOf } from "@/lib/options";
import {
  convertInquiry,
  deleteInquiry,
  fetchInquiries,
  fetchInquiryStats,
  saveInquiry,
  type Inquiry,
} from "@/lib/crm";

export const Route = createFileRoute("/_authenticated/inquiries")({
  head: () => ({
    meta: [
      { title: "Inquiries · Owais Interior Designer CRM" },
      {
        name: "description",
        content: "Record every design enquiry and track how many convert into real business.",
      },
      { property: "og:title", content: "Inquiries · Owais Interior Designer CRM" },
      { property: "og:description", content: "Lead capture with conversion rate tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InquiriesPage,
});

type Draft = Partial<Inquiry>;

const STATUS_TONE: Record<string, string> = {
  new: "bg-secondary text-secondary-foreground",
  contacted: "bg-accent/15 text-accent-foreground",
  quoted: "bg-primary/10 text-primary",
  won: "bg-success/15 text-success",
  lost: "bg-destructive/10 text-destructive",
};

function InquiriesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["inquiries", search],
    queryFn: () => fetchInquiries(search),
  });
  const { data: stats } = useQuery({ queryKey: ["inquiry-stats"], queryFn: fetchInquiryStats });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["inquiries"] });
    qc.invalidateQueries({ queryKey: ["inquiry-stats"] });
    qc.invalidateQueries({ queryKey: ["customers"] });
    qc.invalidateQueries({ queryKey: ["summary"] });
  }

  const save = useMutation({
    mutationFn: (d: Draft) => saveInquiry(d),
    onSuccess: () => {
      toast.success("Inquiry saved");
      setDraft(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: deleteInquiry,
    onSuccess: () => {
      toast.success("Inquiry deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete this inquiry"),
  });

  const convert = useMutation({
    mutationFn: convertInquiry,
    onSuccess: (customerId) => {
      refresh();
      toast.success("Converted — customer created, now raise the quotation");
      navigate({ to: "/quotations/new", search: { customer: customerId } as never });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit() {
    const d = draft;
    if (!d) return;
    if (!d.name?.trim()) return toast.error("Name is required");
    if (!isValidMobile(String(d.mobile ?? ""))) return toast.error("Enter a valid 10-digit mobile");
    save.mutate({ ...d, budget: Number(d.budget || 0) });
  }

  const cards = [
    { label: "Total inquiries", value: String(stats?.total ?? 0) },
    { label: "Open / follow-up", value: String(stats?.open ?? 0) },
    { label: "Converted", value: String(stats?.won ?? 0) },
    { label: "Conversion rate", value: `${stats?.conversion ?? 0}%` },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Inquiries"
        description="Every enquiry recorded — so you know how much actually becomes business."
        action={
          <Button onClick={() => setDraft({ name: "", mobile: "", source: "walk_in", status: "new" })}>
            <Plus className="size-4" /> New inquiry
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-1 font-display text-2xl">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-3 p-5 text-sm">
          <TrendingUp className="size-5 text-accent" />
          <span className="text-muted-foreground">Expected value in open pipeline:</span>
          <span className="font-semibold">{formatINR(stats?.pipeline ?? 0)}</span>
          <span className="text-muted-foreground">· Lost: {stats?.lost ?? 0}</span>
        </CardContent>
      </Card>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, mobile, code or city"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && inquiries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No inquiries yet — add your first enquiry.
                    </TableCell>
                  </TableRow>
                )}
                {inquiries.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.code}</TableCell>
                    <TableCell>{i.name}</TableCell>
                    <TableCell>{i.mobile}</TableCell>
                    <TableCell>{labelOf(INQUIRY_SOURCES, i.source)}</TableCell>
                    <TableCell>{i.service || "—"}</TableCell>
                    <TableCell className="text-right">{formatINR(i.budget)}</TableCell>
                    <TableCell>{i.follow_up_date ? formatDate(i.follow_up_date) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_TONE[i.status]}>
                        {labelOf(INQUIRY_STATUS, i.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {i.status !== "won" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Convert to customer + quotation"
                            onClick={() => convert.mutate(i)}
                          >
                            <ArrowRightLeft className="size-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setDraft(i)}>
                          <Pencil className="size-4" />
                        </Button>
                        <ConfirmDelete
                          title={`Delete ${i.code}?`}
                          description="This inquiry record will be permanently removed."
                          onConfirm={() => remove.mutate(i.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit inquiry" : "New inquiry"}</DialogTitle>
          </DialogHeader>

          {draft && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={draft.name ?? ""}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Mobile *</Label>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={draft.mobile ?? ""}
                  onChange={(e) => setDraft({ ...draft, mobile: onlyDigits(e.target.value, 10) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>City</Label>
                <Input
                  value={draft.city ?? ""}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select
                  value={draft.source ?? "walk_in"}
                  onValueChange={(v) => setDraft({ ...draft, source: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_SOURCES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Service needed</Label>
                <Select
                  value={draft.service ?? ""}
                  onValueChange={(v) => setDraft({ ...draft, service: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Expected budget (₹)</Label>
                <Input
                  inputMode="decimal"
                  className="text-right"
                  value={draft.budget ? String(draft.budget) : ""}
                  onChange={(e) =>
                    setDraft({ ...draft, budget: Number(onlyNumeric(e.target.value) || 0) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={draft.status ?? "new"}
                  onValueChange={(v) => setDraft({ ...draft, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_STATUS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Next follow-up</Label>
                <Input
                  type="date"
                  value={draft.follow_up_date ?? ""}
                  onChange={(e) => setDraft({ ...draft, follow_up_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Requirement</Label>
                <Textarea
                  rows={3}
                  value={draft.requirement ?? ""}
                  onChange={(e) => setDraft({ ...draft, requirement: e.target.value })}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  rows={2}
                  value={draft.notes ?? ""}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Save inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
