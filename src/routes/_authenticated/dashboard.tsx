import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, Receipt as ReceiptIcon, ScrollText, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchInvoices, fetchQuotations, fetchReceipts, fetchSummary } from "@/lib/crm";
import { formatDate, formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Owais Interior Designer CRM" },
      {
        name: "description",
        content: "Overview of customers, quotations, invoices and outstanding payments.",
      },
      { property: "og:title", content: "Dashboard · Owais Interior Designer CRM" },
      { property: "og:description", content: "Quotation, invoice and receipt overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: s } = useQuery({ queryKey: ["summary"], queryFn: fetchSummary });
  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations", ""],
    queryFn: () => fetchQuotations(""),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", ""],
    queryFn: () => fetchInvoices(""),
  });
  const { data: receipts = [] } = useQuery({
    queryKey: ["receipts", ""],
    queryFn: () => fetchReceipts(""),
  });

  const cards = [
    { label: "Customers", value: String(s?.customers ?? 0), icon: Users },
    { label: "Quotations", value: String(s?.quotations ?? 0), icon: ScrollText },
    { label: "Invoiced", value: formatINR(s?.invoiced ?? 0), icon: FileText },
    { label: "Outstanding", value: formatINR(s?.outstanding ?? 0), icon: ReceiptIcon },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        description="Your quotations, invoices and payments at a glance."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/quotations/new">
            <Plus className="size-4" /> New Quotation
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link to="/invoices/new">
            <Plus className="size-4" /> New Invoice
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link to="/receipts/new">
            <Plus className="size-4" /> New Receipt
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/customers">
            <Plus className="size-4" /> New Customer
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="truncate font-display text-xl">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <RecentCard title="Recent Quotations">
          {quotations.slice(0, 5).map((q) => (
            <Link
              key={q.id}
              to="/quotations/$id"
              params={{ id: q.id }}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{q.code}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {q.customers?.name} · {formatDate(q.date)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{formatINR(q.grand_total)}</span>
            </Link>
          ))}
          {quotations.length === 0 && <Empty>No quotations yet</Empty>}
        </RecentCard>

        <RecentCard title="Recent Invoices">
          {invoices.slice(0, 5).map((i) => (
            <Link
              key={i.id}
              to="/invoices/$id"
              params={{ id: i.id }}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{i.code}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {i.customers?.name} · {formatDate(i.date)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{formatINR(i.grand_total)}</span>
            </Link>
          ))}
          {invoices.length === 0 && <Empty>No invoices yet</Empty>}
        </RecentCard>

        <RecentCard title="Recent Receipts">
          {receipts.slice(0, 5).map((r) => (
            <Link
              key={r.id}
              to="/receipts/$id"
              params={{ id: r.id }}
              className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.code}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.customers?.name} · {formatDate(r.date)}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{formatINR(r.amount_received)}</span>
            </Link>
          ))}
          {receipts.length === 0 && <Empty>No receipts yet</Empty>}
        </RecentCard>
      </div>
    </div>
  );
}

function RecentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-4 text-sm text-muted-foreground">{children}</p>;
}
