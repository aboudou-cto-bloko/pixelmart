// filepath: src/components/affiliate/organisms/VendorCommissionsTable.tsx

"use client";

import type { Id } from "../../../../convex/_generated/dataModel";
import { CommissionStatusBadge } from "../molecules/CommissionStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, formatDate } from "@/lib/format";

interface Commission {
  _id: Id<"affiliate_commissions">;
  status: "pending" | "paid" | "cancelled";
  commission_amount: number;
  currency: string;
  commission_rate_bp: number;
  referlee_store_name?: string | null;
  order_number?: string | null;
  _creationTime: number;
}

interface VendorCommissionsTableProps {
  commissions: Commission[];
}

export function VendorCommissionsTable({
  commissions,
}: VendorCommissionsTableProps) {
  if (commissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
        Aucune commission enregistrée pour le moment.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Commande</TableHead>
            <TableHead>Boutique filleul</TableHead>
            <TableHead className="text-right">Taux</TableHead>
            <TableHead className="text-right">Commission</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.map((c) => (
            <TableRow key={c._id}>
              <TableCell className="font-mono text-xs">
                {c.order_number ?? "—"}
              </TableCell>
              <TableCell className="text-sm">
                {c.referlee_store_name ?? "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {(c.commission_rate_bp / 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {formatPrice(c.commission_amount, c.currency)}
              </TableCell>
              <TableCell>
                <CommissionStatusBadge status={c.status} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(c._creationTime)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
