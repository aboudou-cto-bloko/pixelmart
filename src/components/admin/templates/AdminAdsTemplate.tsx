// filepath: src/components/admin/templates/AdminAdsTemplate.tsx

"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Megaphone,
  Upload,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  LayoutGrid,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────

type AdBooking = {
  _id: Id<"ad_bookings">;
  slot_id: string;
  store_name: string;
  space_name: string;
  content_type: string;
  title?: string;
  image_url?: string;
  starts_at: number;
  ends_at: number;
  total_price: number;
  currency: string;
  source: "vendor" | "admin";
  status: string;
  payment_status: string;
  impressions: number;
  clicks: number;
  admin_notes?: string;
};

type AdSpace = {
  _id: Id<"ad_spaces">;
  slot_id: string;
  name: string;
  format: string;
  width: number;
  height: number;
  max_slots: number;
  base_price_daily: number;
  demand_multiplier: number;
  is_active: boolean;
  sort_order: number;
  active_count: number;
  queued_count: number;
};

interface Props {
  bookings: AdBooking[];
  spaces: AdSpace[];
}

// ─── Status Badge ─────────────────────────────────────────────

function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    pending: {
      cls: "bg-yellow-100 text-yellow-700 border-yellow-300",
      icon: <Clock className="size-3" />,
    },
    confirmed: {
      cls: "bg-blue-100 text-blue-700 border-blue-300",
      icon: <CheckCircle2 className="size-3" />,
    },
    active: {
      cls: "bg-green-100 text-green-700 border-green-300",
      icon: <Zap className="size-3" />,
    },
    queued: {
      cls: "bg-purple-100 text-purple-700 border-purple-300",
      icon: <Clock className="size-3" />,
    },
    completed: {
      cls: "bg-gray-100 text-gray-600 border-gray-300",
      icon: <CheckCircle2 className="size-3" />,
    },
    cancelled: {
      cls: "bg-red-100 text-red-700 border-red-300",
      icon: <XCircle className="size-3" />,
    },
  };
  const { cls, icon } = map[status] ?? {
    cls: "bg-gray-100 text-gray-600",
    icon: null,
  };
  return (
    <Badge className={`${cls} gap-1 text-xs`}>
      {icon}
      {status}
    </Badge>
  );
}

// ─── Cancel Dialog ────────────────────────────────────────────

