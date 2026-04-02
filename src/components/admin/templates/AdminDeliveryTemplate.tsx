// filepath: src/components/admin/templates/AdminDeliveryTemplate.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Bike, Plus, Pencil, Trash2, Moon, Sun } from "lucide-react";
import { formatPrice } from "@/lib/format";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// ─── Types ────────────────────────────────────────────────────

type DeliveryType = "standard" | "urgent" | "fragile";

type DeliveryRate = {
  _id: Id<"delivery_rates">;
  delivery_type: DeliveryType;
  is_night_rate: boolean;
  distance_min_km: number;
  distance_max_km?: number;
  base_price: number;
  price_per_km?: number;
  weight_threshold_kg: number;
  weight_surcharge_per_kg: number;
  is_active: boolean;
  updated_at: number;
};

interface Props {
  rates: DeliveryRate[];
}

// ─── Type Badge ───────────────────────────────────────────────

function TypeBadge({ type }: { type: DeliveryType }) {
  const map: Record<DeliveryType, string> = {
    standard: "bg-blue-100 text-blue-700 border-blue-300",
    urgent: "bg-orange-100 text-orange-700 border-orange-300",
    fragile: "bg-purple-100 text-purple-700 border-purple-300",
  };
  return <Badge className={map[type]}>{type}</Badge>;
}

// ─── Rate Form Dialog ─────────────────────────────────────────

