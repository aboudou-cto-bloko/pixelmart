"use client";

// filepath: src/components/marketing/AnimatedMarketplaceMockup.tsx
// Mockup : modèle hybride marketplace — boutique dédiée + catalogue commun.
// Flux : vue marketplace → produit surligné → clic → boutique vendeur → loop

import { useRef, useState, useEffect } from "react";
import { useInView, motion, AnimatePresence } from "motion/react";
import {
  Store,
  ShoppingBag,
  Star,
  Package,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

type Phase = "idle" | "marketplace" | "highlight" | "store" | "done";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Produits visibles dans le catalogue marketplace
const MARKETPLACE_PRODUCTS = [
  {
    title: "Robe Wax Premium",
    store: "Boutique Awa",
    price: "18 500",
    rating: 4.8,
    reviews: 23,
    color: "bg-orange-500/20",
  },
  {
    title: "Sneakers Canvas",
    store: "Fashion Cotonou",
    price: "12 000",
    rating: 4.5,
    reviews: 11,
    color: "bg-blue-500/20",
  },
  {
    title: "Sac en cuir",
    store: "Boutique Awa",
    price: "22 500",
    rating: 4.9,
    reviews: 34,
    color: "bg-amber-500/20",
  },
  {
    title: "Bracelet perles",
    store: "Artisan Bénin",
    price: "5 500",
    rating: 4.6,
    reviews: 8,
    color: "bg-green-500/20",
  },
  {
    title: "Chemise batik",
    store: "Boutique Awa",
    price: "9 000",
    rating: 4.7,
    reviews: 17,
    color: "bg-purple-500/20",
  },
  {
    title: "Parfum oud",
    store: "Luxe Dakar",
    price: "35 000",
    rating: 4.9,
    reviews: 42,
    color: "bg-rose-500/20",
  },
] as const;

// Boutique dédiée — vue /shop/boutique-awa
const STORE_PRODUCTS = [
  { title: "Robe Wax Premium", price: "18 500", stock: "En stock" },
  { title: "Sac en cuir", price: "22 500", stock: "En stock" },
  { title: "Chemise batik", price: "9 000", stock: "3 restants" },
] as const;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-2 ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted/30"}`}
        />
      ))}
    </div>
  );
}

