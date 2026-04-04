// filepath: src/components/vendor-shop/organisms/QuickOrderSheet.tsx

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import Image from "next/image";
import {
  Loader2,
  ShieldCheck,
  CreditCard,
  Banknote,
  AlertCircle,
  X,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AddressForm,
  validateAddress,
  type ShippingAddress,
} from "@/components/checkout/AddressForm";
import {
  DeliverySection,
  type DeliveryConfig,
} from "@/components/checkout/DeliverySection";
import { formatPrice } from "@/lib/utils";
import { SHOP_ROUTES, ROUTES } from "@/constants/routes";
import { DEFAULT_COUNTRY } from "@/constants/countries";
import { calculateDistance, DEFAULT_COLLECTION_POINT } from "@/lib/geocoding";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useMetaPixel } from "@/components/vendor-shop/providers";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────

interface QuickOrderProduct {
  _id: Id<"products">;
  title: string;
  price: number;
  compare_price?: number;
  images?: string[];
  quantity?: number;
  is_digital: boolean;
  slug: string;
  weight?: number;
}

interface QuickOrderStore {
  _id: Id<"stores">;
  name: string;
  slug: string;
  currency?: string;
  use_pixelmart_service?: boolean;
  has_storage_plan?: boolean;
  custom_pickup_lat?: number;
  custom_pickup_lon?: number;
}

interface QuickOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: QuickOrderProduct;
  store: QuickOrderStore;
  storeSlug: string;
  quantity: number;
  variantId?: string;
  variantTitle?: string;
}

// ─── Component ──────────────────────────────────────────────

