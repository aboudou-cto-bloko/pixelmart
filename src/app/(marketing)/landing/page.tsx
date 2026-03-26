// filepath: src/app/(marketing)/landing/page.tsx

import type { Metadata } from "next";
import { LandingNav } from "@/components/marketing/LandingNav";
import { LandingHero } from "@/components/marketing/LandingHero";
import { LandingFeatureMain } from "@/components/marketing/LandingFeatureMain";
import { LandingAlternating } from "@/components/marketing/LandingAlternating";
import { LandingCtaMid } from "@/components/marketing/LandingCtaMid";
import { LandingFeatures } from "@/components/marketing/LandingFeatures";
import { LandingTrust } from "@/components/marketing/LandingTrust";
import { LandingWaitlist } from "@/components/marketing/LandingWaitlist";
import { LandingFAQ } from "@/components/marketing/LandingFAQ";
import { LandingCtaFinal } from "@/components/marketing/LandingCtaFinal";
import { LandingFooter } from "@/components/marketing/LandingFooter";

export const metadata: Metadata = {
  title: "Pixel-Mart — Vendez en ligne. Encaissez en Mobile Money.",
  description:
    "La marketplace e-commerce conçue pour les commerçants béninois. Boutique en ligne, paiements MTN Money & Moov Money, suivi de commandes. Rejoignez la waitlist.",
  openGraph: {
    title: "Pixel-Mart — Vendez en ligne. Encaissez en Mobile Money.",
    description:
      "La marketplace e-commerce pour le Bénin. Paiements Mobile Money, boutique dédiée, suivi complet.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      <LandingNav />

      {/* 1. Hero — headline + CTA + placeholder dashboard */}
      <LandingHero />

      {/* 2. Feature principale asymétrique */}
      <LandingFeatureMain />

      {/* 3. Features alternées ×3 — Paiements · Commandes · Livraisons */}
      <LandingAlternating />

      {/* 4. CTA intermédiaire — 2e capture email */}
      <LandingCtaMid />

      {/* 5. Grid features secondaires */}
      <LandingFeatures />

      {/* 6. Trust / sécurité */}
      <LandingTrust />

      {/* 7. Waitlist complète — 3e capture */}
      <LandingWaitlist />

      {/* 8. FAQ */}
      <LandingFAQ />

      {/* 9. CTA final + mot impact animé */}
      <LandingCtaFinal />

      <LandingFooter />
    </>
  );
}
