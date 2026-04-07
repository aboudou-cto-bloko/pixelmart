// filepath: src/components/affiliate/organisms/AdminCommissionsTable.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CommissionStatusBadge } from "../molecules/CommissionStatusBadge";
import { formatPrice, formatDate } from "@/lib/format";
import { Loader2, CheckSquare } from "lucide-react";
import { toast } from "sonner";

interface Commission {
  _id: Id<"affiliate_commissions">;
  status: "pending" | "paid" | "cancelled";
  commission_amount: number;
  currency: string;
  commission_rate_bp: number;
  order_subtotal: number;
  referrer_store_name?: string | null;
  referlee_store_name?: string | null;
  order_number?: string | null;
  _creationTime: number;
}

interface AdminCommissionsTableProps {
  commissions: Commission[];
}

export function AdminCommissionsTable({
  commissions,
}: AdminCommissionsTableProps) {
  const markPaid = useMutation(api.affiliate.mutations.markCommissionsPaid);
  const [selected, setSelected] = useState<Set<Id<"affiliate_commissions">>>(
    new Set(),
  );
  const [isMarking, setIsMarking] = useState(false);

  const pending = commissions.filter((c) => c.status === "pending");

  function toggleSelect(id: Id<"affiliate_commissions">) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((c) => c._id)));
    }
  }

  async function handleMarkPaid() {
    if (selected.size === 0) return;
    setIsMarking(true);
    try {
      await markPaid({ commission_ids: [...selected] });
      toast.success(`${selected.size} commission(s) marquée(s) comme payées`);
      setSelected(new Set());
    } catch {
      toast.error("Erreur lors du marquage");
    } finally {
      setIsMarking(false);
    }
  }

  if (commissions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
        Aucune commission enregistrée.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} sélectionnée(s)
          </span>
          <Button size="sm" onClick={handleMarkPaid} disabled={isMarking}>
            {isMarking ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckSquare className="mr-2 h-3.5 w-3.5" />
            )}
            Marquer payées
          </Button>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    selected.size === pending.length && pending.length > 0
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Commande</TableHead>
              <TableHead>Parrain</TableHead>
              <TableHead>Filleul</TableHead>
              <TableHead className="text-right">Taux</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.map((c) => (
              <TableRow
                key={c._id}
                className={selected.has(c._id) ? "bg-muted/30" : ""}
              >
                <TableCell>
                  {c.status === "pending" && (
                    <Checkbox
                      checked={selected.has(c._id)}
                      onCheckedChange={() => toggleSelect(c._id)}
                    />
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {c.order_number ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {c.referrer_store_name ?? "—"}
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
    </div>
  );
}