export function AnimatedMarketplaceMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  const [phase, setPhase] = useState<Phase>("idle");
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [visibleProducts, setVisibleProducts] = useState(0);
  const [visibleStoreProducts, setVisibleStoreProducts] = useState(0);
  const [cycleId, setCycleId] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const t: ReturnType<typeof setTimeout>[] = [];

    t.push(
      setTimeout(() => {
        setPhase("idle");
        setHighlighted(null);
        setVisibleProducts(0);
        setVisibleStoreProducts(0);
      }, 0),
    );

    // Phase marketplace — produits apparaissent
    t.push(setTimeout(() => setPhase("marketplace"), 400));
    t.push(setTimeout(() => setVisibleProducts(2), 600));
    t.push(setTimeout(() => setVisibleProducts(4), 900));
    t.push(setTimeout(() => setVisibleProducts(6), 1200));

    // Highlight des produits "Boutique Awa"
    t.push(
      setTimeout(() => {
        setPhase("highlight");
        setHighlighted(0);
      }, 2000),
    );
    t.push(setTimeout(() => setHighlighted(2), 2400));
    t.push(setTimeout(() => setHighlighted(4), 2800));

    // Transition vers boutique dédiée
    t.push(
      setTimeout(() => {
        setPhase("store");
        setVisibleStoreProducts(0);
      }, 3800),
    );
    t.push(setTimeout(() => setVisibleStoreProducts(1), 4100));
    t.push(setTimeout(() => setVisibleStoreProducts(2), 4500));
    t.push(setTimeout(() => setVisibleStoreProducts(3), 4900));
    t.push(setTimeout(() => setPhase("done"), 5400));

    // Loop
    t.push(
      setTimeout(() => {
        setPhase("idle");
        setHighlighted(null);
        setVisibleProducts(0);
        setVisibleStoreProducts(0);
        setCycleId((c) => c + 1);
      }, 9000),
    );

    return () => t.forEach(clearTimeout);
  }, [cycleId, isInView]);

  const showMarketplace = phase === "marketplace" || phase === "highlight";
  const showStore = phase === "store" || phase === "done";

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
        <AnimatePresence mode="wait">
          <motion.div
            key={showStore ? "store" : "marketplace"}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.3 }}
            className="flex-1 rounded-md bg-muted/20 px-3 py-0.5 text-center text-[10px] text-muted-foreground/30"
          >
            {showStore ? "pixel-mart.com/shop/boutique-awa" : "pixel-mart.com"}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Vue Marketplace ── */}
      <AnimatePresence mode="wait">
        {showMarketplace && (
          <motion.div
            key="marketplace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="p-4"
          >
            {/* Header marketplace */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Pixel-Mart</p>
                <p className="text-[10px] text-muted-foreground/50">
                  Marketplace · Bénin
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-border/30 px-2 py-1">
                <ShoppingBag className="size-3 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/50">
                  Parcourir
                </span>
              </div>
            </div>

            {/* Légende highlight */}
            <AnimatePresence>
              {phase === "highlight" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/8 px-2.5 py-1.5"
                >
                  <Store className="size-3 text-primary" />
                  <span className="text-[10px] font-medium text-primary">
                    Les produits Boutique Awa sont mis en avant
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grille produits */}
            <div className="grid grid-cols-3 gap-2">
              {MARKETPLACE_PRODUCTS.slice(0, visibleProducts).map((p, _i) => {
                const isAwa = p.store === "Boutique Awa";
                const isHighlighted = highlighted !== null && isAwa;

                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      outline: isHighlighted
                        ? "1.5px solid rgb(249 115 22 / 0.5)"
                        : "1.5px solid transparent",
                    }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden rounded-xl border border-border/30 bg-background/50"
                  >
                    {/* Thumbnail */}
                    <div
                      className={`flex aspect-square items-center justify-center ${p.color}`}
                    >
                      <Package className="size-5 text-muted-foreground/30" />
                    </div>
                    <div className="p-1.5">
                      <p className="truncate text-[9px] font-semibold text-foreground">
                        {p.title}
                      </p>
                      <p className="truncate text-[8px] text-muted-foreground/45">
                        {p.store}
                      </p>
                      <div className="mt-0.5 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-foreground">
                          {p.price}
                        </span>
                        <Stars rating={p.rating} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Arrow vers boutique */}
            {phase === "highlight" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2"
              >
                <Store className="size-3 text-primary" />
                <span className="text-[10px] font-semibold text-primary">
                  Voir la boutique complète
                </span>
                <ArrowRight className="size-3 text-primary" />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Vue Boutique dédiée ── */}
        {showStore && (
          <motion.div
            key="store"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="p-4"
          >
            {/* Header boutique */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                <Store className="size-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-foreground">
                    Boutique Awa
                  </p>
                  <div className="flex items-center gap-0.5 rounded-full bg-yellow-500/10 px-1.5 py-0.5">
                    <Star className="size-2.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-[9px] font-semibold text-yellow-500">
                      4.8
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/50">
                  pixel-mart.com/shop/boutique-awa
                </p>
              </div>
              <ExternalLink className="size-3.5 text-muted-foreground/30" />
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-1">
              {["Produits", "Avis", "À propos"].map((tab, i) => (
                <div
                  key={tab}
                  className={`rounded-full px-3 py-1 text-[10px] font-medium ${
                    i === 0
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Produits de la boutique */}
            <div className="space-y-2">
              {STORE_PRODUCTS.slice(0, visibleStoreProducts).map((p) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex items-center gap-3 rounded-xl border border-border/30 bg-background/50 p-3"
                >
                  <div className="size-12 shrink-0 rounded-lg bg-muted/30" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {p.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/45">
                      {p.stock}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">
                      {p.price}
                    </p>
                    <p className="text-[9px] text-muted-foreground/35">XOF</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA panier */}
            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5"
              >
                <ShoppingBag className="size-3.5 text-primary-foreground" />
                <span className="text-[10px] font-semibold text-primary-foreground">
                  Ajouter au panier
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
