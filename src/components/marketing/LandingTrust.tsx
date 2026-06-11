// filepath: src/components/marketing/LandingTrust.tsx
// Section claire — ton offensif (pas défensif). 4 garanties, formulation courte.

import { ShieldCheck, RefreshCw, MapPin, Wallet } from "lucide-react";
import { Section, Container, Eyebrow, Heading, Lead } from "./LandingKit";
import { FadeIn, Stagger, StaggerItem } from "./FadeIn";

const POINTS = [
  {
    icon: ShieldCheck,
    title: "Zéro fraude. Zéro risque.",
    description:
      "Chaque transaction est sécurisée de bout en bout. Vos clients paient en confiance, vous recevez votre argent sans intermédiaire douteux.",
  },
  {
    icon: RefreshCw,
    title: "Stock synchronisé. Temps réel.",
    description:
      "Dès qu'une commande passe, votre stock s'ajuste. Plus de survente, plus de commande impossible à honorer.",
  },
  {
    icon: MapPin,
    title: "Calibré pour Cotonou. Pas adapté.",
    description:
      "Opérateurs, prix de livraison, habitudes d'achat — tout est pensé pour le Bénin, pas dérivé d'un produit générique.",
  },
  {
    icon: Wallet,
    title: "Votre argent. Sur demande.",
    description:
      "Votre balance est créditée après chaque vente confirmée. Vous retirez quand vous voulez, direct sur votre Mobile Money.",
  },
];

export function LandingTrust() {
  return (
    <Section tone="light" className="py-24 md:py-32">
      <Container>
        <div className="flex max-w-2xl flex-col gap-6">
          <FadeIn>
            <Eyebrow>Confiance</Eyebrow>
          </FadeIn>
          <FadeIn delay={0.06}>
            <Heading size="lg">Stable. Rapide. Sécurisé.</Heading>
          </FadeIn>
          <FadeIn delay={0.12}>
            <Lead>
              Votre boutique tourne. Même lors de votre meilleure vente.
            </Lead>
          </FadeIn>
        </div>

        <Stagger className="mt-14 grid gap-4 md:grid-cols-2">
          {POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <StaggerItem key={p.title}>
                <div className="flex h-full gap-4 rounded-2xl border border-border bg-white p-7">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.06]">
                    <Icon className="size-5 text-primary" />
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading text-base font-semibold tracking-[-0.01em] text-foreground">
                      {p.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </Section>
  );
}
