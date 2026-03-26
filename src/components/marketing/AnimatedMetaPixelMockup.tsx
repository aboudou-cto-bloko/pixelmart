"use client";

// filepath: src/components/marketing/AnimatedMetaPixelMockup.tsx
// Reproduction fidèle de vendor/store/meta/page.tsx — configuration Facebook Pixel.
// Flux : page vide → saisie Pixel ID → événements → sauvegarde → succès → loop

import { useRef, useState, useEffect } from "react";
import { useInView, motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Eye,
  ShoppingCart,
  MousePointerClick,
  Package,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";

type Phase = "idle" | "typing" | "events" | "saving" | "saved";

const PIXEL_ID = "1234567890123456";

// Événements trackés — fidèle à META_EVENTS dans la page réelle
const EVENTS = [
  {
    icon: ShoppingBag,
    label: "PageView",
    desc: "Chaque visite de votre boutique",
    badge: "Client",
    badgeColor: "bg-muted/50 text-muted-foreground",
  },
  {
    icon: Eye,
    label: "ViewContent",
    desc: "Consultation d'une fiche produit",
    badge: "Client",
    badgeColor: "bg-muted/50 text-muted-foreground",
  },
  {
    icon: ShoppingCart,
    label: "AddToCart",
    desc: "Ajout au panier",
    badge: "Client",
    badgeColor: "bg-muted/50 text-muted-foreground",
  },
  {
    icon: MousePointerClick,
    label: "InitiateCheckout",
    desc: "Début du checkout",
    badge: "Client",
    badgeColor: "bg-muted/50 text-muted-foreground",
  },
  {
    icon: Package,
    label: "Purchase",
    desc: "Achat confirmé côté serveur",
    badge: "Serveur (CAPI)",
    badgeColor: "bg-primary/15 text-primary",
  },
] as const;

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export function AnimatedMetaPixelMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const [phase, setPhase] = useState<Phase>("idle");
  const [typedChars, setTypedChars] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState(0);
  // Effet de frappe du Pixel ID
  useEffect(() => {
    if (phase !== "typing") return;
    if (typedChars >= PIXEL_ID.length) return;
    const t = setTimeout(() => setTypedChars((c) => c + 1), 60);
    return () => clearTimeout(t);
  }, [phase, typedChars]);

  useEffect(() => {
    if (!isInView) return;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(setTimeout(() => setPhase("typing"), 600));
    // Les événements apparaissent après la frappe (~960ms + 200ms)
    t.push(setTimeout(() => setPhase("events"), 1800));
    t.push(setTimeout(() => setVisibleEvents(1), 2000));
    t.push(setTimeout(() => setVisibleEvents(2), 2300));
    t.push(setTimeout(() => setVisibleEvents(3), 2600));
    t.push(setTimeout(() => setVisibleEvents(4), 2900));
    t.push(setTimeout(() => setVisibleEvents(5), 3200));
    t.push(setTimeout(() => setPhase("saving"), 4200));
    t.push(setTimeout(() => setPhase("saved"), 5200));

    return () => t.forEach(clearTimeout);
  }, [isInView]);

  const show = (p: Phase) => {
    const order: Phase[] = ["idle", "typing", "events", "saving", "saved"];
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
          pixel-mart.com/vendor/store/meta
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm font-bold text-foreground">
            Boutique vendeur & Meta Pixel
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/50">
            Activez votre boutique et connectez vos publicités Facebook
          </p>
        </div>

        {/* ── Pixel ID Card ── */}
        <div className="rounded-xl border border-border/40 bg-background/50 p-4">
          {/* Header */}
          <div className="mb-3 flex items-center gap-2">
            {/* Facebook icon inline SVG */}
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#1877F2]/15">
              <svg viewBox="0 0 24 24" className="size-4 fill-[#1877F2]">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Configuration Meta Pixel
              </p>
              <p className="text-[10px] text-muted-foreground/50">
                Connectez votre Pixel + Conversions API
              </p>
            </div>
          </div>

          {/* Pixel ID Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground/70">
              Pixel ID (15-16 chiffres)
            </label>
            <div className="flex h-9 items-center rounded-lg border border-border/50 bg-background px-3">
              <span className="font-mono text-xs text-foreground">
                {PIXEL_ID.slice(0, typedChars)}
              </span>
              {phase === "typing" && typedChars < PIXEL_ID.length && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="ml-0.5 inline-block h-3.5 w-px bg-foreground"
                />
              )}
              {phase !== "typing" && typedChars === 0 && (
                <span className="text-xs text-muted-foreground/25">
                  1234567890123456
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Événements trackés ── */}
        <AnimatePresence>
          {show("events") && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="rounded-xl border border-border/40 bg-background/50 p-4"
            >
              <p className="mb-1 text-xs font-semibold text-foreground">
                Événements trackés
              </p>
              <p className="mb-3 text-[10px] text-muted-foreground/50">
                Envoyés automatiquement dès qu'un visiteur interagit
              </p>
              <div className="divide-y divide-border/20">
                {EVENTS.slice(0, visibleEvents).map((ev, _i) => {
                  const Icon = ev.icon;
                  return (
                    <motion.div
                      key={ev.label}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2.5 py-2"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                        <Icon className="size-3.5 text-muted-foreground/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-foreground">
                          {ev.label}
                        </p>
                        <p className="truncate text-[9px] text-muted-foreground/45">
                          {ev.desc}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-medium ${ev.badgeColor}`}
                      >
                        {ev.badge}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bouton Sauvegarder ── */}
        <AnimatePresence mode="wait">
          {show("events") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <div
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 transition-colors ${
                  phase === "saving"
                    ? "bg-primary/60"
                    : phase === "saved"
                      ? "bg-emerald-500/80"
                      : "bg-primary"
                }`}
              >
                <AnimatePresence mode="wait">
                  {phase === "saving" && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Loader2 className="size-3 animate-spin text-white" />
                      <span className="text-[10px] font-semibold text-white">
                        Sauvegarde…
                      </span>
                    </motion.div>
                  )}
                  {phase === "saved" && (
                    <motion.div
                      key="saved"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="size-3 text-white" />
                      <span className="text-[10px] font-semibold text-white">
                        Sauvegardé
                      </span>
                    </motion.div>
                  )}
                  {phase !== "saving" && phase !== "saved" && (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] font-semibold text-white"
                    >
                      Sauvegarder
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {phase === "saved" && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  className="flex items-center gap-1 rounded-xl border border-border/50 px-3"
                >
                  <ExternalLink className="size-3 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/60">
                    Voir ma boutique
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
