// filepath: src/components/marketing/LandingAds.tsx
// NOUVELLE section sombre — espaces publicitaires sur la marketplace.
// Visuel : wireframe de homepage avec les 4 emplacements mis en avant (orange).

import { Section, Container, Eyebrow, Heading, Lead, Cta } from "./LandingKit";
import { FadeIn } from "./FadeIn";

const PLACEMENTS = [
  "Hero principal",
  "Bannière milieu",
  "Card produit",
  "Spotlight premium",
];

/** Mini wireframe de storefront — zones publicitaires en orange plein. */
function AdWireframe() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/20">
      {/* barre nav */}
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-muted" />
        <span className="h-2 w-16 rounded-full bg-muted" />
        <span className="ml-auto h-2 w-10 rounded-full bg-muted" />
      </div>

      {/* Hero principal — slot pub */}
      <div className="mt-3 flex h-20 items-center justify-center rounded-lg bg-primary">
        <span className="text-xs font-semibold text-black">Hero principal</span>
      </div>

      {/* Grille produits — un slot pub */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="h-16 rounded-lg bg-background" />
        <div className="flex h-16 items-center justify-center rounded-lg bg-primary px-1 text-center">
          <span className="text-[0.6rem] font-semibold leading-tight text-black">
            Card produit
          </span>
        </div>
        <div className="h-16 rounded-lg bg-background" />
      </div>

      {/* Bannière milieu — slot pub */}
      <div className="mt-3 flex h-12 items-center justify-center rounded-lg border border-primary bg-primary/15">
        <span className="text-xs font-semibold text-primary">
          Bannière milieu
        </span>
      </div>

      {/* Spotlight */}
      <div className="mt-3 flex h-14 items-center gap-3 rounded-lg bg-background px-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-[0.6rem] font-bold text-black">
          ★
        </span>
        <div className="flex flex-col gap-1">
          <span className="h-2 w-20 rounded-full bg-muted" />
          <span className="h-2 w-12 rounded-full bg-muted" />
        </div>
        <span className="ml-auto text-[0.6rem] font-semibold text-primary">
          Spotlight
        </span>
      </div>
    </div>
  );
}

export function LandingAds() {
  return (
    <Section tone="dark" className="py-24 md:py-32">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="flex flex-col gap-6">
            <FadeIn>
              <Eyebrow>Publicités</Eyebrow>
            </FadeIn>
            <FadeIn delay={0.06}>
              <Heading size="lg">
                Vos produits.
                <br />
                En tête de liste.
              </Heading>
            </FadeIn>
            <FadeIn delay={0.12}>
              <Lead>
                Réservez un espace publicitaire sur la homepage Pixel-Mart. Des
                milliers d&apos;acheteurs. Le vôtre en premier.
              </Lead>
            </FadeIn>
            <FadeIn delay={0.18}>
              <div className="flex flex-wrap gap-2">
                {PLACEMENTS.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.24}>
              <Cta href="/register">Réserver un espace</Cta>
            </FadeIn>
          </div>

          <FadeIn
            direction="right"
            className="flex justify-center lg:justify-end"
          >
            <AdWireframe />
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
