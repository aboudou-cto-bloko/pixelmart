"use client";

// filepath: src/app/shop/[storeSlug]/checkout/page.tsx

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  CreditCard,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { useShopCart } from "@/components/vendor-shop/providers";
import { useMetaPixel } from "@/components/vendor-shop/providers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  AddressForm,
  validateAddress,
  type ShippingAddress,
} from "@/components/checkout/AddressForm";
import {
  DeliverySection,
  type DeliveryConfig,
} from "@/components/checkout/DeliverySection";
import { CouponInput } from "@/components/checkout/CouponInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { SHOP_ROUTES } from "@/constants/routes";
import { DEFAULT_COUNTRY } from "@/constants/countries";
import { calculateDistance, DEFAULT_COLLECTION_POINT } from "@/lib/geocoding";
import type { Coordinates } from "@/lib/geocoding";
import type { Id } from "../../../../../convex/_generated/dataModel";

type AddressErrors = Partial<Record<keyof ShippingAddress, string>>;

export default function ShopCheckoutPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const router = useRouter();

  const { user, isAuthenticated, isLoading: authLoading } = useCurrentUser();
  const { items, totalAmount, clearCart } = useShopCart();
  const { trackEvent, generateEventId } = useMetaPixel();

  const store = useQuery(api.stores.queries.getBySlug, { slug: storeSlug });
  const warehouseCoords = useQuery(api.stores.queries.getWarehouseCoordinates);
  const createOrder = useMutation(api.orders.mutations.createOrder);
  const initializePayment = useAction(
    api.payments.moneroo.initializeShopPayment,
  );

  const [address, setAddress] = useState<ShippingAddress>(() => ({
    full_name: user?.name ?? "",
    line1: "",
    city: "",
    country: DEFAULT_COUNTRY,
  }));
  const [addressErrors, setAddressErrors] = useState<AddressErrors | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [coupon, setCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    deliveryType: "standard",
    paymentMode: "online",
    deliveryFee: 0,
    deliveryDistanceKm: undefined,
    deliveryLat: undefined,
    deliveryLon: undefined,
  });

  // ── Delivery service scenarios ──────────────────────────────
  // A: use_pixelmart_service + has_storage_plan  → products in PM warehouse → DEFAULT_COLLECTION_POINT
  // B: use_pixelmart_service + no storage plan + custom_pickup → PM collects from vendor → vendor coords
  // C: !use_pixelmart_service                   → vendor manages own delivery → hide delivery section
  const usePmService = store?.use_pixelmart_service === true;
  const hasStoragePlan = store?.has_storage_plan === true;
  const hasCustomPickup =
    store?.custom_pickup_lat !== undefined &&
    store?.custom_pickup_lon !== undefined;

  // Scenario A: usePmService + hasStoragePlan → PM warehouse
  // Scenario B: usePmService + !hasStoragePlan + hasCustomPickup → vendor pickup
  // Scenario C: !usePmService OR (usePmService + !hasStoragePlan + !hasCustomPickup) → no delivery fee
  const isScenarioA = usePmService && hasStoragePlan;
  const isScenarioB = usePmService && !hasStoragePlan && hasCustomPickup;
  const showDeliverySection = store === undefined || isScenarioA || isScenarioB;

  // Collection point for DeliverySection:
  // Scenario A → PM warehouse (from admin config, with hardcoded fallback)
  // Scenario B → vendor's custom pickup coords
  // Scenario C → not shown
  const collectionPoint: Coordinates | undefined =
    isScenarioB && store
      ? { lat: store.custom_pickup_lat!, lon: store.custom_pickup_lon! }
      : isScenarioA && warehouseCoords
        ? warehouseCoords
        : undefined;

  // Two-segment distances for storage in the order (scenario B only)
  const twoSegmentDistances = (() => {
    if (
      !usePmService ||
      hasStoragePlan ||
      !hasCustomPickup ||
      !store ||
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
    const d1 = calculateDistance(vendorPickup, hub);
    const d2 = calculateDistance(hub, clientAddr);
    return { vendorToHub: d1, hubToClient: d2 };
  })();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestEmailError, setGuestEmailError] = useState<string | null>(null);

  // Track InitiateCheckout au mount
  useEffect(() => {
    if (items.length === 0) return;
    const eventId = generateEventId();
    trackEvent(
      "InitiateCheckout",
      {
        content_ids: items.map((i) => i.productId),
        num_items: items.reduce((s, i) => s + i.quantity, 0),
        value: totalAmount / 100,
        currency: store?.currency ?? "XOF",
      },
      eventId,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const estimatedWeightKg = useMemo(() => {
    const totalGrams = items.reduce(
      (sum, item) => sum + (item.weight ?? 0) * item.quantity,
      0,
    );
    return totalGrams / 1000;
  }, [items]);

  const discountedSubtotal = coupon
    ? Math.max(0, totalAmount - coupon.discount)
    : totalAmount;
  const orderTotal = discountedSubtotal + (deliveryConfig.deliveryFee ?? 0);

  // Redirect if cart empty
  if (!authLoading && items.length === 0) {
    router.push(SHOP_ROUTES.CART(storeSlug));
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!store || isSubmitting) return;

    // Validation email invité
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
    setAddressErrors(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const orderItems = items.map((item) => ({
        productId: item.productId as Id<"products">,
        variantId: item.variantId as Id<"product_variants"> | undefined,
        quantity: item.quantity,
      }));

      // Distances bi-segment pour le scénario collecte PM chez le vendeur
      const vendorToHubKm = twoSegmentDistances?.vendorToHub;
      const hubToClientKm = twoSegmentDistances?.hubToClient;

      const { orderId } = await createOrder({
        storeId: store._id as Id<"stores">,
        items: orderItems,
        guestEmail: !isAuthenticated
          ? guestEmail.trim().toLowerCase()
          : undefined,
        guestName: !isAuthenticated
          ? address.full_name || undefined
          : undefined,
        shippingAddress: address,
        notes: notes.trim() || undefined,
        couponCode: coupon?.code,
        deliveryFee: showDeliverySection ? deliveryConfig.deliveryFee : 0,
        deliveryDistanceKm: showDeliverySection
          ? deliveryConfig.deliveryDistanceKm
          : undefined,
        deliveryDistanceVendorToHubKm: showDeliverySection
          ? vendorToHubKm
          : undefined,
        deliveryDistanceHubToClientKm: showDeliverySection
          ? hubToClientKm
          : undefined,
        deliveryLat: deliveryConfig.deliveryLat,
        deliveryLon: deliveryConfig.deliveryLon,
        deliveryType: deliveryConfig.deliveryType,
        paymentMode: deliveryConfig.paymentMode,
        source: "vendor_shop",
        estimatedWeightKg:
          estimatedWeightKg > 0 ? estimatedWeightKg : undefined,
      });

      if (deliveryConfig.paymentMode === "cod") {
        clearCart();
        router.push(
          `${SHOP_ROUTES.CONFIRMATION(storeSlug)}?order=${orderId}&cod=true`,
        );
        return;
      }

      // Online payment → redirect to Moneroo
      const { checkoutUrl } = await initializePayment({
        orderId,
        storeSlug,
      });

      clearCart();
      window.location.href = checkoutUrl;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Une erreur s'est produite.";
      setError(msg);
      toast.error(msg);
      setIsSubmitting(false);
    }
  }

  if (authLoading || store === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={SHOP_ROUTES.CART(storeSlug)}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Finaliser la commande</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Items summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{store.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.cartItemId} className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 rounded-md overflow-hidden bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.title}</p>
                  {item.variantTitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.variantTitle}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Qté : {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium shrink-0">
                  {formatPrice(item.price * item.quantity, "XOF")}
                </p>
              </div>
            ))}

            <Separator />

            {/* Coupon */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Code promo
              </Label>
              <div className="mt-1.5">
                <CouponInput
                  storeId={store._id}
                  subtotal={totalAmount}
                  appliedCode={coupon?.code ?? null}
                  onApply={(code, discount) => setCoupon({ code, discount })}
                  onRemove={() => setCoupon(null)}
                />
              </div>
            </div>

            <Separator />

            {/* Totaux */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{formatPrice(totalAmount, "XOF")}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction ({coupon.code})</span>
                  <span>-{formatPrice(coupon.discount, "XOF")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>
                  {!showDeliverySection
                    ? "Par la boutique"
                    : (deliveryConfig.deliveryFee ?? 0) > 0
                      ? formatPrice(deliveryConfig.deliveryFee ?? 0, "XOF")
                      : "À définir"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span style={{ color: "var(--shop-primary, #6366f1)" }}>
                  {formatPrice(orderTotal, "XOF")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery */}
        {showDeliverySection ? (
          <DeliverySection
            value={deliveryConfig}
            onChange={setDeliveryConfig}
            collectionPoint={collectionPoint}
          />
        ) : (
          store && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Les frais de livraison sont définis par la boutique et vous
                  seront communiqués après confirmation de votre commande.
                </p>
              </CardContent>
            </Card>
          )
        )}

        {/* Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Adresse de livraison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!authLoading && !isAuthenticated && (
              <div className="space-y-1.5">
                <Label htmlFor="guest-email" className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="votre@email.com"
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
                    Votre confirmation de commande sera envoyée à cette adresse.
                  </p>
                )}
              </div>
            )}
            <AddressForm
              address={address}
              onChange={setAddress}
              errors={addressErrors ?? {}}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="notes">Note pour le vendeur (optionnel)</Label>
            <Textarea
              id="notes"
              className="mt-2"
              rows={2}
              placeholder="Instructions spéciales pour la commande…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>

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
          className="w-full"
          disabled={isSubmitting}
          style={{ backgroundColor: "var(--shop-primary, #6366f1)" }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Traitement en cours…
            </>
          ) : deliveryConfig.paymentMode === "cod" ? (
            <>
              <Banknote className="size-4 mr-2" />
              Confirmer (paiement à la livraison)
            </>
          ) : (
            <>
              <CreditCard className="size-4 mr-2" />
              Payer {formatPrice(orderTotal, "XOF")}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-green-500" />
          Paiement 100% sécurisé via Moneroo
        </p>
      </form>
    </div>
  );
}
