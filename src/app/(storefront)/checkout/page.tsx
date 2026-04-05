// filepath: src/app/(storefront)/checkout/page.tsx

"use client";

import { useAction, useQuery } from "convex/react";
import { setPaymentQueue } from "@/lib/payment-queue";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  CreditCard,
  Store,
  AlertCircle,
  Banknote,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useCart } from "@/hooks/useCart";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  AddressForm,
  validateAddress,
  type ShippingAddress,
} from "@/components/checkout/AddressForm";
import { CouponInput } from "@/components/checkout/CouponInput";
import {
  DeliverySection,
  type DeliveryConfig,
} from "@/components/checkout/DeliverySection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { DEFAULT_COUNTRY } from "@/constants/countries";
import type { CartStore } from "@/types/cart";
import type { Id } from "../../../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────

interface StoreCoupon {
  code: string;
  discount: number;
}

interface OrderResult {
  orderId: Id<"orders">;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  paymentMode: "online" | "cod";
}

type AddressErrors = Partial<Record<keyof ShippingAddress, string>>;

// ─── Store Order Card ────────────────────────────────────────

function StoreOrderCard({
  store,
  coupon,
  deliveryFee,
  isPmStore,
  onCouponApply,
  onCouponRemove,
}: {
  store: CartStore;
  coupon: StoreCoupon | null;
  deliveryFee: number;
  isPmStore?: boolean;
  onCouponApply: (code: string, discount: number) => void;
  onCouponRemove: () => void;
}) {
  const discountedSubtotal = coupon
    ? Math.max(0, store.subtotal - coupon.discount)
    : store.subtotal;

  const storeTotal = discountedSubtotal + deliveryFee;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Store className="size-4 text-muted-foreground" />
          <Link
            href={ROUTES.STORE(store.storeSlug)}
            className="hover:text-primary transition-colors"
          >
            {store.storeName}
          </Link>
          <Badge variant="outline" className="text-xs ml-auto">
            {store.items.length} article{store.items.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Items */}
        {store.items.map((item) => (
          <div key={item.cartItemId} className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">
                  N/A
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{item.title}</p>
              {item.variantTitle && (
                <p className="text-xs text-muted-foreground">
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
          <Label className="text-xs text-muted-foreground">Code promo</Label>
          <div className="mt-1.5">
            <CouponInput
              storeId={store.storeId}
              subtotal={store.subtotal}
              appliedCode={coupon?.code ?? null}
              onApply={onCouponApply}
              onRemove={onCouponRemove}
            />
          </div>
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{formatPrice(store.subtotal, "XOF")}</span>
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
              {isPmStore === false
                ? "Par la boutique"
                : deliveryFee > 0
                  ? formatPrice(deliveryFee, "XOF")
                  : "À définir"}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total boutique</span>
            <span className="text-primary">
              {formatPrice(storeTotal, "XOF")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Checkout Page ───────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useCurrentUser();
  const { stores, totalItems, clearStore } = useCart();
  const createOrder = useMutation(api.orders.mutations.createOrder);
  const initializePayment = useAction(api.payments.moneroo.initializePayment);

  // ── Per-store delivery config ──
  const storeIds = stores.map((s) => s.storeId as Id<"stores">);
  const storeDeliveryConfigs = useQuery(
    api.stores.queries.getDeliveryConfigBatch,
    storeIds.length > 0 ? { storeIds } : "skip",
  );
  const warehouseCoords = useQuery(api.stores.queries.getWarehouseCoordinates);

  // A store counts as "PM store" (delivery fee calculated) only when:
  //   Scenario A: use_pixelmart_service=true AND has_storage_plan=true (products in PM warehouse)
  //   Scenario B: use_pixelmart_service=true AND has custom pickup coords (PM collects from vendor)
  // Otherwise scenario C: no delivery fee, vendor handles delivery
  const anyPmStore = storeIds.some((id) => {
    const cfg = storeDeliveryConfigs?.[id];
    if (!cfg) return true; // configs not loaded yet → optimistic
    if (!cfg.use_pixelmart_service) return false;
    const hasCoords =
      cfg.custom_pickup_lat !== undefined &&
      cfg.custom_pickup_lon !== undefined;
    return cfg.has_storage_plan || hasCoords;
  });
  const allIndependent = storeDeliveryConfigs
    ? storeIds.every((id) => {
        const cfg = storeDeliveryConfigs[id];
        return cfg && !cfg.use_pixelmart_service;
      })
    : false;

  // ── State ──
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

  // ── Delivery State (OpenStreetMap) ──
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    deliveryType: "standard",
    paymentMode: "online",
  });
  const [deliveryAddressError, setDeliveryAddressError] = useState<
    string | null
  >(null);

  const [storeCoupons, setStoreCoupons] = useState<Record<string, StoreCoupon>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestEmailError, setGuestEmailError] = useState<string | null>(null);

  // ── Coupon handlers ──
  function handleCouponApply(storeId: string, code: string, discount: number) {
    setStoreCoupons((prev) => ({ ...prev, [storeId]: { code, discount } }));
  }

  function handleCouponRemove(storeId: string) {
    setStoreCoupons((prev) => {
      const next = { ...prev };
      delete next[storeId];
      return next;
    });
  }

  // ── Delivery config handler ──
  function handleDeliveryChange(config: DeliveryConfig) {
    setDeliveryConfig(config);
    setDeliveryAddressError(null);
  }

  // ── Sync address city from delivery selection ──
  function handleDeliveryConfigChange(config: DeliveryConfig) {
    handleDeliveryChange(config);

    // Mettre à jour la ville de l'adresse si on a sélectionné une adresse de livraison
    if (config.deliveryCity && config.deliveryCity !== address.city) {
      setAddress((prev) => ({
        ...prev,
        city: config.deliveryCity ?? prev.city,
        line1: config.deliveryAddress ?? prev.line1,
      }));
    }
  }

  // ── Poids total estimé (grammes → kg) ──
  const estimatedWeightKg = useMemo(() => {
    const totalGrams = stores.reduce((sum, store) => {
      return (
        sum +
        store.items.reduce((s, item) => {
          return s + (item.weight ?? 0) * item.quantity;
        }, 0)
      );
    }, 0);
    return totalGrams / 1000;
  }, [stores]);

  // ── Frais de livraison (depuis DeliveryDistanceCalculator) ──
  const deliveryFee = deliveryConfig.deliveryFee ?? 0;

  // ── Grand total avec réductions et livraison ──
  const grandTotal = useMemo(() => {
    const subtotalWithDiscounts = stores.reduce((sum, store) => {
      const coupon = storeCoupons[store.storeId];
      return (
        sum +
        (coupon
          ? Math.max(0, store.subtotal - coupon.discount)
          : store.subtotal)
      );
    }, 0);

    return subtotalWithDiscounts + deliveryFee;
  }, [stores, storeCoupons, deliveryFee]);

  // ── Validation ──
  const isDeliveryAddressValid =
    deliveryConfig.deliveryLat !== undefined &&
    deliveryConfig.deliveryLon !== undefined;

  // ── Submit ──
  async function handleSubmit() {
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

    // Valider l'adresse de facturation/contact
    const errors = validateAddress(address);
    if (errors) {
      setAddressErrors(errors);
      return;
    }
    setAddressErrors(null);

    // Valider l'adresse de livraison (coordonnées GPS requises)
    if (!isDeliveryAddressValid) {
      setDeliveryAddressError(
        "Veuillez sélectionner une adresse de livraison valide",
      );
      return;
    }
    setDeliveryAddressError(null);

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderResults: OrderResult[] = [];

      // 1. Créer toutes les commandes
      for (const store of stores) {
        const coupon = storeCoupons[store.storeId];
        const storeCfg = storeDeliveryConfigs?.[store.storeId];
        const storePmService = storeCfg
          ? storeCfg.use_pixelmart_service &&
            (storeCfg.has_storage_plan ||
              (storeCfg.custom_pickup_lat !== undefined &&
                storeCfg.custom_pickup_lon !== undefined))
          : true;

        const result = await createOrder({
          storeId: store.storeId,
          items: store.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          guestEmail: !isAuthenticated
            ? guestEmail.trim().toLowerCase()
            : undefined,
          shippingAddress: {
            full_name: address.full_name,
            line1: deliveryConfig.deliveryAddress ?? address.line1,
            line2: address.line2,
            city: deliveryConfig.deliveryCity ?? address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
            phone: address.phone,
          },
          couponCode: coupon?.code,
          notes: notes.trim() || undefined,
          // ── Champs delivery OpenStreetMap ──
          deliveryLat: deliveryConfig.deliveryLat,
          deliveryLon: deliveryConfig.deliveryLon,
          deliveryDistanceKm: storePmService
            ? deliveryConfig.deliveryDistanceKm
            : undefined,
          deliveryFee: storePmService ? deliveryConfig.deliveryFee : 0,
          deliveryType: deliveryConfig.deliveryType,
          paymentMode: deliveryConfig.paymentMode,
          estimatedWeightKg:
            estimatedWeightKg > 0 ? estimatedWeightKg : undefined,
        });

        orderResults.push(result as OrderResult);
        clearStore(store.storeId);
      }

      // 2. Gérer le flux selon le mode de paiement
      if (deliveryConfig.paymentMode === "cod") {
        // COD : Rediriger directement vers la confirmation
        const orderNumbers = orderResults.map((r) => r.orderNumber).join(",");
        router.push(
          `${ROUTES.ORDER_CONFIRMATION}?orders=${encodeURIComponent(orderNumbers)}&paid=false&cod=true`,
        );
      } else {
        // Online : Initialiser le paiement Moneroo
        const orderIds = orderResults.map((r) => r.orderId);
        setPaymentQueue(orderIds);

        const { checkoutUrl } = await initializePayment({
          orderId: orderIds[0],
        });

        window.location.href = checkoutUrl;
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la commande";
      setSubmitError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  }

  // ── Guards ──

  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4">Votre panier est vide</h1>
        <p className="text-muted-foreground mb-6">
          Ajoutez des produits avant de passer commande.
        </p>
        <Button asChild>
          <Link href={ROUTES.PRODUCTS}>Parcourir le catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.CART}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1>Passer commande</h1>
      </div>

      {/* Step progress */}
      <div
        className="flex items-center mb-8"
        aria-label="Étapes de la commande"
      >
        {(["Contact", "Livraison", "Paiement"] as const).map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <span className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {i + 1}
              </span>
              <span className="text-sm font-medium hidden sm:inline">
                {label}
              </span>
            </div>
            {i < 2 && <div className="flex-1 mx-3 h-px bg-border" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Left — Forms */}
        <div className="lg:col-span-3 space-y-6">
          {/* 1. Informations de contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Informations de contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated && (
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
                    <p className="text-xs text-destructive">
                      {guestEmailError}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Votre confirmation de commande sera envoyée à cette
                      adresse.
                    </p>
                  )}
                </div>
              )}
              <AddressForm
                address={address}
                onChange={(addr) => {
                  setAddress(addr);
                  setAddressErrors(null);
                }}
                errors={addressErrors ?? undefined}
              />
            </CardContent>
          </Card>

          {/* 2. Options de livraison (avec AddressAutocomplete OSM) */}
          <DeliverySection
            estimatedWeightKg={estimatedWeightKg}
            value={deliveryConfig}
            onChange={handleDeliveryConfigChange}
            addressError={deliveryAddressError ?? undefined}
            collectionPoint={warehouseCoords ?? undefined}
            skipFeeCalculation={allIndependent}
          />

          {/* 3. Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Note pour le vendeur{" "}
                <span className="font-normal text-muted-foreground">
                  (optionnel)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions spéciales, demandes particulières…"
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {notes.length}/500
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right — Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {stores.map((store) => {
            const cfg = storeDeliveryConfigs?.[store.storeId];
            const isPm = cfg
              ? cfg.use_pixelmart_service &&
                (cfg.has_storage_plan ||
                  (cfg.custom_pickup_lat !== undefined &&
                    cfg.custom_pickup_lon !== undefined))
              : true;
            return (
              <StoreOrderCard
                key={store.storeId}
                store={store}
                coupon={storeCoupons[store.storeId] ?? null}
                deliveryFee={stores.length === 1 && isPm ? deliveryFee : 0}
                isPmStore={isPm}
                onCouponApply={(code, discount) =>
                  handleCouponApply(store.storeId, code, discount)
                }
                onCouponRemove={() => handleCouponRemove(store.storeId)}
              />
            );
          })}

          {/* Multi-store delivery fee notice */}
          {stores.length > 1 && deliveryFee > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Livraison ({deliveryConfig.deliveryCity ?? "—"})
                  </span>
                  <span>{formatPrice(deliveryFee, "XOF")}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grand total + Submit */}
          <Card className="sticky top-20">
            <CardContent className="p-4 space-y-4">
              {stores.length > 1 && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                  {stores.length} commandes seront créées (une par boutique).
                </p>
              )}

              {/* Payment mode indicator */}
              {deliveryConfig.paymentMode === "cod" && (
                <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-md p-3">
                  <Banknote className="size-4" />
                  <span>Paiement à la livraison sélectionné</span>
                </div>
              )}

              {/* Distance info */}
              {deliveryConfig.deliveryDistanceKm && (
                <div className="text-xs text-muted-foreground">
                  Distance estimée :{" "}
                  {deliveryConfig.deliveryDistanceKm.toFixed(1)} km
                </div>
              )}

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(grandTotal, "XOF")}
                </span>
              </div>

              {submitError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{submitError}</p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting || !isDeliveryAddressValid}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Traitement en cours…
                  </>
                ) : deliveryConfig.paymentMode === "cod" ? (
                  <>
                    <ShieldCheck className="size-4 mr-2" />
                    Confirmer (paiement à la livraison)
                  </>
                ) : (
                  <>
                    <CreditCard className="size-4 mr-2" />
                    Payer {formatPrice(grandTotal, "XOF")}
                  </>
                )}
              </Button>

              {!isDeliveryAddressValid && (
                <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                  Sélectionnez une adresse de livraison pour continuer
                </p>
              )}

              {/* Security reassurance message */}
              <div className="flex items-start gap-3 rounded-lg border-2 border-green-300 bg-green-100 dark:bg-green-950/30 dark:border-green-700 p-4 shadow-sm">
                <ShieldCheck className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                    Paiement 100% sécurisé
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Cette boutique est propulsée par Pixel-Mart. Vos fonds sont
                    conservés jusqu'à la confirmation de livraison. En cas de
                    souci, vous êtes remboursé.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                En confirmant, vous acceptez nos{" "}
                <Link href="/terms" className="underline hover:text-foreground">
                  CGV
                </Link>{" "}
                et notre{" "}
                <Link
                  href="/privacy"
                  className="underline hover:text-foreground"
                >
                  politique de confidentialité
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
