// filepath: src/components/admin/templates/AdminStoresTemplate.tsx

"use client";

import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { formatPrice, formatDate } from "@/lib/format";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Store, X, CheckCircle2, Ban } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

type StoreItem = {
  _id: Id<"stores">;
  name: string;
  slug: string;
  is_verified: boolean;
  status: string;
  subscription_tier: string;
  balance: number;
  currency: string;
  _creationTime: number;
  ownerName: string;
  ownerEmail: string;
  orderCount: number;
};

interface Props {
  stores: StoreItem[];
}

// ─── Badges ───────────────────────────────────────────────────

function VerifiedBadge({ is_verified }: { is_verified: boolean }) {
  return is_verified ? (
    <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400">
      Vérifiée
    </Badge>
  ) : (
    <Badge variant="destructive">Non vérifiée</Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400">
        Active
      </Badge>
    );
  if (status === "suspended") return <Badge variant="destructive">Suspendue</Badge>;
  if (status === "pending") return <Badge variant="secondary">En attente</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function TierBadge({ tier }: { tier: string }) {
  if (tier === "free") return <Badge variant="secondary" className="text-gray-600">Free</Badge>;
  if (tier === "pro") return <Badge className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400">Pro</Badge>;
  if (tier === "business") return <Badge className="bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-400">Business</Badge>;
  return <Badge variant="outline">{tier}</Badge>;
}

// ─── Verify Dialog ─────────────────────────────────────────────

function VerifyDialog({
  store,
  onClose,
}: {
  store: StoreItem | null;
  onClose: () => void;
}) {
  const verifyStore = useMutation(api.admin.mutations.verifyStore);
  const [loading, setLoading] = useState(false);

  if (!store) return null;

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verifyStore({ storeId: store._id });
      onClose();
    } catch (err) {
      console.error("Erreur vérification:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!store} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vérifier la boutique</DialogTitle>
          <DialogDescription>
            Confirmez la vérification de la boutique{" "}
            <strong>{store.name}</strong> ({store.ownerName}).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? "En cours..." : "Vérifier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Suspend Dialog ─────────────────────────────────────────────

function SuspendDialog({
  store,
  onClose,
}: {
  store: StoreItem | null;
  onClose: () => void;
}) {
  const suspendStore = useMutation(api.admin.mutations.suspendStore);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  if (!store) return null;

  const handleSuspend = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await suspendStore({ storeId: store._id, reason: reason.trim() });
      onClose();
      setReason("");
    } catch (err) {
      console.error("Erreur suspension:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!store} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspendre la boutique</DialogTitle>
          <DialogDescription>
            La boutique <strong>{store.name}</strong> sera suspendue. Indiquez
            la raison.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Raison de la suspension (obligatoire)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSuspend}
            disabled={loading || !reason.trim()}
          >
            {loading ? "En cours..." : "Suspendre"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Verify Dialog ────────────────────────────────────────

function BulkVerifyDialog({
  open,
  count,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vérifier {count} boutique{count > 1 ? "s" : ""}</DialogTitle>
          <DialogDescription>
            Cette action marquera les {count} boutique{count > 1 ? "s" : ""} sélectionnée{count > 1 ? "s" : ""} comme vérifiées. Les boutiques déjà vérifiées seront ignorées.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "En cours..." : `Vérifier ${count}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bulk Suspend Dialog ───────────────────────────────────────

function BulkSuspendDialog({
  open,
  count,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspendre {count} boutique{count > 1 ? "s" : ""}</DialogTitle>
          <DialogDescription>
            Les {count} boutique{count > 1 ? "s" : ""} sélectionnée{count > 1 ? "s" : ""} seront suspendues. Indiquez la raison commune.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Raison de la suspension (obligatoire)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
          >
            {loading ? "En cours..." : `Suspendre ${count}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reactivate (inline, no dialog needed) ────────────────────

function ActionsMenu({
  store,
  onVerify,
  onSuspend,
  onReactivate,
}: {
  store: StoreItem;
  onVerify: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  const hasActions =
    !store.is_verified || store.status === "active" || store.status === "suspended";

  if (!hasActions) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {!store.is_verified && (
            <DropdownMenuItem onClick={onVerify} className="text-green-600">
              Vérifier
            </DropdownMenuItem>
          )}
          {store.status === "active" && (
            <DropdownMenuItem onClick={onSuspend} className="text-destructive">
              Suspendre
            </DropdownMenuItem>
          )}
          {store.status === "suspended" && (
            <DropdownMenuItem onClick={onReactivate} className="text-green-600">
              Réactiver
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminStoresTemplate({ stores }: Props) {
  const reactivateStore = useMutation(api.admin.mutations.reactivateStore);
  const bulkVerifyStores = useMutation(api.admin.mutations.bulkVerifyStores);
  const bulkSuspendStores = useMutation(api.admin.mutations.bulkSuspendStores);

  const [search, setSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [verifyTarget, setVerifyTarget] = useState<StoreItem | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<StoreItem | null>(null);

  const [bulkVerifyOpen, setBulkVerifyOpen] = useState(false);
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerEmail.toLowerCase().includes(search.toLowerCase());

      const matchVerified =
        filterVerified === "all" ||
        (filterVerified === "verified" && s.is_verified) ||
        (filterVerified === "unverified" && !s.is_verified);

      const matchStatus =
        filterStatus === "all" || s.status === filterStatus;

      return matchSearch && matchVerified && matchStatus;
    });
  }, [stores, search, filterVerified, filterStatus]);

  const filteredIds = filtered.map((s) => s._id as string);
  const bulk = useBulkSelection();

  // Stats
  const totalStores = stores.length;
  const unverifiedCount = stores.filter((s) => !s.is_verified).length;
  const activeCount = stores.filter((s) => s.status === "active").length;
  const suspendedCount = stores.filter((s) => s.status === "suspended").length;

  const handleReactivate = async (storeId: Id<"stores">) => {
    try {
      await reactivateStore({ storeId });
    } catch (err) {
      console.error("Erreur réactivation:", err);
    }
  };

  const handleBulkVerify = async () => {
    setBulkLoading(true);
    try {
      await bulkVerifyStores({ storeIds: Array.from(bulk.selectedIds) as Id<"stores">[] });
      bulk.clear();
      setBulkVerifyOpen(false);
    } catch (err) {
      console.error("Erreur vérification bulk:", err);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkSuspend = async (reason: string) => {
    setBulkLoading(true);
    try {
      await bulkSuspendStores({ storeIds: Array.from(bulk.selectedIds) as Id<"stores">[], reason });
      bulk.clear();
      setBulkSuspendOpen(false);
    } catch (err) {
      console.error("Erreur suspension bulk:", err);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Gestion des boutiques
        </h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez, suspendez ou réactivez les boutiques vendeurs.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{totalStores}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1">
              Non vérifiées
              {unverifiedCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                  {unverifiedCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{unverifiedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              Actives
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              Suspendues
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-destructive">
              {suspendedCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Input
            placeholder="Rechercher une boutique, propriétaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterVerified} onValueChange={setFilterVerified}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Vérification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="verified">Vérifiées</SelectItem>
            <SelectItem value="unverified">Non vérifiées</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="suspended">Suspendues</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {bulk.count > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/60 px-4 py-2.5">
          <span className="text-sm font-medium">
            {bulk.count} boutique{bulk.count > 1 ? "s" : ""} sélectionnée{bulk.count > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => setBulkVerifyOpen(true)}
            >
              <CheckCircle2 className="size-3.5 mr-1" />
              Vérifier
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setBulkSuspendOpen(true)}
            >
              <Ban className="size-3.5 mr-1" />
              Suspendre
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={bulk.clear}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Store className="size-10 opacity-30" />
          <p className="text-sm">Aucune boutique trouvée</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={bulk.isAllSelected(filteredIds)}
                    onCheckedChange={() => bulk.toggleAll(filteredIds)}
                    aria-label="Tout sélectionner"
                  />
                </TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Vérifiée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Commandes</TableHead>
                <TableHead className="text-right">Solde</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((store) => (
                <TableRow
                  key={store._id}
                  data-selected={bulk.selectedIds.has(store._id as string)}
                  className="data-[selected=true]:bg-muted/40"
                >
                  <TableCell>
                    <Checkbox
                      checked={bulk.selectedIds.has(store._id as string)}
                      onCheckedChange={() => bulk.toggle(store._id as string)}
                      aria-label={`Sélectionner ${store.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {store.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{store.ownerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {store.ownerEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <VerifiedBadge is_verified={store.is_verified} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={store.status} />
                  </TableCell>
                  <TableCell>
                    <TierBadge tier={store.subscription_tier} />
                  </TableCell>
                  <TableCell className="text-right">{store.orderCount}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(store.balance, store.currency)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(store._creationTime, {
                      hour: undefined,
                      minute: undefined,
                    })}
                  </TableCell>
                  <TableCell>
                    <ActionsMenu
                      store={store}
                      onVerify={() => setVerifyTarget(store)}
                      onSuspend={() => setSuspendTarget(store)}
                      onReactivate={() => handleReactivate(store._id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <VerifyDialog store={verifyTarget} onClose={() => setVerifyTarget(null)} />
      <SuspendDialog
        store={suspendTarget}
        onClose={() => setSuspendTarget(null)}
      />
      <BulkVerifyDialog
        open={bulkVerifyOpen}
        count={bulk.count}
        onClose={() => setBulkVerifyOpen(false)}
        onConfirm={handleBulkVerify}
        loading={bulkLoading}
      />
      <BulkSuspendDialog
        open={bulkSuspendOpen}
        count={bulk.count}
        onClose={() => setBulkSuspendOpen(false)}
        onConfirm={handleBulkSuspend}
        loading={bulkLoading}
      />
    </div>
  );
}
