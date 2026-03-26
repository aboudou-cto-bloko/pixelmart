// filepath: src/components/ads/AdSpaceMap.tsx

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────

interface AdSlotInfo {
  id: string;
  name: string;
  color: string;
  description: string;
}

const SLOTS: AdSlotInfo[] = [
  {
    id: "top_banner",
    name: "Bandeau Promo Haut",
    color: "bg-orange-400",
    description: "Bande pleine largeur en haut de page",
  },
  {
    id: "hero_main",
    name: "Héro Principal",
    color: "bg-blue-500",
    description: "Carrousel principal, zone la plus visible",
  },
  {
    id: "hero_side",
    name: "Héro Latéral",
    color: "bg-purple-500",
    description: "Panneau droite du carrousel héro",
  },
  {
    id: "hero_sub",
    name: "Sous-Héro",
    color: "bg-emerald-500",
    description: "4 cartes sous la zone héro",
  },
  {
    id: "deals_featured",
    name: "Produit Sponsorisé",
    color: "bg-rose-500",
    description: "Cartes dans la section Offres du jour",
  },
  {
    id: "mid_banner",
    name: "Bannière Milieu",
    color: "bg-amber-500",
    description: "Bannière pleine largeur au centre de page",
  },
  {
    id: "brands_row",
    name: "Marques Populaires",
    color: "bg-cyan-500",
    description: "Logos dans la rangée marques",
  },
  {
    id: "product_spotlight",
    name: "Spotlight Produit",
    color: "bg-indigo-500",
    description: "Section mise en avant pleine largeur en bas",
  },
];

const slotMap = Object.fromEntries(SLOTS.map((s) => [s.id, s]));

// ─── Component ───────────────────────────────────────────────

interface AdSpaceMapProps {
  /** Highlight a specific slot (from the booking dialog) */
  highlightedSlotId?: string | null;
  onSlotClick?: (slotId: string) => void;
}

