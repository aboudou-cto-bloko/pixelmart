"use client";

// filepath: src/components/marketing/AnimatedDeliveryMockup.tsx
// Reproduction fidèle de vendor/delivery/page.tsx — ReadyOrderCard + batch creation.
// Flux : stats → cartes commandes → sélection → créer lot → lot confirmé → loop

import { useRef, useState, useEffect } from "react";
import { useInView, motion, AnimatePresence } from "motion/react";
import {
  Package,
  Truck,
  Send,
  CheckCircle2,
  MapPin,
  User,
  CreditCard,
  Banknote,
} from "lucide-react";

type Phase = "idle" | "stats" | "orders" | "selecting" | "creating" | "done";

const ORDERS = [
  {
    num: "#PM-2851",
    name: "Koffi Mensah",
    address: "Haie Vive, Cotonou",
    zone: "Zone A",
    items: 2,
    amount: "12 000 XOF",
    fee: "750 XOF",
    type: "urgent",
    payment: "online",
  },
  {
    num: "#PM-2849",
    name: "Awa Kante",
    address: "Cadjehoun, Cotonou",
    zone: "Zone A",
    items: 1,
    amount: "18 500 XOF",
    fee: "1 100 XOF",
    type: "standard",
    payment: "online",
  },
  {
    num: "#PM-2847",
    name: "Segun Adeyemi",
    address: "Akpakpa, Cotonou",
    zone: "Zone B",
    items: 3,
    amount: "8 500 XOF",
    fee: "1 650 XOF",
    type: "fragile",
    payment: "cod",
  },
] as const;

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  standard: { label: "Standard", color: "bg-muted/60 text-muted-foreground" },
  urgent: { label: "Urgente", color: "bg-orange-500/80 text-white" },
  fragile: { label: "Fragile", color: "bg-amber-500/80 text-white" },
};

const PAY_BADGE: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  online: {
    label: "En ligne",
    icon: CreditCard,
    color: "bg-green-500/80 text-white",
  },
  cod: {
    label: "Livraison",
    icon: Banknote,
    color: "bg-blue-500/80 text-white",
  },
};

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function AnimatedDeliveryMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const [phase, setPhase] = useState<Phase>("idle");
  const [visibleOrders, setVisibleOrders] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!isInView) return;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setPhase("stats"), 400));
    t.push(setTimeout(() => setPhase("orders"), 900));
    t.push(setTimeout(() => setVisibleOrders(1), 1100));
    t.push(setTimeout(() => setVisibleOrders(2), 1600));
    t.push(setTimeout(() => setVisibleOrders(3), 2100));
    t.push(
      setTimeout(() => {
        setPhase("selecting");
        setSelected(new Set([0]));
      }, 2900),
    );
    t.push(setTimeout(() => setSelected(new Set([0, 1])), 3500));
    t.push(setTimeout(() => setPhase("creating"), 4300));
    t.push(setTimeout(() => setPhase("done"), 5400));

    return () => t.forEach(clearTimeout);
  }, [isInView]);

  const show = (p: Phase) => {
    const order: Phase[] = [
      "idle",
      "stats",
      "orders",
      "selecting",
      "creating",
      "done",
    ];
    return order.indexOf(phase) >= order.indexOf(p);
  };

  return (
    <div
      ref={ref}
      className="w-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-xl shadow-black/40"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border/40 bg-card/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="size-2 rounded-full bg-muted/60" />
          ))}
        </div>
        <div className="flex-1 rounded-md bg-muted/20 px-3 py-0.5 text-center text-[10px] text-muted-foreground/30">
          pixel-mart.com/vendor/delivery
        </div>
      </div>

      <div className="p-4">
        <p className="mb-4 text-sm font-bold text-foreground">Livraisons</p>

        {/* ── Stats ── */}
        <AnimatePresence>
          {show("stats") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mb-4 grid grid-cols-4 gap-2"
            >
              {[
                {
                  icon: Package,
                  label: "Prêtes",
                  value: "3",
                  sub: "à expédier",
                },
                { icon: Truck, label: "En attente", value: "0", sub: "lots" },
                { icon: Send, label: "Transmis", value: "2", sub: "en cours" },
                {
                  icon: CheckCircle2,
                  label: "Livrés",
                  value: "14",
                  sub: "lots",
                },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                    className="rounded-xl border border-border/40 bg-background/50 p-2 text-center"
                  >
                    <Icon className="mx-auto mb-1 size-3.5 text-muted-foreground/50" />
                    <p className="text-sm font-bold text-foreground">
                      {s.value}
                    </p>
                    <p className="text-[9px] text-muted-foreground/40">
                      {s.sub}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action bar sélection ── */}
        <AnimatePresence>
          {phase === "selecting" || phase === "creating" ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="mb-3 flex items-center justify-between rounded-xl border border-primary/25 bg-primary/8 px-3 py-2"
            >
              <div>
                <p className="text-[10px] font-semibold text-primary">
                  {selected.size} commande{selected.size > 1 ? "s" : ""}{" "}
                  sélectionnée{selected.size > 1 ? "s" : ""}
                </p>
                <p className="text-[9px] text-muted-foreground/50">
                  Zone A · Cotonou
                </p>
              </div>
              <motion.div
                animate={{ opacity: phase === "creating" ? 0.6 : 1 }}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5"
              >
                {phase === "creating" ? (
                  <span className="text-[10px] font-semibold text-primary-foreground">
                    Création…
                  </span>
                ) : (
                  <>
                    <Truck className="size-3 text-primary-foreground" />
                    <span className="text-[10px] font-semibold text-primary-foreground">
                      Créer le lot
                    </span>
                  </>
                )}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── Lot créé ── */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-400">
                      Lot #L-043 créé
                    </p>
                    <p className="text-[10px] text-muted-foreground/50">
                      2 commandes · Zone A
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                  En attente
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ReadyOrderCards ── */}
        <div className="space-y-2" style={{ minHeight: 180 }}>
          <AnimatePresence>
            {show("orders") &&
              ORDERS.slice(0, visibleOrders).map((order, i) => {
                const isSelected = selected.has(i);
                const typeBadge = TYPE_BADGE[order.type];
                const payBadge = PAY_BADGE[order.payment];
                const PayIcon = payBadge.icon;

                return (
                  <motion.div
                    key={order.num}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className={`rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/40 bg-background/30"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Checkbox */}
                      <div
                        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border/50"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <CheckCircle2 className="size-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-foreground">
                            {order.num}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${typeBadge.color}`}
                          >
                            {typeBadge.label}
                          </span>
                          <span
                            className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-medium ${payBadge.color}`}
                          >
                            <PayIcon className="size-2" />
                            {payBadge.label}
                          </span>
                        </div>
                        {/* Client */}
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/50">
                          <User className="size-3" />
                          {order.name}
                        </div>
                        {/* Adresse */}
                        <div className="flex items-start gap-1 text-[10px] text-muted-foreground/50">
                          <MapPin className="mt-0.5 size-3 shrink-0" />
                          <span>
                            {order.address} ·{" "}
                            <span className="font-medium text-foreground/60">
                              {order.zone}
                            </span>
                          </span>
                        </div>
                        {/* Footer */}
                        <div className="mt-2 flex items-center justify-between border-t border-border/20 pt-1.5">
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground/40">
                            <Package className="size-2.5" />
                            {order.items} article{order.items > 1 ? "s" : ""}
                          </div>
                          <div className="text-right text-[10px]">
                            <span className="font-semibold text-foreground">
                              {order.amount}
                            </span>
                            <span className="ml-1 text-primary/60">
                              +{order.fee}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
