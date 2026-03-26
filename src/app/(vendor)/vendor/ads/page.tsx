// filepath: src/app/(vendor)/vendor/ads/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Megaphone,
  Eye,
  MousePointer,
  Calendar,
  Loader2,
  Info,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Id } from "../../../../../convex/_generated/dataModel";

const AD_STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending: { label: "En attente", variant: "secondary" },
  confirmed: { label: "Confirmé", variant: "default" },
  active: { label: "Actif", variant: "default" },
  completed: { label: "Terminé", variant: "outline" },
  cancelled: { label: "Annulé", variant: "destructive" },
  queued: { label: "En file", variant: "secondary" },
};

export default function VendorAdsPage() {
  const { user } = useCurrentUser();
  const availableSpaces = useQuery(api.ads.queries.listAvailableSpaces);
  const myBookings = useQuery(api.ads.queries.listMyBookings);
  const createBooking = useMutation(api.ads.mutations.createBooking);
  const initiateAdPayment = useAction(api.ads.actions.initiateAdPayment);

  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Id<"ad_spaces"> | null>(
    null,
  );
  const [formData, setFormData] = useState({
    content_type: "store" as "product" | "store" | "banner" | "promotion",
    title: "",
    subtitle: "",
    cta_text: "Découvrir",
    cta_link: "",
    image_url: "",
    starts_at: "",
    ends_at: "",
  });
  const [pricePreview, setPricePreview] = useState<{
    totalPrice: number;
    breakdown: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview prix quand les dates changent
  const previewResult = useQuery(
    api.ads.queries.previewPrice,
    selectedSpace && formData.starts_at && formData.ends_at
      ? {
          ad_space_id: selectedSpace,
          starts_at: new Date(formData.starts_at).getTime(),
          ends_at: new Date(formData.ends_at).getTime(),
        }
      : "skip",
  );

  function openBookingDialog(spaceId: Id<"ad_spaces">) {
    setSelectedSpace(spaceId);
    setFormData({
      content_type: "store",
      title: "",
      subtitle: "",
      cta_text: "Découvrir",
      cta_link: "",
      image_url: "",
      starts_at: "",
      ends_at: "",
    });
    setBookingDialog(true);
  }

  async function handleBooking() {
    if (!selectedSpace || !formData.starts_at || !formData.ends_at) {
      toast.error("Veuillez remplir toutes les dates");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBooking({
        ad_space_id: selectedSpace,
        content_type: formData.content_type,
        title: formData.title || undefined,
        subtitle: formData.subtitle || undefined,
        cta_text: formData.cta_text || undefined,
        cta_link: formData.cta_link || undefined,
        image_url: formData.image_url || undefined,
        starts_at: new Date(formData.starts_at).getTime(),
        ends_at: new Date(formData.ends_at).getTime(),
      });

      if (result.status === "queued") {
        toast.info(
          `Réservation en file d'attente. Prix: ${formatPrice(result.totalPrice, "XOF")}. Vous serez notifié quand un slot se libère.`,
        );
      } else {
        // Initier le paiement Moneroo
        try {
          const paymentResult = await initiateAdPayment({
            booking_id: result.bookingId,
          });
          // Redirect vers Moneroo checkout
          if (paymentResult.checkout_url) {
            window.location.href = paymentResult.checkout_url;
          }
        } catch {
          toast.success(
            `Réservation créée. Prix: ${formatPrice(result.totalPrice, "XOF")}. Paiement en attente.`,
          );
        }
      }

      setBookingDialog(false);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Erreur de réservation";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!availableSpaces || !myBookings) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="size-6" />
          Espaces Publicitaires
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Boostez la visibilité de vos produits sur la page d'accueil
        </p>
      </div>

      {/* Espaces disponibles */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Emplacements disponibles</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableSpaces.map((space) => (
            <Card key={space._id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{space.name}</CardTitle>
                  <Badge
                    variant={
                      space.available_slots > 0 ? "default" : "secondary"
                    }
                  >
                    {space.available_slots > 0
                      ? `${space.available_slots} slot(s) dispo`
                      : "File d'attente"}
                  </Badge>
                </div>
                <CardDescription>
                  {space.format} — {space.width}×{space.height}px
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Jour</p>
                    <p className="text-sm font-semibold">
                      {formatPrice(space.base_price_daily, "XOF")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Semaine</p>
                    <p className="text-sm font-semibold">
                      {formatPrice(space.base_price_weekly, "XOF")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mois</p>
                    <p className="text-sm font-semibold">
                      {formatPrice(space.base_price_monthly, "XOF")}
                    </p>
                  </div>
                </div>

                {space.demand_multiplier > 1 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Info className="size-3" />
                    Multiplicateur demande: ×{space.demand_multiplier}
                  </p>
                )}

                {space.queued_count > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {space.queued_count} en file d'attente
                  </p>
                )}

                <Button
                  className="w-full"
                  onClick={() => openBookingDialog(space._id)}
                >
                  Réserver
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Mes réservations */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Mes réservations</h2>
        {myBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Megaphone className="size-10 mx-auto mb-3 opacity-40" />
              <p>Aucune réservation pour le moment</p>
              <p className="text-sm mt-1">
                Réservez un espace ci-dessus pour booster votre visibilité
              </p>
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emplacement</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">
                  <Eye className="size-4 inline mr-1" />
                  Impressions
                </TableHead>
                <TableHead className="text-right">
                  <MousePointer className="size-4 inline mr-1" />
                  Clics
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myBookings.map((booking) => {
                const statusInfo = AD_STATUS_MAP[booking.status] ?? {
                  label: booking.status,
                  variant: "outline" as const,
                };
                const ctr =
                  booking.impressions > 0
                    ? ((booking.clicks / booking.impressions) * 100).toFixed(1)
                    : "0.0";

                return (
                  <TableRow key={booking._id}>
                    <TableCell className="font-medium">
                      {booking.space_name}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3 text-muted-foreground" />
                        {format(new Date(booking.starts_at), "dd MMM", {
                          locale: fr,
                        })}
                        {" → "}
                        {format(new Date(booking.ends_at), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatPrice(booking.total_price, booking.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {booking.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {booking.clicks.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({ctr}%)
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Réserver un espace publicitaire</DialogTitle>
            <DialogDescription>
              Configurez votre annonce et choisissez la période
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type de contenu */}
            <div className="space-y-2">
              <Label>Type de contenu</Label>
              <Select
                value={formData.content_type}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    content_type: val as typeof prev.content_type,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">Ma boutique</SelectItem>
                  <SelectItem value="product">Un produit</SelectItem>
                  <SelectItem value="banner">Bannière custom</SelectItem>
                  <SelectItem value="promotion">Promotion / Coupon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Titre + Sous-titre */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Titre accrocheur"
                />
              </div>
              <div className="space-y-2">
                <Label>Sous-titre</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      subtitle: e.target.value,
                    }))
                  }
                  placeholder="Détails"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Texte du bouton</Label>
                <Input
                  value={formData.cta_text}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cta_text: e.target.value,
                    }))
                  }
                  placeholder="Découvrir"
                />
              </div>
              <div className="space-y-2">
                <Label>Lien destination</Label>
                <Input
                  value={formData.cta_link}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cta_link: e.target.value,
                    }))
                  }
                  placeholder="/stores/ma-boutique"
                />
              </div>
            </div>

            {/* Image URL */}
            {(formData.content_type === "banner" ||
              formData.content_type === "promotion") && (
              <div className="space-y-2">
                <Label>URL de l'image</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      image_url: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      starts_at: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={formData.ends_at}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ends_at: e.target.value,
                    }))
                  }
                  min={
                    formData.starts_at || new Date().toISOString().split("T")[0]
                  }
                />
              </div>
            </div>

            {/* Price preview */}
            {previewResult && (
              <div className="rounded-lg bg-muted p-4 space-y-1">
                <p className="text-sm font-medium">Estimation du prix</p>
                <p className="text-2xl font-bold">
                  {formatPrice(previewResult.totalPrice, "XOF")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {previewResult.breakdown}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleBooking} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Réserver & Payer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
