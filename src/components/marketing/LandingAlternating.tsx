// filepath: src/components/marketing/LandingAlternating.tsx
// Sections alternées fidèles à l'app — mockups interactifs + nouvelles sections.

import { Check } from "lucide-react";
import { FadeIn, RevealText } from "./FadeIn";
import { AnimatedPaymentMockup } from "./AnimatedPaymentMockup";
import { AnimatedOrderMockup } from "./AnimatedOrderMockup";
import { AnimatedDeliveryMockup } from "./AnimatedDeliveryMockup";
import { AnimatedMetaPixelMockup } from "./AnimatedMetaPixelMockup";
import { AnimatedMarketplaceMockup } from "./AnimatedMarketplaceMockup";
import type { ReactNode } from "react";

interface FeatureSection {
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
  reverse: boolean;
}

const FEATURES: FeatureSection[] = [
  {
    tag: "Paiements",
    title: "Encaissez comme\nvos clients paient.",
    description:
      "Vos clients paient avec leur téléphone — MTN, Moov, Celtiis ou en espèces à la livraison. Pas de carte bancaire, pas de friction. L'argent arrive sur votre balance dès confirmation.",
    bullets: [
      "Vos clients n'ont pas besoin d'avoir une carte bancaire",
      "Le paiement à la livraison disponible pour ceux qui préfèrent le cash",
      "Chaque nouveau opérateur disponible sans action de votre part",
    ],
    visual: <AnimatedPaymentMockup />,
    reverse: false,
  },
  {
    tag: "Commandes",
    title: "Chaque commande,\nsuivie de A à Z.",
    description:
      "Finies les commandes perdues dans WhatsApp. Chaque vente a sa propre fiche : qui a commandé, ce qu'il a pris, où ça en est. Votre client aussi est informé à chaque étape — sans que vous ayez à le contacter manuellement.",
    bullets: [
      "Plus jamais de commande oubliée ou égarée dans les messages",
      "Votre client sait exactement où est son colis à chaque instant",
      "L'historique complet de vos ventes accessible en quelques secondes",
    ],
    visual: <AnimatedOrderMockup />,
    reverse: true,
  },
  {
    tag: "Livraisons",
    title: "Gérez vos livraisons\nsans prise de tête.",
    description:
      "Regroupez plusieurs commandes dans un seul trajet. Les frais sont calculés automatiquement selon la distance réelle. Vos clients voient le coût avant de commander.",
    bullets: [
      "Plusieurs commandes dans un seul trajet pour gagner du temps",
      "Les frais de livraison calculés et affichés automatiquement",
      "Vos clients connaissent le prix de la livraison avant de payer",
    ],
    visual: <AnimatedDeliveryMockup />,
    reverse: false,
  },
  {
    tag: "Marketplace hybride",
    title: "Votre boutique ET\nla marketplace.",
    description:
      "Pixel-Mart est à la fois votre boutique personnelle ET une marketplace où vos produits apparaissent pour de nouveaux clients. Vous bénéficiez de la visibilité du catalogue commun sans sacrifier votre identité.",
    bullets: [
      "URL dédiée /shop/votre-boutique — votre marque, votre expérience",
      "Vos produits visibles dans le catalogue Pixel-Mart pour attirer de nouveaux acheteurs",
      "Le meilleur des deux mondes : boutique indépendante + visibilité marketplace",
    ],
    visual: <AnimatedMarketplaceMockup />,
    reverse: true,
  },
  {
    tag: "Facebook Ads",
    title: "Vendez depuis vos\npubs Facebook.",
    description:
      "Ajoutez votre Pixel ID et tous vos événements Facebook Ads sont configurés automatiquement — AddToCart, Purchase via l'API Conversions côté serveur. Pas de code, pas de développeur.",
    bullets: [
      "5 événements pré-configurés : PageView, ViewContent, AddToCart, Checkout, Purchase",
      "Purchase envoyé via l'API Conversions (côté serveur) pour un tracking fiable même sans cookies",
      "Vos visiteurs Facebook atterrissent directement sur votre boutique dédiée",
    ],
    visual: <AnimatedMetaPixelMockup />,
    reverse: false,
  },
];

export function LandingAlternating() {
  return (
    <div className="flex flex-col">
      {FEATURES.map((f) => (
        <section key={f.tag} className="relative py-32 odd:bg-card/15">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute top-1/2 -translate-y-1/2 size-[500px] rounded-full bg-primary/4 blur-[130px]"
              style={{ [f.reverse ? "right" : "left"]: "-15%" }}
            />
          </div>

          <div className="container relative mx-auto px-4">
            <div
              className={`grid items-center gap-16 lg:grid-cols-2 lg:gap-24 ${f.reverse ? "lg:grid-flow-dense" : ""}`}
            >
              {/* Mockup */}
              <FadeIn
                direction={f.reverse ? "right" : "left"}
                className={f.reverse ? "lg:col-start-2" : ""}
                duration={0.6}
              >
                {f.visual}
              </FadeIn>

              {/* Texte */}
              <div className="flex flex-col gap-7">
                <div>
                  <FadeIn delay={0.05} direction="up">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">
                      {f.tag}
                    </p>
                  </FadeIn>
                  <RevealText delay={0.1}>
                    <h2 className="whitespace-pre-line text-3xl font-black leading-tight text-foreground md:text-4xl">
                      {f.title}
                    </h2>
                  </RevealText>
                </div>
                <FadeIn delay={0.18} direction="up">
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </FadeIn>
                <FadeIn delay={0.26} direction="up">
                  <ul className="flex flex-col gap-4">
                    {f.bullets.map((b) => (
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
      ))}
    </div>
  );
}
