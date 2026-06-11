// filepath: src/app/(marketing)/landing/page.tsx
// Landing — refonte style Shopify. Sections alternées clair/sombre,
// titres semi-bold tracking serré, fort contraste, sans gradient.

import type { Metadata } from "next";
import { LandingNav } from "@/components/marketing/LandingNav";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingFeatureMain } from "@/components/marketing/LandingFeatureMain";
import { LandingAlternating } from "@/components/marketing/LandingAlternating";
import { LandingStorage } from "@/components/marketing/LandingStorage";
import { LandingAudience } from "@/components/marketing/LandingAudience";
import { LandingFeatures } from "@/components/marketing/LandingFeatures";
import { LandingAds } from "@/components/marketing/LandingAds";
import { LandingTrust } from "@/components/marketing/LandingTrust";
import { LandingPricing } from "@/components/marketing/LandingPricing";
import { LandingFAQ } from "@/components/marketing/LandingFAQ";
import { LandingWaitlist } from "@/components/marketing/LandingWaitlist";
import { LandingCtaFinal } from "@/components/marketing/LandingCtaFinal";
import { LandingFooter } from "@/components/marketing/LandingFooter";

export const metadata: Metadata = {
  title: "Pixel-Mart — Vendez en ligne. Encaissez en Mobile Money.",
  description:
    "La marketplace e-commerce conçue pour les commerçants béninois. Boutique dédiée, paiements MTN & Moov Money, entrepôt, suivi de commandes. Démarrez gratuitement.",
  openGraph: {
    title: "Pixel-Mart — Vendez en ligne. Encaissez en Mobile Money.",
    description:
      "La marketplace e-commerce pour le Bénin. Mobile Money, boutique dédiée, entrepôt, suivi complet.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <LandingNav />

      {/* 1. Hero — noir */}
      <LandingHero />

      {/* 2. Dashboard — clair */}
      <LandingFeatureMain />

      {/* 3. Features alternées ×5 (dark/light) — Paiements · Commandes · Livraisons · Boutique · Facebook */}
      <LandingAlternating />

      {/* 4. Entrepôt — clair · différenciateur */}
      <LandingStorage />

      {/* 5. Audience — sombre */}
      <LandingAudience />

      {/* 6. Grid fonctionnalités — clair */}
      <LandingFeatures />

      {/* 7. Publicités — sombre */}
      <LandingAds />

      {/* 8. Confiance — clair */}
      <LandingTrust />

      {/* 9. Tarifs — sombre */}
      <LandingPricing />

      {/* 10. FAQ — clair */}
      <LandingFAQ />

      {/* 11. Newsletter — sombre */}
      <LandingWaitlist />

      {/* 12. CTA final + mot impact — noir */}
      <LandingCtaFinal />

      <LandingFooter />
    </>
  );
}
