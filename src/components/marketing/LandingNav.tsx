"use client";

// filepath: src/components/marketing/LandingNav.tsx
// Nav fixe — fond sombre net (pas de gradient), liens centraux, CTA orange.

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#entrepot", label: "Entrepôt" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "landing-dark fixed inset-x-0 top-0 z-50 text-foreground transition-colors",
        scrolled
          ? "border-b border-border bg-[#0A0A0A]/90 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <Link
          href="/landing"
          className="flex items-center"
          aria-label="Pixel-Mart"
        >
          {/* PNG recadré (canvas carré à grosse marge transparente) — mêmes
              réglages que le footer pour une taille identique. */}
          <span
            role="img"
            aria-label="Pixel-Mart"
            className="block h-10 w-40 bg-no-repeat"
            style={{
              backgroundImage: "url(/Pixel-Mart-1.png)",
              backgroundSize: "auto 300%",
              backgroundPosition: "left center",
            }}
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium tracking-[-0.01em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold tracking-[-0.01em] text-black transition-colors hover:bg-primary/90"
          >
            Démarrer gratuitement
          </Link>
        </div>
      </div>
    </header>
  );
}
