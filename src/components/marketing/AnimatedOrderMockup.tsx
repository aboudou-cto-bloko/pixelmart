"use client";

// filepath: src/components/marketing/AnimatedOrderMockup.tsx
// Reproduction fidèle de OrderTimeline / OrderDetailPanel (vendor/orders/[id]/page.tsx)
// Flux : header → items → timeline étape par étape → badge statut mis à jour → loop

import { useRef, useState, useEffect } from "react";
import { useInView, motion, AnimatePresence } from "motion/react";
import {
  Clock,
  CreditCard,
  Package,
  Truck,
  CheckCircle,
  Bell,
} from "lucide-react";

type Step = {
  icon: React.ElementType;
  label: string;
  description: string;
  time: string;
  dot: string; // bg color for dot
  icon_color: string;
  badge: { label: string; color: string; bg: string };
};

const STEPS: Step[] = [
  {
    icon: Clock,
    label: "Commandé",
    description: "Nouvelle commande passée",
    time: "13:22",
    dot: "bg-yellow-500",
    icon_color: "text-yellow-500",
    badge: {
      label: "En attente",
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  },
  {
    icon: CreditCard,
    label: "Paiement reçu",
    description: "Paiement MTN Mobile Money confirmé",
    time: "13:24",
    dot: "bg-blue-500",
    icon_color: "text-blue-500",
    badge: { label: "Payée", color: "text-blue-500", bg: "bg-blue-500/10" },
  },
  {
    icon: Package,
    label: "En préparation",
    description: "Vous avez confirmé la commande",
    time: "14:01",
    dot: "bg-indigo-500",
    icon_color: "text-indigo-500",
    badge: {
      label: "En préparation",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
  },
  {
    icon: Truck,
    label: "Expédiée",
    description: "Lot de livraison #L-042 créé",
    time: "16:30",
    dot: "bg-purple-500",
    icon_color: "text-purple-500",
    badge: {
      label: "Expédiée",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  },
  {
    icon: CheckCircle,
    label: "Livrée",
    description: "Commande remise au client",
    time: "18:45",
    dot: "bg-emerald-500",
    icon_color: "text-emerald-500",
    badge: {
      label: "Livrée",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  },
];

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function AnimatedOrderMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  useEffect(() => {
    if (!isInView) return;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setVisibleSteps(1), 600));
    t.push(setTimeout(() => setVisibleSteps(2), 1400));
    t.push(setTimeout(() => setVisibleSteps(3), 2200));
    t.push(
      setTimeout(() => {
        setVisibleSteps(4);
        setShowNotif(true);
      }, 3200),
    );
    t.push(
      setTimeout(() => {
        setVisibleSteps(5);
        setShowNotif(false);
      }, 4400),
    );

    return () => t.forEach(clearTimeout);
  }, [isInView]);

  const currentStep = STEPS[Math.max(0, visibleSteps - 1)];

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
          pixel-mart.com/vendor/orders/PM-2847
        </div>
      </div>

      <div className="p-4">
        {/* Header commande */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-sm font-bold text-foreground">
              #PM-2847
            </p>
            <p className="text-[10px] text-muted-foreground/50">
              3 articles · 8 500 XOF
            </p>
          </div>

          {/* Badge statut — change avec chaque étape */}
          <AnimatePresence mode="wait">
            {visibleSteps > 0 && (
              <motion.div
                key={currentStep.badge.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${currentStep.badge.color} ${currentStep.badge.bg} border-current/20`}
              >
                {currentStep.badge.label}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Articles */}
        <div className="mb-4 rounded-xl border border-border/30 bg-background/40 p-3">
          <p className="mb-2 text-[10px] font-semibold text-muted-foreground/50">
            Articles (3)
          </p>
          {[
            {
              name: "Robe Wax Premium",
              qty: 1,
              price: "6 500 XOF",
              size: "Taille M",
            },
            { name: "Sac à main", qty: 1, price: "2 000 XOF", size: "Noir" },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-2 py-1">
              <div className="size-8 shrink-0 rounded-md bg-muted/40" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-[10px] font-medium text-foreground">
                  {item.name}
                </p>
                <p className="text-[9px] text-muted-foreground/40">
                  {item.size} · ×{item.qty}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-foreground">
                {item.price}
              </span>
            </div>
          ))}
        </div>

        {/* Notification "client notifié" */}
        <AnimatePresence>
          {showNotif && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="mb-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/8 px-3 py-2"
            >
              <Bell className="size-3 text-primary" />
              <span className="text-[10px] font-medium text-primary">
                Client notifié par SMS
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline — Historique */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
            Historique
          </p>
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isVisible = i < visibleSteps;
              const isLast = i === STEPS.length - 1;
              const isCurrent = i === visibleSteps - 1;

              return (
                <div key={step.label} className="flex gap-3">
                  {/* Dot + line */}
                  <div className="flex flex-col items-center">
                    <AnimatePresence>
                      {isVisible ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, ease: EASE }}
                          className={`relative mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${step.dot}/15`}
                        >
                          <Icon className={`size-3 ${step.icon_color}`} />
                          {isCurrent && (
                            <motion.div
                              className={`absolute inset-0 rounded-full ${step.dot}/20`}
                              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                              transition={{ repeat: Infinity, duration: 1.4 }}
                            />
                          )}
                        </motion.div>
                      ) : (
                        <div className="mt-0.5 size-6 shrink-0 rounded-full bg-muted/20" />
                      )}
                    </AnimatePresence>
                    {!isLast && (
                      <motion.div
                        className="my-0.5 w-px"
                        style={{ height: 24 }}
                        animate={{
                          backgroundColor: isVisible
                            ? "rgb(55 65 81 / 0.3)"
                            : "rgb(55 65 81 / 0.1)",
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <motion.div
                    className="pb-3 pt-0.5"
                    animate={{ opacity: isVisible ? 1 : 0.2 }}
                    transition={{ duration: 0.4 }}
                  >
                    <p className="text-xs font-medium text-foreground">
                      {step.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50">
                      {step.description}
                    </p>
                    {isVisible && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[9px] text-muted-foreground/35"
                      >
                        {step.time} · Aujourd&apos;hui
                      </motion.p>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
