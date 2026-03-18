// filepath: src/app/(storefront)/checkout/page.tsx

"use client";

import { useAction } from "convex/react";
import { setPaymentQueue } from "@/lib/payment-queue";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Store,
  AlertCircle,
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
import { formatPrice } from "@/lib/utils";
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

// ─── Calcul frais livraison (client-side mirror) ─────────────

const URGENT_FRAGILE_RATES = {
  tier1: { maxKm: 5, fixedPrice: 70000 },
  tier2: { minKm: 6, maxKm: 10, pricePerKm: 20000 },
  tier3: { minKm: 11, pricePerKm: 15000 },
} as const;

const STANDARD_RATES = {
  tier1: { maxKm: 5, fixedPrice: 60000 },
  tier2: { minKm: 6, pricePerKm: 17000 },
} as const;

const NIGHT_RATES = { startHour: 21, endHour: 6, pricePerKm: 25000 } as const;
const WEIGHT_SURCHARGE = { thresholdKg: 20, pricePerKg: 5000 } as const;

function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= NIGHT_RATES.startHour || hour < NIGHT_RATES.endHour;
}

function calculateDeliveryFeeClient(
  distanceKm: number,
  deliveryType: "standard" | "urgent" | "fragile",
  weightKg: number = 0,
): number {
  const distance = Math.ceil(distanceKm);
  const nightRate = isNightTime();

  let baseFee: number;

  if (nightRate) {
    baseFee = distance * NIGHT_RATES.pricePerKm;
  } else if (deliveryType === "urgent" || deliveryType === "fragile") {
    if (distance <= URGENT_FRAGILE_RATES.tier1.maxKm) {
      baseFee = URGENT_FRAGILE_RATES.tier1.fixedPrice;
    } else if (distance <= URGENT_FRAGILE_RATES.tier2.maxKm) {
      baseFee = distance * URGENT_FRAGILE_RATES.tier2.pricePerKm;
    } else {
      baseFee = distance * URGENT_FRAGILE_RATES.tier3.pricePerKm;
    }
  } else {
    if (distance <= STANDARD_RATES.tier1.maxKm) {
      baseFee = STANDARD_RATES.tier1.fixedPrice;
    } else {
      baseFee = distance * STANDARD_RATES.tier2.pricePerKm;
    }
  }

  let weightSurcharge = 0;
  if (weightKg > WEIGHT_SURCHARGE.thresholdKg) {
    weightSurcharge =
      (weightKg - WEIGHT_SURCHARGE.thresholdKg) * WEIGHT_SURCHARGE.pricePerKg;
  }

  return Math.round(baseFee + weightSurcharge);
}

// ─── Store Order Card ────────────────────────────────────────

function StoreOrderCard({
  store,
  coupon,
  deliveryFee,
  onCouponApply,
  onCouponRemove,
}: {
  store: CartStore;
  coupon: StoreCoupon | null;
  deliveryFee: number;
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
              {deliveryFee > 0 ? formatPrice(deliveryFee, "XOF") : "À définir"}
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

  // ── Delivery State ──
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
    deliveryType: "standard",
    paymentMode: "online",
  });

  const [storeCoupons, setStoreCoupons] = useState<Record<string, StoreCoupon>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // ── Calcul des frais de livraison ──
  const deliveryFee = useMemo(() => {
    if (!deliveryConfig.distanceKm) return 0;
    return calculateDeliveryFeeClient(
      deliveryConfig.distanceKm,
      deliveryConfig.deliveryType,
      0, // TODO: calculer le poids total des items
    );
  }, [deliveryConfig.distanceKm, deliveryConfig.deliveryType]);

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

    // Frais de livraison unique (pas par boutique dans ce modèle)
    return subtotalWithDiscounts + deliveryFee;
  }, [stores, storeCoupons, deliveryFee]);

  // ── Submit ──
  async function handleSubmit() {
    if (!isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirect=${ROUTES.CHECKOUT}`);
      return;
    }

    const errors = validateAddress(address);
    if (errors) {
      setAddressErrors(errors);
      return;
    }
    setAddressErrors(null);

    // Validation livraison
    if (!deliveryConfig.zoneId) {
      setSubmitError("Veuillez sélectionner une zone de livraison");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderResults: OrderResult[] = [];

      // 1. Créer toutes les commandes
      for (const store of stores) {
        const coupon = storeCoupons[store.storeId];

        const result = await createOrder({
          storeId: store.storeId,
          items: store.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            full_name: address.full_name,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
            phone: address.phone,
          },
          couponCode: coupon?.code,
          notes: notes.trim() || undefined,
          paymentMethod:
            deliveryConfig.paymentMode === "cod" ? "cod" : "moneroo",
          // ── Nouveaux champs delivery ──
          deliveryZoneId: deliveryConfig.zoneId,
          deliveryType: deliveryConfig.deliveryType,
          paymentMode: deliveryConfig.paymentMode,
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

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4">Connectez-vous pour commander</h1>
        <p className="text-muted-foreground mb-6">
          Un compte est nécessaire pour passer commande.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href={`${ROUTES.LOGIN}?redirect=${ROUTES.CHECKOUT}`}>
              Se connecter
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`${ROUTES.REGISTER}?redirect=${ROUTES.CHECKOUT}`}>
              Créer un compte
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.CART}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1>Passer commande</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Left — Forms */}
        <div className="lg:col-span-3 space-y-6">
          {/* 1. Adresse de livraison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adresse de livraison</CardTitle>
            </CardHeader>
            <CardContent>
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

          {/* 2. Options de livraison */}
          <DeliverySection
            city={address.city || undefined}
            value={deliveryConfig}
            onChange={setDeliveryConfig}
            codEnabled={true}
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
          {stores.map((store) => (
            <StoreOrderCard
              key={store.storeId}
              store={store}
              coupon={storeCoupons[store.storeId] ?? null}
              deliveryFee={stores.length === 1 ? deliveryFee : 0}
              onCouponApply={(code, discount) =>
                handleCouponApply(store.storeId, code, discount)
              }
              onCouponRemove={() => handleCouponRemove(store.storeId)}
            />
          ))}

          {/* Multi-store delivery fee notice */}
          {stores.length > 1 && deliveryFee > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Livraison ({deliveryConfig.zoneName})
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
                  <CreditCard className="size-4" />
                  <span>Paiement à la livraison sélectionné</span>
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
                disabled={isSubmitting || !deliveryConfig.zoneId}
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
                    <ShieldCheck className="size-4 mr-2" />
                    Payer {formatPrice(grandTotal, "XOF")}
                  </>
                )}
              </Button>

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
