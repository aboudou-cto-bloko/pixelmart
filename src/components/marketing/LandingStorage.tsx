// filepath: src/components/marketing/LandingStorage.tsx
// NOUVELLE section — le différenciateur Pixel-Mart : l'entrepôt physique
// ("Fulfillment by Pixel-Mart"). Section claire, fort contraste, 3 stats bétons.

import {
  Section,
  Container,
  Eyebrow,
  Heading,
  Lead,
  Cta,
  Stat,
} from "./LandingKit";
import { FadeIn } from "./FadeIn";
import { StorageScan } from "./LandingMockups";

export function LandingStorage() {
  return (
    <Section id="entrepot" tone="light" className="py-24 md:py-32">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-6">
            <FadeIn>
              <Eyebrow>Entrepôt</Eyebrow>
            </FadeIn>
            <FadeIn delay={0.06}>
              <Heading size="lg">
                On garde votre stock.
                <br />
                Vous vendez.
              </Heading>
            </FadeIn>
            <FadeIn delay={0.12}>
              <Lead>
                Déposez vos produits à notre entrepôt à Cotonou. On emballe et
                on expédie à chaque commande. Moins de stock chez vous, zéro
                commande impossible à honorer.
              </Lead>
            </FadeIn>
            <FadeIn delay={0.18}>
              <Cta href="/register">Activer l&apos;entrepôt</Cta>
            </FadeIn>
          </div>

          <FadeIn
            direction="right"
            className="flex justify-center lg:justify-end"
          >
            <StorageScan />
          </FadeIn>
        </div>

        <FadeIn delay={0.1} className="mt-16 md:mt-20">
          <div className="grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
            <Stat value="PM-042" label="Chaque colis identifié et tracé" />
            <Stat value="3 modes" label="Livraison · Entrepôt · Les deux" />
            <Stat value="0" label="Commande impossible à honorer" />
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
