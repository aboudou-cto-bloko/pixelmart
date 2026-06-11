"use client";

// filepath: src/components/marketing/LandingMockups.tsx
// Micro-visuels — cartes statiques (état final) + mot rotatif du hero.
// AUCUNE lib d'animation (pas de motion → pas d'eval). Le mot rotatif utilise
// setInterval + une keyframe CSS (pm-rise) : compatible CSP stricte en prod.
// Fort contraste, aucun gradient.

import { useEffect, useState } from "react";
import { Check, Truck, Package, CreditCard, MapPin, Store } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================== */
/* Number — affichage statique d'un nombre formaté FR             */
/* ============================================================== */

export function CountUp({
  to,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {prefix}
      {to.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}

/* ============================================================== */
/* BrandSwap — mot rotatif du hero (setInterval + keyframe CSS)     */
/* ============================================================== */

export function BrandSwap({ words }: { words: string[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % words.length), 2600);
    return () => clearInterval(id);
  }, [words.length]);

  // Réserve la largeur du mot le plus long pour éviter le reflow.
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b));

  return (
    <span className="relative inline-grid align-bottom">
      <span
        key={i}
        className="col-start-1 row-start-1 text-primary"
        style={{ animation: "pm-rise 0.5s ease both" }}
      >
        {words[i]}
      </span>
      <span className="invisible col-start-1 row-start-1" aria-hidden>
        {longest}
      </span>
    </span>
  );
}

/* ============================================================== */
/* PaymentConfirm — encaissement Mobile Money (état : confirmé)     */
/* ============================================================== */

const OPERATORS = ["MTN", "Moov", "Celtiis"];

export function PaymentConfirm() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Encaissement
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CreditCard className="size-3.5" />
          Mobile Money
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
          24 500
        </span>
        <span className="text-sm font-medium text-muted-foreground">FCFA</span>
      </div>

      <div className="mt-4 flex gap-1.5">
        {OPERATORS.map((op) => (
          <span
            key={op}
            className="flex-1 rounded-md border border-border bg-background py-1.5 text-center text-[0.7rem] font-semibold text-foreground"
          >
            {op}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary">
          <Check className="size-3 text-black" />
        </span>
        <span className="text-sm font-medium text-foreground">
          Paiement confirmé
        </span>
      </div>
    </div>
  );
}

/* ============================================================== */
/* OrderFlow — statut commande (toutes étapes franchies)            */
/* ============================================================== */

const STEPS = [
  { label: "Payée", icon: CreditCard },
  { label: "Préparée", icon: Package },
  { label: "Expédiée", icon: Truck },
  { label: "Livrée", icon: Check },
];

export function OrderFlow() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-foreground">
          PM-2026-0042
        </span>
        <span className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-black">
          Livrée
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="flex size-7 items-center justify-center rounded-full border border-primary bg-primary text-black">
                  <Icon className="size-3.5" />
                </span>
                {idx < STEPS.length - 1 && (
                  <span className="h-7 w-px bg-primary" />
                )}
              </div>
              <span
                className={cn(
                  "pb-7 text-sm font-medium text-foreground",
                  idx === STEPS.length - 1 && "pb-0",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================== */
/* RevenueCard — KPI revenu + barres (état final)                  */
/* ============================================================== */

const BARS = [38, 52, 44, 68, 58, 82, 74];

export function RevenueCard() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/20">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Revenu — 7 jours
      </span>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-heading text-3xl font-semibold tracking-[-0.03em] text-foreground">
          186 000
        </span>
        <span className="text-sm font-medium text-muted-foreground">FCFA</span>
      </div>

      <div className="mt-5 flex h-24 items-end gap-2">
        {BARS.map((h, idx) => (
          <span
            key={idx}
            className={cn(
              "flex-1 rounded-sm",
              idx === BARS.length - 1 ? "bg-primary" : "bg-foreground/15",
            )}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================== */
/* DeliveryBatch — commandes regroupées (statique)                 */
/* ============================================================== */

const DROPS = [
  { code: "PM-0042", zone: "Akpakpa", km: "3,2 km" },
  { code: "PM-0043", zone: "Cadjèhoun", km: "5,8 km" },
  { code: "PM-0044", zone: "Fidjrossè", km: "7,1 km" },
];

export function DeliveryBatch() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-foreground">
          LOT-2026-0007
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Truck className="size-3.5" />1 trajet
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {DROPS.map((d) => (
          <div
            key={d.code}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
          >
            <MapPin className="size-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-semibold text-foreground">
                {d.code}
              </p>
              <p className="truncate text-xs text-muted-foreground">{d.zone}</p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {d.km}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Frais calculés</span>
        <span className="text-sm font-semibold text-foreground">
          2 100 FCFA
        </span>
      </div>
    </div>
  );
}

/* ============================================================== */
/* ShopUrlCard — boutique dédiée : URL + thème (statique)           */
/* ============================================================== */

const SWATCHES = ["#EA580C", "#2563EB", "#7C3AED", "#16A34A", "#18181B"];

export function ShopUrlCard() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <span className="size-2 rounded-full bg-primary" />
        <span className="truncate font-mono text-xs text-foreground">
          pixel-mart-bj.com/shop/<span className="text-primary">awa</span>
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span
          className="flex size-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: SWATCHES[0] }}
        >
          <Store className="size-5 text-white" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Awa Couture</p>
          <p className="text-xs text-muted-foreground">Thème personnalisé</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {SWATCHES.map((c, idx) => (
          <span
            key={c}
            className={cn(
              "size-6 rounded-full",
              idx === 0
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                : "opacity-60",
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================== */
/* PixelFunnel — 5 événements Meta (état rempli)                   */
/* ============================================================== */

const EVENTS = [
  { name: "PageView", pct: 100 },
  { name: "ViewContent", pct: 74 },
  { name: "AddToCart", pct: 41 },
  { name: "Checkout", pct: 28 },
  { name: "Purchase", pct: 19 },
];

export function PixelFunnel() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/20">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Événements Facebook
      </span>
      <div className="mt-4 flex flex-col gap-2.5">
        {EVENTS.map((e, idx) => (
          <div key={e.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-medium text-foreground">
              {e.name}
            </span>
            <div className="h-6 flex-1 overflow-hidden rounded-md bg-background">
              <div
                className={cn(
                  "h-full",
                  idx === EVENTS.length - 1 ? "bg-primary" : "bg-foreground/20",
                )}
                style={{ width: `${e.pct}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {e.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================== */
/* StorageScan — colis scanné (état : en stock)                    */
/* ============================================================== */

export function StorageScan() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary">
          <Package className="size-5 text-black" />
        </span>
        <div>
          <p className="font-mono text-lg font-semibold tracking-[-0.02em] text-foreground">
            PM-042
          </p>
          <p className="text-xs text-muted-foreground">Boutique Awa Couture</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Réceptionné</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-primary">
            <Check className="size-3 text-black" />
          </span>
          En stock
        </span>
      </div>
    </div>
  );
}