export function AdSpaceMap({
  highlightedSlotId,
  onSlotClick,
}: AdSpaceMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const active = hovered ?? highlightedSlotId;

  function slotClass(id: string, extra = "") {
    const slot = slotMap[id];
    const isActive = active === id;
    return cn(
      "rounded transition-all duration-150 cursor-pointer border-2",
      slot.color,
      isActive
        ? "opacity-100 border-white shadow-lg scale-[1.02]"
        : "opacity-60 border-transparent hover:opacity-90 hover:border-white/50",
      extra,
    );
  }

  function handleSlot(id: string) {
    setHovered(id);
    onSlotClick?.(id);
  }

  return (
    <div className="space-y-4">
      {/* Diagram */}
      <div className="rounded-xl border bg-muted/30 p-4 select-none">
        {/* Browser chrome mockup */}
        <div className="rounded-t-lg bg-muted border border-b-0 px-3 py-1.5 flex items-center gap-1.5 mb-0">
          <div className="size-2.5 rounded-full bg-red-400/70" />
          <div className="size-2.5 rounded-full bg-yellow-400/70" />
          <div className="size-2.5 rounded-full bg-green-400/70" />
          <div className="flex-1 mx-2 rounded bg-background/60 h-4 text-[9px] text-muted-foreground flex items-center px-2">
            pixel-mart.com
          </div>
        </div>

        <div
          className="rounded-b-lg border overflow-hidden bg-background"
          style={{ fontFamily: "system-ui" }}
        >
          {/* Navbar */}
          <div className="h-6 bg-background border-b flex items-center px-2 gap-1">
            <div className="w-10 h-2 rounded bg-muted-foreground/20" />
            <div className="flex-1" />
            <div className="w-8 h-2 rounded bg-muted-foreground/20" />
            <div className="w-8 h-2 rounded bg-muted-foreground/20" />
          </div>

          {/* top_banner */}
          <div
            className={slotClass("top_banner", "h-3 mx-1 mt-1")}
            onMouseEnter={() => setHovered("top_banner")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleSlot("top_banner")}
            title="Bandeau Promo Haut"
          />

          {/* Hero zone */}
          <div className="flex gap-1 px-1 mt-1">
            {/* hero_main */}
            <div
              className={slotClass(
                "hero_main",
                "flex-[3] h-24 flex items-center justify-center",
              )}
              onMouseEnter={() => setHovered("hero_main")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSlot("hero_main")}
              title="Héro Principal (Carrousel)"
            >
              <span className="text-[8px] text-white font-medium leading-tight text-center px-1">
                Héro
                <br />
                Principal
              </span>
            </div>
            {/* hero_side */}
            <div
              className={slotClass(
                "hero_side",
                "flex-1 h-24 flex items-center justify-center",
              )}
              onMouseEnter={() => setHovered("hero_side")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSlot("hero_side")}
              title="Héro Latéral (Droite)"
            >
              <span className="text-[8px] text-white font-medium text-center px-0.5">
                Latéral
              </span>
            </div>
          </div>

          {/* hero_sub */}
          <div className="px-1 mt-1">
            <div
              className={slotClass(
                "hero_sub",
                "h-10 flex items-center justify-center",
              )}
              onMouseEnter={() => setHovered("hero_sub")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSlot("hero_sub")}
              title="Sous-Héro (4 cartes)"
            >
              <div className="flex gap-0.5 px-1 w-full">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex-1 h-6 rounded bg-white/20" />
                ))}
              </div>
            </div>
          </div>

          {/* deals_featured */}
          <div className="px-1 mt-1">
            <p className="text-[7px] text-muted-foreground mb-0.5 ml-0.5">
              Offres du jour
            </p>
            <div
              className={slotClass(
                "deals_featured",
                "h-14 flex items-center justify-center",
              )}
              onMouseEnter={() => setHovered("deals_featured")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSlot("deals_featured")}
              title="Produit Sponsorisé (Offres)"
            >
              <div className="flex gap-0.5 px-1 w-full">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-1 h-10 rounded bg-white/20" />
                ))}
              </div>
            </div>
          </div>

          {/* mid_banner */}
          <div className="px-1 mt-1">
            <div
              className={slotClass(
                "mid_banner",
                "h-6 flex items-center justify-center",
              )}
              onMouseEnter={() => setHovered("mid_banner")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSlot("mid_banner")}
              title="Bannière Milieu Pleine Largeur"
            >
              <span className="text-[8px] text-white font-medium">
                Bannière Milieu
              </span>
            </div>
          </div>

          {/* brands_row */}
          <div className="px-1 mt-1">
            <p className="text-[7px] text-muted-foreground mb-0.5 ml-0.5">
              Marques
            </p>
            <div
              className={slotClass("brands_row", "h-8 flex items-center")}
              onMouseEnter={() => setHovered("brands_row")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSlot("brands_row")}
              title="Marques Populaires"
            >
              <div className="flex gap-0.5 px-1 w-full">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex-1 h-5 rounded bg-white/20" />
                ))}
              </div>
            </div>
          </div>

          {/* product_spotlight */}
          <div className="px-1 mt-1 mb-1">
            <div
              className={slotClass(
                "product_spotlight",
                "h-10 flex items-center justify-center",
              )}
              onMouseEnter={() => setHovered("product_spotlight")}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSlot("product_spotlight")}
              title="Spotlight Produit (Pleine Largeur)"
            >
              <span className="text-[8px] text-white font-medium">
                Spotlight Produit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {SLOTS.map((slot) => (
          <button
            key={slot.id}
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors border",
              active === slot.id
                ? "border-foreground/30 bg-muted"
                : "border-transparent hover:bg-muted/50",
            )}
            onMouseEnter={() => setHovered(slot.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleSlot(slot.id)}
          >
            <span className={cn("size-2.5 shrink-0 rounded-sm", slot.color)} />
            <span className="truncate font-medium">{slot.name}</span>
          </button>
        ))}
      </div>

      {/* Tooltip for active slot */}
      {active && slotMap[active] && (
        <div className="rounded-md bg-muted px-3 py-2 text-sm flex items-center gap-2">
          <span
            className={cn("size-3 rounded-sm shrink-0", slotMap[active].color)}
          />
          <div>
            <span className="font-medium">{slotMap[active].name}</span>
            <span className="text-muted-foreground ml-2">
              {slotMap[active].description}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
