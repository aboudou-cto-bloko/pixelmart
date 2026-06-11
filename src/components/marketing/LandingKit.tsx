// filepath: src/components/marketing/LandingKit.tsx
// Primitives partagées de la landing — refonte style Shopify.
// Règles : sections alternées clair/sombre, AUCUN gradient, fort contraste,
// titres en semi-bold (600) + tracking serré pour un rendu premium et compact.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Section — porte sa propre tonalité (dark = classe `.dark` → tokens) */
/* ------------------------------------------------------------------ */

type Tone = "dark" | "ink" | "light" | "paper";

const TONE_CLASS: Record<Tone, string> = {
  // Thème explicite par section — indépendant du thème global next-themes
  dark: "landing-dark bg-[#0A0A0A] text-foreground",
  ink: "landing-dark bg-black text-foreground",
  light: "landing-light bg-[#F4F3EF] text-foreground",
  paper: "landing-light bg-white text-foreground",
};

export function Section({
  tone = "dark",
  id,
  className,
  children,
}: {
  tone?: Tone;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("relative w-full", TONE_CLASS[tone], className)}
    >
      {children}
    </section>
  );
}

/** Conteneur centré standard. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 md:px-8", className)}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Eyebrow — tag de section, 1 mot, semi-bold, tracking maîtrisé        */
/* ------------------------------------------------------------------ */

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-heading text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-primary",
        className,
      )}
    >
      <span className="h-px w-5 bg-primary" aria-hidden />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Heading — semi-bold + tracking serré. Plus c'est grand, plus serré.  */
/* ------------------------------------------------------------------ */

type HeadingSize = "sm" | "md" | "lg" | "xl";

const HEADING_SIZE: Record<HeadingSize, string> = {
  sm: "text-2xl md:text-3xl tracking-[-0.02em] leading-[1.1]",
  md: "text-3xl md:text-[2.75rem] tracking-[-0.025em] leading-[1.05]",
  lg: "text-4xl md:text-6xl tracking-[-0.03em] leading-[1.02]",
  xl: "text-5xl md:text-7xl tracking-[-0.035em] leading-[0.98]",
};

export function Heading({
  as: Tag = "h2",
  size = "md",
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3";
  size?: HeadingSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={cn(
        "font-heading font-semibold text-balance",
        HEADING_SIZE[size],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Paragraphe de support — couleur atténuée, lecture confortable. */
export function Lead({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-base leading-relaxed tracking-[-0.01em] text-muted-foreground md:text-lg",
        className,
      )}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* CTA — fort contraste. Orange plein + texte noir (AAA sur orange).    */
/* ------------------------------------------------------------------ */

type CtaVariant = "solid" | "outline" | "invert";

const CTA_BASE =
  "group inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold tracking-[-0.01em] transition-colors";

const CTA_VARIANT: Record<CtaVariant, string> = {
  // Orange de marque, texte noir — l'accent le plus fort de la page
  solid: "bg-primary text-black hover:bg-primary/90",
  // Bordure nette sur la tonalité courante
  outline:
    "border border-foreground/25 text-foreground hover:border-foreground/60 hover:bg-foreground/[0.04]",
  // Inverse total : surface = couleur de texte courante
  invert: "bg-foreground text-background hover:bg-foreground/90",
};

export function Cta({
  href,
  variant = "solid",
  withArrow = true,
  className,
  children,
}: {
  href: string;
  variant?: CtaVariant;
  withArrow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(CTA_BASE, CTA_VARIANT[variant], className)}>
      {children}
      {withArrow && (
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Stat — gros chiffre béton + label court (style Shopify capital)      */
/* ------------------------------------------------------------------ */

export function Stat({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-heading text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
        {value}
      </span>
      <span className="text-sm tracking-[-0.01em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Checklist — puces courtes, marqueur carré orange (pas de cercle doux)*/
/* ------------------------------------------------------------------ */

export function CheckList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-3.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            className="mt-[0.45rem] size-1.5 shrink-0 bg-primary"
            aria-hidden
          />
          <span className="text-sm leading-relaxed tracking-[-0.01em] text-muted-foreground">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
