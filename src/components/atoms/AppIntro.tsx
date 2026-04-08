"use client";

// filepath: src/components/atoms/AppIntro.tsx

import { useState, useEffect } from "react";
import { PixelMartLoader } from "./PixelMartLoader";
import { cn } from "@/lib/utils";

/**
 * Overlay d'intro brandé Pixel-Mart.
 * Joue une courte animation au premier chargement de la session,
 * indépendamment du temps de chargement effectif de la page.
 *
 * - S'affiche une seule fois par session (sessionStorage)
 * - Logo apparaît en 550ms (scale + fade-in)
 * - L'overlay disparaît en fondu 500ms après
 */
export function AppIntro() {
  // Lazy initializer : évalue sessionStorage côté client uniquement
  const [mounted, setMounted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem("pm_intro")) return false;
    sessionStorage.setItem("pm_intro", "1");
    return true;
  });
  const [fading, setFading] = useState(false);

  // Déclenche le fondu de sortie après que l'animation d'entrée est jouée
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => setFading(true), 750);
    return () => clearTimeout(timer);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center bg-background",
        "transition-opacity duration-500 ease-in-out",
        fading ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
      aria-hidden="true"
      onTransitionEnd={() => {
        if (fading) setMounted(false);
      }}
    >
      <div className="animate-pm-intro">
        <PixelMartLoader size={72} />
      </div>
    </div>
  );
}
