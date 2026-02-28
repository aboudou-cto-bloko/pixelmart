// filepath: src/components/returns/VendorReturnTable.tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ReturnStatusBadge } from "./ReturnStatusBadge";
import { ReturnReasonBadge } from "./ReturnReasonBadge";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReturnDetailSheet } from "./ReturnDetailSheet";
import type { Id } from "../../../convex/_generated/dataModel";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tous les retours" },
  { value: "requested", label: "En attente" },
  { value: "approved", label: "Approuvés" },
  { value: "received", label: "Reçus" },
  { value: "refunded", label: "Remboursés" },
  { value: "rejected", label: "Refusés" },
];

export function VendorReturnTable() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReturnId, setSelectedReturnId] =
    useState<Id<"return_requests"> | null>(null);

  const returns = useQuery(api.returns.queries.listByStore, {
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  const counts = useQuery(api.returns.queries.countByStatus);

  const isLoading = returns === undefined;

  return (
    <div className="space-y-4">
      {/* KPI badges */}
      {counts && (
        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 px-3 py-1.5 text-sm">
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {counts.requested}
            </span>{" "}
            <span className="text-muted-foreground">en attente</span>
          </div>
          <div className="rounded-lg border bg-blue-500/5 border-blue-500/20 px-3 py-1.5 text-sm">
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {counts.approved}
            </span>{" "}
            <span className="text-muted-foreground">approuvés</span>
          </div>
          <div className="rounded-lg border bg-violet-500/5 border-violet-500/20 px-3 py-1.5 text-sm">
            <span className="font-semibold text-violet-700 dark:text-violet-400">
              {counts.received}
            </span>{" "}
            <span className="text-muted-foreground">reçus</span>
          </div>
          <div className="rounded-lg border bg-emerald-500/5 border-emerald-500/20 px-3 py-1.5 text-sm">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {counts.refunded}
            </span>{" "}
            <span className="text-muted-foreground">remboursés</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commande</TableHead>
              <TableHead className="hidden sm:table-cell">Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="hidden md:table-cell">Motif</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-14" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}

            {returns && returns.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>Aucun retour trouvé</p>
                </TableCell>
              </TableRow>
            )}

            {returns?.map((ret) => (
              <TableRow
                key={ret._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedReturnId(ret._id)}
              >
                <TableCell className="font-medium text-sm">
                  {ret.order_number}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {ret.customer_name}
                </TableCell>
                <TableCell>
                  <ReturnStatusBadge status={ret.status as any} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <ReturnReasonBadge category={ret.reason_category as any} />
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatPrice(ret.refund_amount, "XOF")}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatRelativeTime(ret.requested_at)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <ReturnDetailSheet
        returnId={selectedReturnId}
        onClose={() => setSelectedReturnId(null)}
      />
    </div>
  );
}