function RateFormDialog({
  open,
  rate,
  onClose,
}: {
  open: boolean;
  rate: DeliveryRate | null;
  onClose: () => void;
}) {
  const upsert = useMutation(api.admin.mutations.upsertDeliveryRate);
  const isEdit = rate !== null;

  const [deliveryType, setDeliveryType] = useState<DeliveryType>(
    rate?.delivery_type ?? "standard",
  );
  const [isNight, setIsNight] = useState(rate?.is_night_rate ?? false);
  const [distMin, setDistMin] = useState(String(rate?.distance_min_km ?? 0));
  const [distMax, setDistMax] = useState(
    rate?.distance_max_km !== null && rate?.distance_max_km !== undefined
      ? String(rate.distance_max_km)
      : "",
  );
  const [basePrice, setBasePrice] = useState(String(rate?.base_price ?? ""));
  const [pricePerKm, setPricePerKm] = useState(
    rate?.price_per_km !== null && rate?.price_per_km !== undefined
      ? String(rate.price_per_km)
      : "",
  );
  const [weightThreshold, setWeightThreshold] = useState(
    String(rate?.weight_threshold_kg ?? 20),
  );
  const [weightSurcharge, setWeightSurcharge] = useState(
    String(rate?.weight_surcharge_per_kg ?? 5000),
  );
  const [isActive, setIsActive] = useState(rate?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!basePrice && !pricePerKm) {
      setError(
        "Renseignez un prix de base (tarif fixe) ou un prix/km — au moins l'un des deux.",
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsert({
        id: rate?._id,
        delivery_type: deliveryType,
        is_night_rate: isNight,
        distance_min_km: Number(distMin),
        distance_max_km: distMax ? Number(distMax) : undefined,
        base_price: basePrice ? Number(basePrice) : 0,
        price_per_km: pricePerKm ? Number(pricePerKm) : undefined,
        weight_threshold_kg: Number(weightThreshold),
        weight_surcharge_per_kg: Number(weightSurcharge),
        is_active: isActive,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le tarif" : "Nouveau tarif de livraison"}
          </DialogTitle>
          <DialogDescription>
            Saisissez les montants directement en FCFA (ex: 700 pour 700 FCFA).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type de course</Label>
              <Select
                value={deliveryType}
                onValueChange={(v) => setDeliveryType(v as DeliveryType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="fragile">Fragile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <Switch
                id="night-rate"
                checked={isNight}
                onCheckedChange={setIsNight}
              />
              <Label htmlFor="night-rate" className="flex items-center gap-1">
                {isNight ? (
                  <Moon className="size-3.5 text-blue-500" />
                ) : (
                  <Sun className="size-3.5 text-yellow-500" />
                )}
                Tarif de nuit (21h–6h)
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Distance min (km)</Label>
              <Input
                type="number"
                value={distMin}
                onChange={(e) => setDistMin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Distance max (km) — vide = ∞</Label>
              <Input
                type="number"
                value={distMax}
                onChange={(e) => setDistMax(e.target.value)}
                placeholder="∞"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                Prix de base (FCFA){" "}
                <span className="text-muted-foreground font-normal text-xs">
                  — tarif fixe
                </span>
              </Label>
              <Input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="Ex: 700"
              />
              {basePrice && (
                <p className="text-xs text-muted-foreground">
                  = {formatPrice(Number(basePrice), "XOF")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Prix/km (FCFA){" "}
                <span className="text-muted-foreground font-normal text-xs">
                  — tarif variable
                </span>
              </Label>
              <Input
                type="number"
                value={pricePerKm}
                onChange={(e) => setPricePerKm(e.target.value)}
                placeholder="Ex: 200"
              />
              {pricePerKm && (
                <p className="text-xs text-muted-foreground">
                  = {formatPrice(Number(pricePerKm), "XOF")}/km
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            Si <strong>Prix/km</strong> est renseigné, il est utilisé (distance
            × prix/km). Sinon le <strong>Prix de base</strong> fixe
            s&apos;applique. Au moins l&apos;un des deux est requis.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Seuil poids (kg)</Label>
              <Input
                type="number"
                value={weightThreshold}
                onChange={(e) => setWeightThreshold(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Surcoût/kg au-delà (centimes)</Label>
              <Input
                type="number"
                value={weightSurcharge}
                onChange={(e) => setWeightSurcharge(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="rate-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="rate-active">Actif</Label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement…" : isEdit ? "Modifier" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────

function DeleteRateDialog({
  rate,
  onClose,
}: {
  rate: DeliveryRate | null;
  onClose: () => void;
}) {
  const deleteRate = useMutation(api.admin.mutations.deleteDeliveryRate);
  const [loading, setLoading] = useState(false);

  if (!rate) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteRate({ id: rate._id });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={!!rate} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le tarif</AlertDialogTitle>
          <AlertDialogDescription>
            Supprimer le tarif {rate.delivery_type} — {rate.distance_min_km}–
            {rate.distance_max_km ?? "∞"} km ? Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "…" : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminDeliveryTemplate({ rates }: Props) {
  const toggleRate = useMutation(api.admin.mutations.toggleDeliveryRate);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DeliveryRate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryRate | null>(null);

  const handleEdit = (rate: DeliveryRate) => {
    setEditTarget(rate);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  // Group by delivery_type then night/day
  const groups = (["standard", "urgent", "fragile"] as DeliveryType[]).map(
    (type) => ({
      type,
      day: rates.filter((r) => r.delivery_type === type && !r.is_night_rate),
      night: rates.filter((r) => r.delivery_type === type && r.is_night_rate),
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Tarifs de livraison
          </h1>
          <p className="text-sm text-muted-foreground">
            {rates.length} tarif{rates.length !== 1 ? "s" : ""} configuré
            {rates.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Nouveau tarif
        </Button>
      </div>

      {rates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Bike className="size-12 opacity-25" />
          <p className="text-sm">Aucun tarif configuré</p>
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            Créer le premier
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ type, day, night }) => {
            const allRates = [...day, ...night];
            if (allRates.length === 0) return null;
            return (
              <div key={type}>
                <h2 className="text-sm font-semibold capitalize mb-2 flex items-center gap-2">
                  <TypeBadge type={type} />
                  <span className="text-muted-foreground font-normal">
                    {allRates.length} palier{allRates.length !== 1 ? "s" : ""}
                  </span>
                </h2>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Période</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead className="text-right">Prix base</TableHead>
                        <TableHead className="text-right">+/km</TableHead>
                        <TableHead className="text-right">
                          Seuil poids
                        </TableHead>
                        <TableHead className="text-right">Surcoût/kg</TableHead>
                        <TableHead>Actif</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRates.map((r) => (
                        <TableRow
                          key={r._id}
                          className={r.is_active ? "" : "opacity-50"}
                        >
                          <TableCell>
                            {r.is_night_rate ? (
                              <span className="flex items-center gap-1 text-xs text-blue-600">
                                <Moon className="size-3" /> Nuit
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-yellow-600">
                                <Sun className="size-3" /> Jour
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {r.distance_min_km}–{r.distance_max_km ?? "∞"} km
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatPrice(r.base_price, "XOF")}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {r.price_per_km
                              ? formatPrice(r.price_per_km, "XOF")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {r.weight_threshold_kg} kg
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {formatPrice(r.weight_surcharge_per_kg, "XOF")}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={r.is_active}
                              onCheckedChange={() => toggleRate({ id: r._id })}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => handleEdit(r)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteTarget(r)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RateFormDialog
        open={formOpen}
        rate={editTarget}
        onClose={handleCloseForm}
      />
      <DeleteRateDialog
        rate={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
