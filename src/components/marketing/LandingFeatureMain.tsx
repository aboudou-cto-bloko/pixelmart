// filepath: src/components/marketing/LandingFeatureMain.tsx
// Section principale asymétrique — dashboard fidèle à l'app, animé au scroll.

import { Check } from "lucide-react";
import { FadeIn, RevealText } from "./FadeIn";
import { AnimatedDashboardMockup } from "./AnimatedDashboardMockup";

const BULLETS = [
  "Vos clients ne voient que votre marque — plus jamais de confusion avec le marketplace",
  "Personnalisez les couleurs et le logo à votre identité en quelques clics",
  "Vos meilleures ventes et vos clients fidèles, visibles en un coup d'œil",
];

export function LandingFeatureMain() {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Dashboard fidèle — conteneur isolé pour que les animations internes restent contenues */}
          <div className="overflow-hidden">
            <FadeIn direction="left" duration={0.6}>
              <AnimatedDashboardMockup />
            </FadeIn>
          </div>

          {/* Texte */}
          <div className="flex flex-col gap-7">
            <div>
              <FadeIn delay={0.05}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
                  Tableau de bord vendeur
                </p>
              </FadeIn>
              <RevealText delay={0.12}>
                <h2 className="text-3xl font-black leading-tight text-foreground md:text-4xl">
                  Tout pour gérer
                  <br />
                  votre commerce.
                </h2>
              </RevealText>
            </div>
            <FadeIn delay={0.2}>
              <p className="text-base leading-relaxed text-muted-foreground">
                Un seul endroit pour voir vos commandes, vos revenus et vos
                clients. Fini de jongler entre WhatsApp, un cahier et votre
                téléphone.
              </p>
            </FadeIn>
            <FadeIn delay={0.28}>
              <ul className="flex flex-col gap-4">
                {BULLETS.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Check className="size-3 text-primary" />
                    </div>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
