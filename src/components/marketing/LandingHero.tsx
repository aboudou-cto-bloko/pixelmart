// filepath: src/components/marketing/LandingHero.tsx
// Hero full-bleed — photo (commerçante béninoise) + overlay noir UNI (pas de
// gradient). Gros titre semi-bold tracking serré, mot rotatif, CTA orange.

import { Section, Container, Cta } from "./LandingKit";
import { FadeIn } from "./FadeIn";
import { BrandSwap } from "./LandingMockups";

const ROTATING = ["grand vendeur.", "commerçant connecté.", "succès béninois."];

export function LandingHero() {
  return (
    <Section tone="ink" className="relative overflow-hidden">
      {/* Photo de fond + overlay sombre uniforme (légèrement adouci sur les bords
          par un voile plein, jamais un dégradé) */}
      <div aria-hidden className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/landing/hero-shop.jpg)" }}
        />
        <div className="absolute inset-0 bg-black/85" />
      </div>

      <Container className="relative z-10 flex min-h-screen flex-col items-center justify-center py-28 text-center">
        <FadeIn once>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-4 py-1.5 text-xs font-medium tracking-[-0.01em] text-white">
            <span className="size-1.5 rounded-full bg-primary" />
            Disponible maintenant au Bénin
          </span>
        </FadeIn>

        <FadeIn delay={0.08} once className="mt-7">
          <h1 className="max-w-4xl font-heading text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-white md:text-7xl">
            Devenez le prochain
            <br />
            <BrandSwap words={ROTATING} />
          </h1>
        </FadeIn>

        <FadeIn delay={0.18} once className="mt-6">
          <p className="max-w-xl text-lg leading-relaxed tracking-[-0.01em] text-white/80">
            Vendez partout où vos clients achètent. Mobile Money, Facebook,
            livraison à domicile — votre commerce en ligne, tout en un.
          </p>
        </FadeIn>

        <FadeIn delay={0.26} once className="mt-9">
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Cta href="/register">Démarrer gratuitement</Cta>
            <Cta
              href="#fonctionnalites"
              variant="outline"
              withArrow={false}
              className="border-white/30 text-white hover:border-white/70 hover:bg-white/[0.06]"
            >
              Voir les fonctionnalités
            </Cta>
          </div>
        </FadeIn>

        <FadeIn delay={0.34} once className="mt-6">
          <p className="text-sm tracking-[-0.01em] text-white/65">
            Sans carte bancaire · Sans engagement · 0 FCFA pour démarrer
          </p>
        </FadeIn>
      </Container>
    </Section>
  );
}
