"use client";

// filepath: src/components/marketing/AnimatedPaymentMockup.tsx
// Reproduction fidèle du checkout/page.tsx — PaymentModeSelector + flux Moneroo.
// Flux : résumé → mode sélectionné → Payer → overlay opérateurs → confirmé → loop

import { useRef, useState, useEffect } from "react";
import { useInView, motion, AnimatePresence } from "motion/react";
import {
  CreditCard,
  Banknote,
  Loader2,
  CheckCircle,
  ShieldCheck,
  Package,
} from "lucide-react";

type Phase =
  | "idle"
  | "summary"
  | "selecting"
  | "selected"
  | "submitting"
  | "moneroo"
  | "success";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Opérateurs Mobile Money (Moneroo)
const OPERATORS = [
  { name: "MTN Mobile Money", color: "#F8C000", textColor: "#000" },
  { name: "Moov Money", color: "#003B8E", textColor: "#fff" },
  { name: "Celtiis Cash", color: "#E30613", textColor: "#fff" },
] as const;

export function AnimatedPaymentMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedOp, setSelectedOp] = useState<number | null>(null);
  const [cycleId, setCycleId] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(
      setTimeout(() => {
        setPhase("idle");
        setSelectedOp(null);
      }, 0),
    );

    t.push(setTimeout(() => setPhase("summary"), 500));
    t.push(setTimeout(() => setPhase("selecting"), 1200));
    t.push(setTimeout(() => setPhase("selected"), 2000));
    t.push(setTimeout(() => setPhase("submitting"), 2900));
    t.push(setTimeout(() => setPhase("moneroo"), 3700));
    t.push(setTimeout(() => setSelectedOp(0), 4400));
    t.push(setTimeout(() => setPhase("success"), 5400));
    t.push(
      setTimeout(() => {
        setPhase("idle");
        setSelectedOp(null);
        setCycleId((c) => c + 1);
      }, 8000),
    );

    return () => t.forEach(clearTimeout);
  }, [cycleId, isInView]);

  const show = (p: Phase) => {
    const order: Phase[] = [
      "idle",
      "summary",
      "selecting",
      "selected",
      "submitting",
      "moneroo",
      "success",
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
          pixel-mart.com/shop/boutique-awa/checkout
        </div>
      </div>

      <div className="p-4">
        {/* Titre */}
        <p className="mb-4 text-sm font-bold text-foreground">
          Finaliser la commande
        </p>

        {/* ── Résumé commande ── */}
        <AnimatePresence>
          {show("summary") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mb-3 rounded-xl border border-border/40 bg-background/50 p-3"
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Boutique Awa
              </p>
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted/40">
                  <Package className="size-4 text-muted-foreground/40" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    Robe Wax Premium
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">
                    Taille M · Qté 1
                  </p>
                </div>
                <p className="text-xs font-bold text-foreground">18 500 XOF</p>
              </div>
              <div className="mt-3 space-y-1 border-t border-border/20 pt-2 text-[10px]">
                <div className="flex justify-between text-muted-foreground/50">
                  <span>Sous-total</span>
                  <span>18 500 XOF</span>
                </div>
                <div className="flex justify-between text-muted-foreground/50">
                  <span>Livraison</span>
                  <span>750 XOF</span>
                </div>
                <div className="flex justify-between font-bold text-foreground">
                  <span>Total</span>
                  <span>19 250 XOF</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mode de paiement ── */}
        <AnimatePresence>
          {show("selecting") && phase !== "moneroo" && phase !== "success" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mb-3 space-y-2"
            >
              <p className="text-[10px] font-semibold text-muted-foreground/50">
                Mode de paiement
              </p>

              {/* Option : Paiement en ligne */}
              <motion.div
                animate={{
                  borderColor: show("selected")
                    ? "rgb(249 115 22 / 0.5)"
                    : "rgb(55 65 81 / 0.3)",
                  backgroundColor: show("selected")
                    ? "rgb(249 115 22 / 0.05)"
                    : "transparent",
                }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <CreditCard className="size-4 shrink-0 text-primary/70" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    Paiement en ligne
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">
                    Payez maintenant par Mobile Money
                  </p>
                </div>
                <div className="flex size-4 items-center justify-center rounded-full border-2 border-primary/60">
                  <AnimatePresence>
                    {show("selected") && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="size-2 rounded-full bg-primary"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Option : COD */}
              <div className="flex items-center gap-3 rounded-lg border border-border/30 p-3 opacity-40">
                <Banknote className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    Paiement à la livraison
                  </p>
                  <p className="text-[10px] text-muted-foreground/50">
                    Payez en espèces au livreur
                  </p>
                </div>
                <div className="size-4 rounded-full border-2 border-muted/40" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bouton Payer ── */}
        <AnimatePresence mode="wait">
          {phase === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3"
            >
              <Loader2 className="size-3.5 animate-spin text-primary-foreground" />
              <span className="text-xs font-semibold text-primary-foreground">
                Connexion sécurisée…
              </span>
            </motion.div>
          )}

          {show("selected") &&
            phase !== "submitting" &&
            phase !== "moneroo" &&
            phase !== "success" && (
              <motion.div
                key="pay-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3"
              >
                <CreditCard className="size-3.5 text-primary-foreground" />
                <span className="text-xs font-semibold text-primary-foreground">
                  Payer 19 250 XOF
                </span>
              </motion.div>
            )}
        </AnimatePresence>

        {/* ── Overlay Moneroo — sélection opérateur ── */}
        <AnimatePresence>
          {phase === "moneroo" || phase === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="rounded-xl border border-border/50 bg-background p-4"
            >
              <p className="mb-1 text-center text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                Choisissez votre opérateur
              </p>
              <p className="mb-4 text-center text-[10px] text-muted-foreground/35">
                Via Moneroo · Paiement sécurisé
              </p>

              <div className="space-y-2">
                {OPERATORS.map((op, i) => (
                  <motion.div
                    key={op.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className={`flex items-center gap-3 rounded-lg border p-2.5 transition-all ${
                      selectedOp === i
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/30"
                    }`}
                  >
                    <div
                      className="size-6 shrink-0 rounded"
                      style={{ backgroundColor: op.color }}
                    />
                    <span className="flex-1 text-xs font-medium text-foreground">
                      {op.name}
                    </span>
                    <div className="flex size-4 items-center justify-center rounded-full border-2 border-muted/40">
                      <AnimatePresence>
                        {selectedOp === i && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="size-2 rounded-full bg-primary"
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Succès */}
              <AnimatePresence>
                {phase === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/8 p-4"
                  >
                    <CheckCircle className="size-6 text-green-400" />
                    <p className="text-xs font-bold text-green-400">
                      Paiement confirmé
                    </p>
                    <p className="text-[10px] text-muted-foreground/50">
                      Commande #PM-2852 créée
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Trust badge */}
        {show("selected") && phase !== "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="size-3 text-muted-foreground/30" />
            <span className="text-[9px] text-muted-foreground/30">
              Paiement chiffré · Moneroo
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
