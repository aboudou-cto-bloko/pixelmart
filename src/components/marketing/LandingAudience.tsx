// filepath: src/components/marketing/LandingAudience.tsx
// NOUVELLE section sombre — 3 profils (style Shopify "entrepreneurs to enterprise").

import { Store, TrendingUp, Building2 } from "lucide-react";
import { Section, Container, Eyebrow, Heading, Cta } from "./LandingKit";
import { FadeIn, Stagger, StaggerItem } from "./FadeIn";

const PROFILES = [
  {
    icon: Store,
    step: "01",
    title: "Lancez-vous",
    description:
      "Commencez avec vos premiers produits. Inscription gratuite, aucun abonnement, aucun engagement.",
  },
  {
    icon: TrendingUp,
    step: "02",
    title: "Grandissez",
    description:
      "Vos commandes augmentent, votre boutique suit. Analytics, coupons et avis vérifiés inclus.",
  },
  {
    icon: Building2,
    step: "03",
    title: "Scalez",
    description:
      "Plusieurs boutiques, entrepôt dédié, un seul tableau de bord pour tout piloter.",
  },
];

export function LandingAudience() {
  return (
    <Section tone="dark" className="py-24 md:py-32">
      <Container>
        <div className="flex flex-col items-start gap-6 md:max-w-2xl">
          <FadeIn>
            <Eyebrow>Pour qui</Eyebrow>
          </FadeIn>
          <FadeIn delay={0.06}>
            <Heading size="lg">
              Pour tous. De la revendeuse au grossiste.
            </Heading>
          </FadeIn>
        </div>

        <Stagger className="mt-14 grid gap-4 md:grid-cols-3">
          {PROFILES.map((p) => {
            const Icon = p.icon;
            return (
              <StaggerItem key={p.title}>
                <div className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary">
                      <Icon className="size-5 text-black" />
                    </span>
                    <span className="font-mono text-sm font-semibold text-muted-foreground">
                      {p.step}
                    </span>
                  </div>
                  <h3 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed tracking-[-0.01em] text-muted-foreground">
                    {p.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <FadeIn delay={0.1} className="mt-12">
          <Cta href="/register">Choisir mon offre</Cta>
        </FadeIn>
      </Container>
    </Section>
  );
}