export function QuickOrderSheet({
  open,
  onOpenChange,
  product,
  store,
  storeSlug,
  quantity,
  variantId,
  variantTitle,
}: QuickOrderSheetProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useCurrentUser();
  const { trackEvent, generateEventId } = useMetaPixel();

  const createOrder = useMutation(api.orders.mutations.createOrder);
  const initializePayment = useAction(
    api.payments.moneroo.initializeShopPayment,
  );

  const currency = store.currency ?? "XOF";
  const totalAmount = product.price * quantity;

  const [address, setAddress] = useState<ShippingAddress>({
    full_name: user?.name ?? "",
    line1: "",
    city: "",
    country: DEFAULT_COUNTRY,
  });
  const [addressErrors, setAddressErrors] = useState<
    Partial<Record<keyof ShippingAddress, string>>
  >({});
  const [notes, setNotes] = useState("");
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    deliveryType: "standard",
    paymentMode: "online",
    deliveryFee: 0,
    deliveryDistanceKm: undefined,
    deliveryLat: undefined,
    deliveryLon: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestEmailError, setGuestEmailError] = useState<string | null>(null);

  // Two-segment distances for pickup-collection scenario
  const isPickupScenario =
    store.use_pixelmart_service === true &&
    !store.has_storage_plan &&
    store.custom_pickup_lat !== undefined &&
    store.custom_pickup_lon !== undefined;

  const twoSegmentDistances = (() => {
    if (
      !isPickupScenario ||
      store.custom_pickup_lat === undefined ||
      store.custom_pickup_lon === undefined ||
      deliveryConfig.deliveryLat === undefined ||
      deliveryConfig.deliveryLon === undefined
    ) {
      return undefined;
    }
    const hub = DEFAULT_COLLECTION_POINT;
    const vendorPickup = {
      lat: store.custom_pickup_lat,
      lon: store.custom_pickup_lon,
    };
    const clientAddr = {
      lat: deliveryConfig.deliveryLat,
      lon: deliveryConfig.deliveryLon,
    };
    return {
      vendorToHub: calculateDistance(vendorPickup, hub),
      hubToClient: calculateDistance(hub, clientAddr),
    };
  })();

  const orderTotal = totalAmount + (deliveryConfig.deliveryFee ?? 0);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation email invité si non connecté
      if (!isAuthenticated) {
        if (!guestEmail.trim()) {
          setGuestEmailError("Votre email est requis pour commander");
          return;
        }
        if (!guestEmail.includes("@")) {
          setGuestEmailError("Email invalide");
          return;
        }
        setGuestEmailError(null);
      }

      const errors = validateAddress(address);
      if (errors && Object.keys(errors).length > 0) {
        setAddressErrors(errors);
        return;
      }
      setAddressErrors({});
      setError(null);
      setIsSubmitting(true);

      const eventId = generateEventId();

      try {
        const estimatedWeightKg =
          product.weight && product.weight > 0
            ? (product.weight * quantity) / 1000
            : undefined;

        const { orderId } = await createOrder({
          storeId: store._id,
          items: [
            {
              productId: product._id,
              quantity,
              variantId: variantId as Id<"product_variants"> | undefined,
            },
          ],
          shippingAddress: address,
          notes: notes.trim() || undefined,
          deliveryFee: deliveryConfig.deliveryFee,
          deliveryDistanceKm: deliveryConfig.deliveryDistanceKm,
          deliveryDistanceVendorToHubKm: twoSegmentDistances?.vendorToHub,
          deliveryDistanceHubToClientKm: twoSegmentDistances?.hubToClient,
          deliveryLat: deliveryConfig.deliveryLat,
          deliveryLon: deliveryConfig.deliveryLon,
          deliveryType: deliveryConfig.deliveryType,
          paymentMode: deliveryConfig.paymentMode,
          source: "vendor_shop",
          estimatedWeightKg,
          // Guest checkout
          guestEmail: !isAuthenticated
            ? guestEmail.trim().toLowerCase()
            : undefined,
          guestName: !isAuthenticated
            ? address.full_name || undefined
            : undefined,
        });

        trackEvent(
          "Purchase",
          {
            content_ids: [product._id],
            content_type: "product",
            value: orderTotal / 100,
            currency,
            num_items: quantity,
          },
          eventId,
        );

        if (deliveryConfig.paymentMode === "cod") {
          onOpenChange(false);
          router.push(
            `${SHOP_ROUTES.CONFIRMATION(storeSlug)}?order=${orderId}&cod=true`,
          );
          return;
        }

        // Online payment
        const { checkoutUrl } = await initializePayment({ orderId, storeSlug });
        onOpenChange(false);
        window.location.href = checkoutUrl;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Une erreur s'est produite.";
        setError(msg);
        toast.error(msg);
        setIsSubmitting(false);
      }
    },
    [
      address,
      notes,
      deliveryConfig,
      product,
      store,
      quantity,
      orderTotal,
      currency,
      storeSlug,
      user,
      isAuthenticated,
      guestEmail,
      router,
      createOrder,
      initializePayment,
      trackEvent,
      generateEventId,
      onOpenChange,
      twoSegmentDistances,
      variantId,
      variantTitle,
    ],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg p-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Sticky header */}
        <SheetHeader className="shrink-0 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">
              Finaliser ma commande
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        <form
          id="quick-order-form"
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Product recap */}
            <div className="flex items-center gap-3 rounded-xl border p-3 bg-muted/20">
              {product.images?.[0] && (
                <div className="relative size-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.title}</p>
                {variantTitle && (
                  <p className="text-xs text-muted-foreground">
                    {variantTitle}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Qté : {quantity}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className="font-bold text-sm"
                  style={{ color: "var(--shop-primary, #6366f1)" }}
                >
                  {formatPrice(product.price * quantity, currency)}
                </p>
              </div>
            </div>

            {/* Delivery */}
            <DeliverySection
              value={deliveryConfig}
              onChange={setDeliveryConfig}
              estimatedWeightKg={0}
            />

            {/* Address */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Adresse de livraison</h3>
              <AddressForm
                address={address}
                onChange={setAddress}
                errors={addressErrors}
              />
            </div>

            {/* Email invité — visible uniquement si non connecté */}
            {!authLoading && !isAuthenticated && (
              <div className="space-y-2">
                <Label htmlFor="guest-email" className="text-sm font-semibold">
                  Votre email
                </Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={guestEmail}
                  onChange={(e) => {
                    setGuestEmail(e.target.value);
                    if (guestEmailError) setGuestEmailError(null);
                  }}
                  className={guestEmailError ? "border-destructive" : ""}
                />
                {guestEmailError ? (
                  <p className="text-xs text-destructive">{guestEmailError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Pour recevoir la confirmation et suivre votre commande.
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="quick-notes" className="text-sm">
                Note pour le vendeur (optionnel)
              </Label>
              <Textarea
                id="quick-notes"
                rows={2}
                placeholder="Instructions spéciales…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>

          {/* Sticky footer — always visible */}
          <div className="shrink-0 border-t bg-background px-6 py-4 space-y-3">
            {/* Order summary */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatPrice(totalAmount, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>
                  {(deliveryConfig.deliveryFee ?? 0) > 0
                    ? formatPrice(deliveryConfig.deliveryFee ?? 0, currency)
                    : "À définir"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>Total</span>
                <span style={{ color: "var(--shop-primary, #6366f1)" }}>
                  {formatPrice(orderTotal, currency)}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-base"
              disabled={isSubmitting}
              style={{ backgroundColor: "var(--shop-primary, #6366f1)" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 mr-2 animate-spin" />
                  Traitement…
                </>
              ) : deliveryConfig.paymentMode === "cod" ? (
                <>
                  <Banknote className="size-5 mr-2" />
                  Confirmer (paiement à la livraison)
                </>
              ) : (
                <>
                  <CreditCard className="size-5 mr-2" />
                  Payer {formatPrice(orderTotal, currency)}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3.5 text-green-500" />
              Paiement 100% sécurisé
            </p>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
