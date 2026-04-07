// filepath: src/components/demo/organisms/DemoAccountsTable.tsx

"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  RotateCcw,
  Ban,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/format";

type InviteStatus = "pending" | "used" | "expired";

interface Invite {
  _id: Id<"demo_invites">;
  email: string;
  status: InviteStatus;
  invited_by_name: string;
  expires_at: number;
  used_at?: number;
  usedByName?: string;
  used_by?: Id<"users">;
  demoStoreId?: string;
  note?: string;
  _creationTime: number;
}

interface DemoAccountsTableProps {
  invites: Invite[];
}

const STATUS_CONFIG: Record<
  InviteStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  pending: { label: "En attente", variant: "secondary", icon: Clock },
  used: { label: "Activé", variant: "default", icon: CheckCircle },
  expired: { label: "Expiré", variant: "destructive", icon: XCircle },
};

export function DemoAccountsTable({ invites }: DemoAccountsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<{
    storeId: Id<"stores"> | null;
    email: string;
  } | null>(null);

  const revokeInvite = useMutation(api.demo.mutations.revokeInvite);
  const resetData = useAction(api.demo.actions.resetDemoData);

  const handleRevoke = async (inviteId: Id<"demo_invites">) => {
    setLoadingId(inviteId);
    try {
      await revokeInvite({ inviteId });
      toast.success("Invitation révoquée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReset = async () => {
    if (!resetTarget?.storeId) return;
    setLoadingId(resetTarget.storeId as string);
    try {
      await resetData({ storeId: resetTarget.storeId });
      toast.success(`Données démo de ${resetTarget.email} réinitialisées`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoadingId(null);
      setResetTarget(null);
    }
  };

  if (invites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucune invitation envoyée pour le moment.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Compte activé par</TableHead>
            <TableHead>Envoyée</TableHead>
            <TableHead>Expire / Activée</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((inv) => {
            const cfg = STATUS_CONFIG[inv.status];
            const Icon = cfg.icon;
            return (
              <TableRow key={inv._id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{inv.email}</p>
                    {inv.note && (
                      <p className="text-xs text-muted-foreground">
                        {inv.note}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={cfg.variant} className="gap-1">
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {inv.usedByName ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatRelativeTime(inv._creationTime)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {inv.status === "used" && inv.used_at
                    ? formatRelativeTime(inv.used_at)
                    : inv.status === "pending"
                      ? formatRelativeTime(inv.expires_at)
                      : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {inv.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={loadingId === inv._id}
                        onClick={() => handleRevoke(inv._id)}
                      >
                        {loadingId === inv._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                        <span className="ml-1.5">Révoquer</span>
                      </Button>
                    )}
                    {inv.status === "used" && inv.demoStoreId && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingId !== null}
                        onClick={() =>
                          setResetTarget({
                            storeId: inv.demoStoreId as Id<"stores">,
                            email: inv.email,
                          })
                        }
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5" />
                        Réinitialiser
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Réinitialiser les données démo ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Toutes les commandes, produits, transactions et notifications de{" "}
              <strong>{resetTarget?.email}</strong> seront supprimés. La
              boutique et le compte seront conservés. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loadingId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
