// filepath: src/components/marketing/LandingFeatures.tsx
// Grid de fonctionnalités secondaires — section claire, cartes nettes, titres courts.

import { Store, Tag, Star, Package, BarChart3, Users } from "lucide-react";
import { Section, Container, Eyebrow, Heading } from "./LandingKit";
import { FadeIn, Stagger, StaggerItem } from "./FadeIn";

const FEATURES = [
  {
    icon: Store,
    title: "Votre marque",
    description: "Votre URL, votre logo. Vos clients ne voient que vous.",
  },
  {
    icon: Tag,
    title: "Codes promo",
    description: "Réductions pour vos fidèles. Montant et durée au choix.",
  },
  {
    icon: Star,
    title: "Avis vérifiés",
    description: "Seuls les vrais acheteurs notent. Zéro faux avis.",
  },
  {
    icon: Package,
    title: "Tous vos produits",
    description: "Robes, sneakers, bijoux. Stock et variantes gérés.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Revenus, panier moyen, top produits. En un regard.",
  },
  {
    icon: Users,
    title: "Un compte, deux rôles",
    description: "Vendez et achetez. Une seule connexion pour tout.",
  },
];

export function LandingFeatures() {
  return (
    <Section id="fonctionnalites" tone="light" className="py-24 md:py-32">
      <Container>
        <div className="flex flex-col items-start gap-6 md:max-w-2xl">
          <FadeIn>
            <Eyebrow>Fonctionnalités</Eyebrow>
          </FadeIn>
          <FadeIn delay={0.06}>
            <Heading size="lg">
              Personnalisez tout. Sans toucher au code.
            </Heading>
          </FadeIn>
        </div>

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={f.title}>
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-white p-7 transition-colors hover:border-foreground/30">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-foreground/[0.06]">
                    <Icon className="size-5 text-primary" />
                  </span>
                  <h3 className="font-heading text-base font-semibold tracking-[-0.01em] text-foreground">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </Section>
  );
}
