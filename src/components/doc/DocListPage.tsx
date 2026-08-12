import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDelete } from "@/components/doc/ConfirmDelete";
import { formatDate, formatINR } from "@/lib/format";

export type DocListRow = {
  id: string;
  code: string;
  date: string;
  customerName: string | undefined;
  amount: number;
  status: string;
};

export function DocListPage({
  title,
  description,
  newTo,
  rows,
  isLoading,
  search,
  onSearch,
  hrefFor,
  amountLabel = "Amount",
  onDelete,
}: {
  title: string;
  description: string;
  newTo: "/quotations/new" | "/invoices/new" | "/receipts/new";
  rows: DocListRow[];
  isLoading: boolean;
  search: string;
  onSearch: (v: string) => void;
  hrefFor: (id: string) => React.ReactNode;
  amountLabel?: string;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={title}
        description={description}
        action={
          <Button asChild>
            <Link to={newTo}>
              <Plus className="size-4" /> New
            </Link>
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by document number"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">{amountLabel}</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nothing here yet
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell className="font-medium">{r.customerName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatINR(r.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {hrefFor(r.id)}
                      {onDelete && (
                        <ConfirmDelete
                          label={`Delete ${r.code}`}
                          description="This permanently removes the document and everything linked to it."
                          onConfirm={() => onDelete(r.id)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function useSearchState(initial = "") {
  return useState(initial);
}