function CancelBookingDialog({
  booking,
  onClose,
}: {
  booking: AdBooking | null;
  onClose: () => void;
}) {
  const cancel = useMutation(api.ads.mutations.cancelBooking);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!booking) return null;

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      await cancel({ booking_id: booking._id, reason: reason.trim() || undefined });
      onClose();
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler la réservation</DialogTitle>
          <DialogDescription>
            Annuler la réservation{" "}
            <span className="font-mono font-semibold">{booking.slot_id}</span>{" "}
            de <span className="font-semibold">{booking.store_name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Raison (optionnel)</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Raison de l'annulation…"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Fermer
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? "…" : "Annuler la réservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Space Pricing Dialog ───────────────────────────────

function EditSpacePricingDialog({
  space,
  onClose,
}: {
  space: AdSpace | null;
  onClose: () => void;
}) {
  const updatePricing = useMutation(api.ads.mutations.updateAdSpacePricing);
  const [maxSlots, setMaxSlots] = useState(space ? String(space.max_slots) : "1");
  const [priceDaily, setPriceDaily] = useState(space ? String(space.base_price_daily) : "");
  const [priceWeekly, setPriceWeekly] = useState("");
  const [priceMonthly, setPriceMonthly] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!space) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await updatePricing({
        ad_space_id: space._id,
        max_slots: maxSlots ? Number(maxSlots) : undefined,
        base_price_daily: priceDaily ? Number(priceDaily) : undefined,
        base_price_weekly: priceWeekly ? Number(priceWeekly) : undefined,
        base_price_monthly: priceMonthly ? Number(priceMonthly) : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!space} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier les tarifs — {space.name}</DialogTitle>
          <DialogDescription>
            Laisser vide pour conserver la valeur actuelle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre de slots simultanés</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="20"
                value={maxSlots}
                onChange={(e) => setMaxSlots(e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                actuellement {space.max_slots}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Prix/jour (c)</Label>
              <Input
                type="number"
                placeholder={String(space.base_price_daily)}
                value={priceDaily}
                onChange={(e) => setPriceDaily(e.target.value)}
                className="text-sm"
              />
              {priceDaily && (
                <p className="text-xs text-muted-foreground">
                  = {formatPrice(Number(priceDaily), "XOF")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prix/semaine (c)</Label>
              <Input
                type="number"
                placeholder="actuel"
                value={priceWeekly}
                onChange={(e) => setPriceWeekly(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prix/mois (c)</Label>
              <Input
                type="number"
                placeholder="actuel"
                value={priceMonthly}
                onChange={(e) => setPriceMonthly(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Les valeurs sont en centimes XOF. 1 000 XOF = 1 000 centimes (pas de division pour XOF).
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement…" : "Appliquer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Demand Multiplier Dialog ────────────────────────────────

function DemandMultiplierDialog({
  space,
  onClose,
}: {
  space: AdSpace | null;
  onClose: () => void;
}) {
  const update = useMutation(api.ads.mutations.updateDemandMultiplier);
  const [value, setValue] = useState(space ? String(space.demand_multiplier) : "1.0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!space) return null;

  const handleSubmit = async () => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setLoading(true);
    setError(null);
    try {
      await update({ ad_space_id: space._id, demand_multiplier: num });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!space} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Multiplicateur de demande</DialogTitle>
          <DialogDescription>
            Ajuster le multiplicateur pour{" "}
            <span className="font-semibold">{space.name}</span> (entre 0.5 et 5.0)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Multiplicateur</Label>
          <Input
            type="number"
            step="0.1"
            min="0.5"
            max="5.0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-28"
          />
          <p className="text-xs text-muted-foreground">
            Prix journalier effectif :{" "}
            <span className="font-semibold">
              {formatPrice(
                Math.round(space.base_price_daily * parseFloat(value || "1")),
                "XOF",
              )}
            </span>
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enregistrement…" : "Appliquer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Admin Booking Dialog ─────────────────────────────

function CreateAdminBookingDialog({
  spaces,
  open,
  onClose,
}: {
  spaces: AdSpace[];
  open: boolean;
  onClose: () => void;
}) {
  const generateUploadUrl = useMutation(api.admin.mutations.generateAdminUploadUrl);
  const createBooking = useMutation(api.ads.mutations.adminCreateBooking);

  const [spaceId, setSpaceId] = useState<string>("");
  const [contentType, setContentType] = useState<string>("banner");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [imageStorageId, setImageStorageId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Échec de l'upload");
      const { storageId } = await res.json() as { storageId: string };
      setImageStorageId(storageId);
      setImagePreview(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!spaceId || !startsAt || !endsAt) {
      setError("Espace, dates de début et fin obligatoires");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createBooking({
        ad_space_id: spaceId as Id<"ad_spaces">,
        content_type: contentType as "product" | "store" | "banner" | "promotion",
        image_url: imageStorageId ?? undefined,
        title: title.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        cta_text: ctaText.trim() || undefined,
        cta_link: ctaLink.trim() || undefined,
        starts_at: new Date(startsAt).getTime(),
        ends_at: new Date(endsAt).getTime(),
        is_free: true,
        admin_notes: adminNotes.trim() || undefined,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une annonce admin</DialogTitle>
          <DialogDescription>
            L&apos;annonce sera active immédiatement avec priorité maximale (100).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Espace */}
          <div className="space-y-1.5">
            <Label>Espace publicitaire *</Label>
            <Select value={spaceId} onValueChange={setSpaceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un espace…" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}{" "}
                    <span className="text-muted-foreground text-xs">
                      ({s.width}×{s.height}px)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de contenu */}
          <div className="space-y-1.5">
            <Label>Type de contenu</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banner">Bannière (image custom)</SelectItem>
                <SelectItem value="promotion">Promotion / Offre</SelectItem>
                <SelectItem value="store">Mise en avant boutique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image upload */}
          <div className="space-y-1.5">
            <Label>Image</Label>
            {imagePreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-24 w-auto rounded-md border object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageStorageId(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground size-5 flex items-center justify-center"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors"
              >
                {uploading ? (
                  <p className="text-xs text-muted-foreground">Upload…</p>
                ) : (
                  <>
                    <Upload className="size-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliquer pour uploader
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Titre / Subtitle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Soldes d'été"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sous-titre</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Jusqu'à -50%"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Texte CTA</Label>
              <Input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Découvrir"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lien CTA</Label>
              <Input
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder="/products"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Début *</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fin *</Label>
              <Input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          {/* Notes admin */}
          <div className="space-y-1.5">
            <Label>Notes admin</Label>
            <Input
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Contexte interne…"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || uploading}>
            {loading ? "Création…" : "Publier l'annonce"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────

function BookingsTab({ bookings }: { bookings: AdBooking[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cancelTarget, setCancelTarget] = useState<AdBooking | null>(null);
  const confirm = useMutation(api.ads.mutations.confirmBooking);

  const filtered =
    statusFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">pending</SelectItem>
            <SelectItem value="confirmed">confirmed</SelectItem>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="queued">queued</SelectItem>
            <SelectItem value="completed">completed</SelectItem>
            <SelectItem value="cancelled">cancelled</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} réservation{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Megaphone className="size-10 opacity-20" />
          <p className="text-sm">Aucune réservation</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espace</TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Période</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Stats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow key={b._id}>
                  <TableCell className="text-xs font-mono">
                    {b.slot_id}
                    {b.source === "admin" && (
                      <Badge className="ml-1.5 text-[10px] px-1 py-0 bg-red-100 text-red-600 border-red-300">
                        admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{b.store_name}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {b.content_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(b.starts_at)} → {formatDate(b.ends_at)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {b.source === "admin"
                      ? "—"
                      : formatPrice(b.total_price, b.currency)}
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {b.impressions} aff · {b.clicks} clics
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {b.status === "pending" && (
                        <Button
                          size="sm"
                          className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => confirm({ booking_id: b._id })}
                        >
                          Confirmer
                        </Button>
                      )}
                      {!["cancelled", "completed"].includes(b.status) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => setCancelTarget(b)}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CancelBookingDialog
        booking={cancelTarget}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}

// ─── Spaces Tab ───────────────────────────────────────────────

function SpacesTab({ spaces }: { spaces: AdSpace[] }) {
  const toggleSpace = useMutation(api.admin.mutations.toggleAdSpace);
  const [multiplierTarget, setMultiplierTarget] = useState<AdSpace | null>(null);
  const [pricingTarget, setPricingTarget] = useState<AdSpace | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <Card
            key={space._id}
            className={space.is_active ? "" : "opacity-60"}
          >
            <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-start justify-between space-y-0">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold truncate">
                  {space.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {space.slot_id}
                </p>
              </div>
              <Switch
                checked={space.is_active}
                onCheckedChange={() => toggleSpace({ adSpaceId: space._id })}
                className="ml-2 shrink-0"
              />
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Format</span>
                <span>{space.format} · {space.width}×{space.height}px</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Slots</span>
                <span>
                  {space.active_count}/{space.max_slots} actifs
                  {space.queued_count > 0 && (
                    <span className="ml-1 text-purple-600">
                      +{space.queued_count} en attente
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Prix/jour</span>
                <span className="font-medium">
                  {formatPrice(
                    Math.round(space.base_price_daily * space.demand_multiplier),
                    "XOF",
                  )}
                  {space.demand_multiplier !== 1 && (
                    <span className="ml-1 text-orange-500 font-mono">
                      ×{space.demand_multiplier}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {space.is_active ? (
                    <Eye className="size-3 text-green-600" />
                  ) : (
                    <EyeOff className="size-3 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {space.is_active ? "Visible" : "Masqué"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => setMultiplierTarget(space)}
                  >
                    ×{space.demand_multiplier}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => setPricingTarget(space)}
                  >
                    Tarifs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DemandMultiplierDialog
        space={multiplierTarget}
        onClose={() => setMultiplierTarget(null)}
      />
      <EditSpacePricingDialog
        space={pricingTarget}
        onClose={() => setPricingTarget(null)}
      />
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminAdsTemplate({ bookings, spaces }: Props) {
  const [createOpen, setCreateOpen] = useState(false);

  const activeBookings = bookings.filter((b) => b.status === "active").length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Publicités
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeBookings} annonce{activeBookings !== 1 ? "s" : ""} active
            {activeBookings !== 1 ? "s" : ""} ·{" "}
            {pendingBookings > 0 && (
              <span className="text-yellow-600 font-medium">
                {pendingBookings} en attente
              </span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Megaphone className="size-4" />
          Nouvelle annonce admin
        </Button>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings" className="gap-1.5">
            <Megaphone className="size-3.5" />
            Réservations ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="spaces" className="gap-1.5">
            <LayoutGrid className="size-3.5" />
            Espaces ({spaces.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          <BookingsTab bookings={bookings} />
        </TabsContent>

        <TabsContent value="spaces" className="mt-4">
          <SpacesTab spaces={spaces} />
        </TabsContent>
      </Tabs>

      <CreateAdminBookingDialog
        spaces={spaces.filter((s) => s.is_active)}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
