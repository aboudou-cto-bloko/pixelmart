// filepath: src/components/marketing/LandingPricing.tsx
// NOUVELLE section sombre — tarifs transparents. Commission par palier, 0 frais cachés.
// Source des chiffres : docs/PLATFORM_GUIDE.md (commission Free 5% / Pro 3% / Business 2%).

import { Check } from "lucide-react";
import { Section, Container, Eyebrow, Heading, Lead, Cta } from "./LandingKit";
import { FadeIn, Stagger, StaggerItem } from "./FadeIn";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    name: "Free",
    rate: "5%",
    tagline: "Pour démarrer sans rien payer.",
    perks: ["Boutique dédiée", "Paiements Mobile Money", "Suivi de commandes"],
    featured: false,
  },
  {
    name: "Pro",
    rate: "3%",
    tagline: "Pour les boutiques qui décollent.",
    perks: ["Tout l'offre Free", "Commission réduite", "Analytics avancés"],
    featured: true,
  },
  {
    name: "Business",
    rate: "2%",
    tagline: "Pour les gros volumes.",
    perks: ["Tout l'offre Pro", "Commission minimale", "Multi-boutiques"],
    featured: false,
  },
];

export function LandingPricing() {
  return (
    <Section id="tarifs" tone="dark" className="py-24 md:py-32">
      <Container>
        <div className="flex max-w-2xl flex-col gap-6">
          <FadeIn>
            <Eyebrow>Tarifs</Eyebrow>
          </FadeIn>
          <FadeIn delay={0.06}>
            <Heading size="lg">Simple. Sans frais cachés.</Heading>
          </FadeIn>
          <FadeIn delay={0.12}>
            <Lead>
              Inscription gratuite. Vous ne payez qu&apos;une commission sur les
              ventes réelles — rien d&apos;autre.
            </Lead>
          </FadeIn>
        </div>

        <Stagger className="mt-14 grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <StaggerItem key={t.name}>
              <div
                className={cn(
                  "flex h-full flex-col gap-6 rounded-2xl border p-7",
                  t.featured
                    ? "border-primary bg-primary/[0.06]"
                    : "border-border bg-card",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-lg font-semibold tracking-[-0.01em] text-foreground">
                    {t.name}
                  </span>
                  {t.featured && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-[0.65rem] font-semibold text-black">
                      Populaire
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-5xl font-semibold tracking-[-0.04em] text-foreground">
                    {t.rate}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    par vente
                  </span>
                </div>

                <p className="text-sm tracking-[-0.01em] text-muted-foreground">
                  {t.tagline}
                </p>

                <ul className="flex flex-1 flex-col gap-2.5">
                  {t.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-center gap-2.5 text-sm text-foreground"
                    >
                      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Check className="size-2.5 text-black" />
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>

                <Cta
                  href="/register"
                  variant={t.featured ? "solid" : "outline"}
                  className="w-full"
                >
                  Démarrer
                </Cta>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <FadeIn delay={0.1} className="mt-8">
          <p className="text-center text-sm tracking-[-0.01em] text-muted-foreground">
            0 FCFA d&apos;inscription · Sans engagement · Retrait dès 655 FCFA
          </p>
        </FadeIn>
      </Container>
    </Section>
  );
}
