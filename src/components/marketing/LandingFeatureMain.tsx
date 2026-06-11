// filepath: src/components/marketing/LandingFeatureMain.tsx
// Section claire asymétrique — visuel revenu animé + texte. Tableau de bord.

import {
  Section,
  Container,
  Eyebrow,
  Heading,
  Lead,
  CheckList,
} from "./LandingKit";
import { FadeIn } from "./FadeIn";
import { RevenueCard } from "./LandingMockups";

const BULLETS = [
  "Votre URL, votre logo, votre marque — vos clients ne voient que vous.",
  "Couleurs, logo et thème personnalisés, sans développeur.",
  "Vos meilleures ventes et vos chiffres clés, d'un seul regard.",
];

export function LandingFeatureMain() {
  return (
    <Section tone="light" className="py-24 md:py-32">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <FadeIn
            direction="left"
            className="flex justify-center lg:justify-start"
          >
            <RevenueCard />
          </FadeIn>

          <div className="flex flex-col gap-6">
            <FadeIn>
              <Eyebrow>Tableau de bord</Eyebrow>
            </FadeIn>
            <FadeIn delay={0.06}>
              <Heading size="md">Tout en un seul endroit.</Heading>
            </FadeIn>
            <FadeIn delay={0.12}>
              <Lead>
                Commandes, revenus, clients — un coup d&apos;œil suffit. Fini de
                jongler entre WhatsApp, un cahier et votre téléphone.
              </Lead>
            </FadeIn>
            <FadeIn delay={0.18}>
              <CheckList items={BULLETS} />
            </FadeIn>
          </div>
        </div>
      </Container>
    </Section>
  );
}
