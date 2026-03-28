// filepath: src/components/coupons/templates/VendorCouponsTemplate.tsx
"use client";

import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatPrice, formatDate } from "@/lib/format";
import { Plus, Tag, Trash2, Power, PowerOff } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";

// NOTE: NOW est calculé dans le composant via useMemo pour éviter les erreurs d'hydratation

type Coupon = Doc<"coupons">;
type CouponType = Coupon["type"];

interface VendorCouponsTemplateProps {
  coupons: Coupon[];
  isLoading: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────

function getCouponStatus(coupon: Coupon, now: number): "active" | "inactive" | "expired" {
  if (!coupon.is_active) return "inactive";
  if (coupon.expires_at && coupon.expires_at < now) return "expired";
  return "active";
}

function getCouponValueLabel(coupon: Coupon): string {
  switch (coupon.type) {
    case "percentage":
      return `-${coupon.value}%`;
    case "fixed_amount":
      return `-${formatPrice(coupon.value, "XOF")}`;
    case "free_shipping":
      return "Livraison offerte";
  }
}

const STATUS_BADGE: Record<
  "active" | "inactive" | "expired",
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  active: { label: "Actif", variant: "default" },
  inactive: { label: "Inactif", variant: "secondary" },
  expired: { label: "Expiré", variant: "destructive" },
};

const TYPE_LABELS: Record<CouponType, string> = {
  percentage: "Pourcentage",
  fixed_amount: "Montant fixe",
  free_shipping: "Livraison gratuite",
};

// ─── Create Dialog ────────────────────────────────────────────

function CreateCouponDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("percentage");
  const [value, setValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");

  const createCoupon = useMutation(api.coupons.mutations.create);

  function reset() {
    setCode("");
    setType("percentage");
    setValue("");
    setMinOrder("");
    setMaxUses("");
    setMaxUsesPerUser("1");
    setExpiresAt("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createCoupon({
        code: code.trim().toUpperCase(),
        type,
        value:
          type === "percentage"
            ? Number(value)
            : type === "fixed_amount"
              ? Math.round(Number(value)) // XOF : centimes = valeur FCFA, pas de ×100
              : 0,
        minOrderAmount: minOrder
          ? Math.round(Number(minOrder)) // XOF : centimes = valeur FCFA
          : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,
        expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
      });
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau code promo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un code promo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex : ETE2026"
              maxLength={20}
              className="font-mono uppercase"
              required
            />
            <p className="text-xs text-muted-foreground">
              Le code sera automatiquement mis en majuscules.
            </p>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type de réduction *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as CouponType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                <SelectItem value="fixed_amount">
                  Montant fixe (FCFA)
                </SelectItem>
                <SelectItem value="free_shipping">
                  Livraison gratuite
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value */}
          {type !== "free_shipping" && (
            <div className="space-y-2">
              <Label htmlFor="value">
                {type === "percentage" ? "Pourcentage *" : "Montant (FCFA) *"}
              </Label>
              <div className="relative">
                <Input
                  id="value"
                  type="number"
                  min={type === "percentage" ? "1" : "1"}
                  max={type === "percentage" ? "100" : undefined}
                  step={type === "percentage" ? "1" : "1"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "percentage" ? "Ex : 10" : "Ex : 500"}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {type === "percentage" ? "%" : "FCFA"}
                </span>
              </div>
            </div>
          )}

          {/* Min order */}
          <div className="space-y-2">
            <Label htmlFor="minOrder">Montant minimum (FCFA, optionnel)</Label>
            <Input
              id="minOrder"
              type="number"
              min="0"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="Ex : 5000"
            />
          </div>

          {/* Max uses */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="maxUses">Utilisations max (total)</Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Illimité"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUsesPerUser">Par client</Label>
              <Input
                id="maxUsesPerUser"
                type="number"
                min="1"
                value={maxUsesPerUser}
                onChange={(e) => setMaxUsesPerUser(e.target.value)}
              />
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">
              Date d&apos;expiration (optionnel)
            </Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              suppressHydrationWarning
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !code.trim() ||
                (type !== "free_shipping" && !value)
              }
            >
              {isSubmitting ? "Création…" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Row Actions ──────────────────────────────────────────────

function CouponActions({ coupon, now }: { coupon: Coupon; now: number }) {
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const activate = useMutation(api.coupons.mutations.activate);
  const deactivate = useMutation(api.coupons.mutations.deactivate);
  const remove = useMutation(api.coupons.mutations.remove);

  const status = getCouponStatus(coupon, now);

  async function handleToggle() {
    setLoadingToggle(true);
    try {
      if (coupon.is_active) {
        await deactivate({ couponId: coupon._id });
      } else {
        await activate({ couponId: coupon._id });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingToggle(false);
    }
  }

  async function handleDelete() {
    setLoadingDelete(true);
    try {
      await remove({ couponId: coupon._id });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDelete(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Toggle active */}
      {status !== "expired" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={handleToggle}
          disabled={loadingToggle}
          title={coupon.is_active ? "Désactiver" : "Activer"}
        >
          {coupon.is_active ? (
            <PowerOff className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Delete (only if never used) */}
      {coupon.used_count === 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={loadingDelete}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le code promo ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le code <strong>{coupon.code}</strong> sera supprimé
                définitivement. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────

function CouponsTable({
  coupons,
  isLoading,
  now,
}: {
  coupons: Coupon[];
  isLoading: boolean;
  now: number;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
        <Tag className="h-10 w-10 opacity-30" />
        <p className="text-sm">Aucun code promo pour l&apos;instant</p>
        <p className="text-xs">
          Créez votre premier code pour fidéliser vos clients.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Réduction</TableHead>
          <TableHead className="hidden sm:table-cell">Type</TableHead>
          <TableHead className="hidden md:table-cell">Utilisations</TableHead>
          <TableHead className="hidden lg:table-cell">Expiration</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {coupons.map((coupon) => {
          const badge = STATUS_BADGE[getCouponStatus(coupon, now)];
          return (
            <TableRow
              key={coupon._id}
              className={!coupon.is_active ? "opacity-60" : ""}
            >
              <TableCell>
                <span className="font-mono font-bold text-sm tracking-wider">
                  {coupon.code}
                </span>
              </TableCell>
              <TableCell className="font-semibold text-sm">
                {getCouponValueLabel(coupon)}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                {TYPE_LABELS[coupon.type]}
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm">
                <span>
                  {coupon.used_count}
                  {coupon.max_uses !== undefined && (
                    <span className="text-muted-foreground">
                      {" "}
                      / {coupon.max_uses}
                    </span>
                  )}
                </span>
                {coupon.min_order_amount !== undefined && (
                  <p className="text-xs text-muted-foreground">
                    Min. {formatPrice(coupon.min_order_amount, "XOF")}
                  </p>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                {coupon.expires_at
                  ? formatDate(coupon.expires_at, {
                      hour: undefined,
                      minute: undefined,
                    })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </TableCell>
              <TableCell>
                <CouponActions coupon={coupon} now={now} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Template ─────────────────────────────────────────────────

export function VendorCouponsTemplate({
  coupons,
  isLoading,
}: VendorCouponsTemplateProps) {
  // Stable timestamp per render cycle — avoids SSR/client hydration mismatch
  const now = useMemo(() => Date.now(), []);
  const active = coupons.filter(
    (c) => c.is_active && (!c.expires_at || c.expires_at >= now),
  );
  const expired = coupons.filter((c) => c.expires_at && c.expires_at < now);
  const totalUses = coupons.reduce((sum, c) => sum + c.used_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Codes promo
          </h1>
          <p className="text-sm text-muted-foreground">
            Créez et gérez vos codes de réduction
          </p>
        </div>
        <CreateCouponDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{active.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total créés
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{coupons.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Utilisations
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{totalUses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Expirés
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-muted-foreground">
              {expired.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <CouponsTable coupons={coupons} isLoading={isLoading} now={now} />
    </div>
  );
}
