import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, IndianRupee, Search } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchOutstanding, type OutstandingCustomer } from "@/lib/crm";
import { formatDate, formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/outstanding")({
  head: () => ({
    meta: [
      { title: "Outstanding · Owais Interior Designer CRM" },
      {
        name: "description",
        content:
          "Customer-wise outstanding balances built from live invoices and recorded payments.",
      },
      { property: "og:title", content: "Outstanding · Owais Interior Designer CRM" },
      {
        property: "og:description",
        content: "Track pending, partially paid and overdue invoices per customer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OutstandingPage,
});

type Filter = "all" | "pending" | "partial" | "unpaid" | "overdue" | "settled";
type Sort = "balance" | "due" | "name" | "total";

function OutstandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["outstanding"],
    queryFn: fetchOutstanding,
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [sort, setSort] = useState<Sort>("balance");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    let list: OutstandingCustomer[] = data ?? [];
    const s = search.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.mobile.includes(s) ||
          c.code.toLowerCase().includes(s) ||
          (c.city ?? "").toLowerCase().includes(s),
      );
    }
    if (filter === "pending") list = list.filter((c) => c.balance > 0.5);
    if (filter === "settled") list = list.filter((c) => c.balance <= 0.5);
    if (filter === "partial")
      list = list.filter((c) => c.invoices.some((i) => i.status === "partial"));
    if (filter === "unpaid")
      list = list.filter((c) => c.invoices.some((i) => i.status === "unpaid"));
    if (filter === "overdue") list = list.filter((c) => c.invoices.some((i) => i.overdue));

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "total") return b.total - a.total;
      if (sort === "due") {
        if (!a.oldestDue) return 1;
        if (!b.oldestDue) return -1;
        return a.oldestDue < b.oldestDue ? -1 : 1;
      }
      return b.balance - a.balance;
    });
    return sorted;
  }, [data, search, filter, sort]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, c) => ({
          invoiced: acc.invoiced + c.total,
          received: acc.received + c.paid,
          balance: acc.balance + c.balance,
          pending: acc.pending + c.pendingCount,
        }),
        { invoiced: 0, received: 0, balance: 0, pending: 0 },
      ),
    [rows],
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Outstanding"
        description="Customer-wise receivables, calculated live from invoices and receipts."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total invoiced" value={formatINR(totals.invoiced)} />
        <Stat label="Total received" value={formatINR(totals.received)} />
        <Stat label="Outstanding" value={formatINR(totals.balance)} accent />
        <Stat label="Pending invoices" value={String(totals.pending)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search customer, mobile or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Has outstanding</SelectItem>
            <SelectItem value="partial">Partially paid</SelectItem>
            <SelectItem value="unpaid">Fully unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="settled">Fully settled</SelectItem>
            <SelectItem value="all">All customers</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="balance">Highest outstanding</SelectItem>
            <SelectItem value="due">Earliest due date</SelectItem>
            <SelectItem value="total">Highest invoiced</SelectItem>
            <SelectItem value="name">Customer name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nothing to show for this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-3" />
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3 text-right">Invoiced</th>
                  <th className="px-3 py-3 text-right">Paid</th>
                  <th className="px-3 py-3 text-right">Outstanding</th>
                  <th className="px-3 py-3 text-center">Pending</th>
                  <th className="px-3 py-3">Oldest due</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const isOpen = !!open[c.customer_id];
                  return (
                    <>
                      <tr
                        key={c.customer_id}
                        className="cursor-pointer border-t transition-colors hover:bg-muted/40"
                        onClick={() =>
                          setOpen((p) => ({ ...p, [c.customer_id]: !p[c.customer_id] }))
                        }
                      >
                        <td className="px-3 py-3 text-muted-foreground">
                          {isOpen ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.code} · {c.mobile}
                            {c.city ? ` · ${c.city}` : ""}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{formatINR(c.total)}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-accent-foreground">
                          {formatINR(c.paid)}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3 text-right font-semibold tabular-nums",
                            c.balance > 0.5 ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {formatINR(c.balance)}
                          {c.advance > 0.5 && (
                            <span className="block text-[11px] font-normal text-muted-foreground">
                              advance {formatINR(c.advance)}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">{c.pendingCount}</td>
                        <td className="px-3 py-3">
                          {c.oldestDue ? formatDate(c.oldestDue) : "—"}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr key={`${c.customer_id}-detail`} className="border-t bg-muted/20">
                          <td colSpan={7} className="px-3 py-3">
                            <table className="w-full text-xs">
                              <thead className="text-left uppercase tracking-wide text-muted-foreground">
                                <tr>
                                  <th className="py-1.5">Invoice</th>
                                  <th className="py-1.5">Date</th>
                                  <th className="py-1.5">Due date</th>
                                  <th className="py-1.5 text-right">Amount</th>
                                  <th className="py-1.5 text-right">Paid</th>
                                  <th className="py-1.5 text-right">Balance</th>
                                  <th className="py-1.5">Status</th>
                                  <th className="py-1.5" />
                                </tr>
                              </thead>
                              <tbody>
                                {c.invoices.map((inv) => (
                                  <tr key={inv.id} className="border-t border-border/60">
                                    <td className="py-2 font-medium">
                                      <Link
                                        to="/invoices/$id"
                                        params={{ id: inv.id }}
                                        className="hover:underline"
                                      >
                                        {inv.code}
                                      </Link>
                                    </td>
                                    <td className="py-2">{formatDate(inv.date)}</td>
                                    <td className="py-2">
                                      {inv.due_date ? formatDate(inv.due_date) : "—"}
                                    </td>
                                    <td className="py-2 text-right tabular-nums">
                                      {formatINR(inv.total)}
                                    </td>
                                    <td className="py-2 text-right tabular-nums">
                                      {formatINR(inv.paid)}
                                    </td>
                                    <td className="py-2 text-right font-medium tabular-nums">
                                      {formatINR(inv.balance)}
                                    </td>
                                    <td className="py-2">
                                      <StatusPill status={inv.status} overdue={inv.overdue} />
                                    </td>
                                    <td className="py-2 text-right">
                                      {inv.balance > 0.5 && (
                                        <Button asChild size="sm" variant="outline">
                                          <Link to="/receipts/new" search={{ invoice: inv.id }}>
                                            <IndianRupee className="size-3.5" /> Record
                                          </Link>
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-xl font-semibold tabular-nums",
            accent && "text-destructive",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function StatusPill({ status, overdue }: { status: string; overdue: boolean }) {
  const label = overdue ? "Overdue" : status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Unpaid";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        overdue
          ? "bg-destructive/10 text-destructive"
          : status === "paid"
            ? "bg-accent/15 text-accent-foreground"
            : status === "partial"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
