"use client";

// filepath: src/components/marketing/FadeIn.tsx
// Animations d'entrée — CSS pur + IntersectionObserver. AUCUN eval, AUCUNE
// dépendance à une lib d'animation → compatible avec la CSP stricte en prod
// (script-src sans 'unsafe-eval'). Le contenu se révèle au scroll.

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/** Observe l'élément et passe `shown` à true une fois visible (une seule fois). */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fallback navigateur sans IntersectionObserver : on révèle au prochain frame
    // (différé → pas de setState synchrone dans l'effet).
    if (typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    // L'IntersectionObserver déclenche son callback dès l'observation pour un
    // élément déjà visible (ex. hero above-the-fold) → révélation quasi immédiate.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, shown };
}

const HIDDEN_DIR: Record<string, string> = {
  up: "translate-y-5",
  down: "-translate-y-5",
  left: "translate-x-5",
  right: "-translate-x-5",
  none: "",
};

const TRANSITION =
  "transition-[opacity,transform] duration-700 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** délai en secondes (compat avec l'ancienne API) */
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  once?: boolean;
  duration?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: FadeInProps) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        TRANSITION,
        shown
          ? "translate-x-0 translate-y-0 opacity-100"
          : cn("opacity-0", HIDDEN_DIR[direction]),
        className,
      )}
      style={{
        transitionDelay: shown ? `${Math.round(delay * 1000)}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** délai entre items, en ms */
  staggerDelay?: number;
  once?: boolean;
}

/** Applique un délai incrémental à chaque StaggerItem enfant. */
export function Stagger({
  children,
  className,
  staggerDelay = 80,
}: StaggerProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) =>
        isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ delay?: number }>, {
              delay: i * staggerDelay,
            })
          : child,
      )}
    </div>
  );
}

/** Item de Stagger — `delay` en ms, injecté par <Stagger>. */
export function StaggerItem({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        TRANSITION,
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

/** Reveal "rideau" — le contenu monte depuis le bas via overflow-hidden. */
export function RevealText({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <div
        className={cn(
          "transition-transform duration-700 ease-out motion-reduce:transition-none",
          shown ? "translate-y-0" : "translate-y-full",
        )}
        style={{
          transitionDelay: shown ? `${Math.round(delay * 1000)}ms` : "0ms",
        }}
      >
        {children}
      </div>
    </div>
  );
}
