// filepath: src/components/marketing/LandingAlternating.tsx
// 5 features alternées — tonalité ET côté alternés (contraste fort, sans gradient).
// Chaque feature isole un visuel animé intentionnel.

import type { ReactNode } from "react";
import {
  Section,
  Container,
  Eyebrow,
  Heading,
  Lead,
  CheckList,
} from "./LandingKit";
import { FadeIn } from "./FadeIn";
import {
  PaymentConfirm,
  OrderFlow,
  DeliveryBatch,
  ShopUrlCard,
  PixelFunnel,
} from "./LandingMockups";

type Tone = "dark" | "light";

interface Feature {
  id: string;
  tone: Tone;
  reverse: boolean;
  eyebrow: string;
  title: ReactNode;
  lead: string;
  bullets: string[];
  visual: ReactNode;
}

const FEATURES: Feature[] = [
  {
    id: "paiements",
    tone: "dark",
    reverse: false,
    eyebrow: "Encaissement",
    title: (
      <>
        L&apos;argent entre.
        <br />
        Sans friction.
      </>
    ),
    lead: "MTN, Moov, Celtiis, ou cash à la livraison. Pas de carte bancaire. L'argent arrive sur votre balance dès la confirmation du paiement.",
    bullets: [
      "Pas de carte bancaire — MTN, Moov ou Celtiis suffit.",
      "Cash à la livraison inclus, pour ceux qui préfèrent.",
      "Nouveaux opérateurs disponibles automatiquement.",
    ],
    visual: <PaymentConfirm />,
  },
  {
    id: "commandes",
    tone: "light",
    reverse: true,
    eyebrow: "Commandes",
    title: (
      <>
        Zéro commande perdue.
        <br />
        Jamais.
      </>
    ),
    lead: "Chaque vente a sa fiche : qui a commandé, quoi, où ça en est. Votre client est informé à chaque étape — sans que vous leviez le petit doigt.",
    bullets: [
      "Fini les commandes noyées dans WhatsApp.",
      "Suivi client automatique, à chaque étape.",
      "Tout votre historique, en quelques secondes.",
    ],
    visual: <OrderFlow />,
  },
  {
    id: "livraisons",
    tone: "dark",
    reverse: false,
    eyebrow: "Livraisons",
    title: (
      <>
        Plusieurs commandes.
        <br />
        Un seul trajet.
      </>
    ),
    lead: "Regroupez vos livraisons. Les frais se calculent à la distance réelle. Vos clients voient le prix avant de commander.",
    bullets: [
      "Un trajet, plusieurs livraisons, moins de temps perdu.",
      "Frais calculés automatiquement selon la distance.",
      "Prix de livraison affiché avant le paiement.",
    ],
    visual: <DeliveryBatch />,
  },
  {
    id: "boutique",
    tone: "light",
    reverse: true,
    eyebrow: "Boutique dédiée",
    title: (
      <>
        Votre boutique.
        <br />
        Plus nos acheteurs.
      </>
    ),
    lead: "Une URL à votre nom, votre logo, vos couleurs. Et la visibilité du catalogue Pixel-Mart pour attirer de nouveaux clients.",
    bullets: [
      "pixel-mart-bj.com/shop/vous — zéro logo Pixel-Mart.",
      "5 thèmes, couleur primaire au choix, aperçu en direct.",
      "Vos produits aussi visibles dans le catalogue commun.",
    ],
    visual: <ShopUrlCard />,
  },
  {
    id: "facebook",
    tone: "dark",
    reverse: false,
    eyebrow: "Facebook",
    title: (
      <>
        Vendez depuis
        <br />
        vos pubs Facebook.
      </>
    ),
    lead: "Ajoutez votre Pixel ID. Les 5 événements se configurent seuls — dont Purchase via l'API Conversions, côté serveur. Pas de code, pas de développeur.",
    bullets: [
      "5 événements auto : de PageView jusqu'à Purchase.",
      "API Conversions côté serveur — fiable même sans cookies.",
      "Vos visiteurs Facebook arrivent direct sur votre boutique.",
    ],
    visual: <PixelFunnel />,
  },
];

export function LandingAlternating() {
  return (
    <>
      {FEATURES.map((f) => (
        <Section key={f.id} id={f.id} tone={f.tone} className="py-24 md:py-32">
          <Container>
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              {/* Visuel */}
              <FadeIn
                direction={f.reverse ? "right" : "left"}
                className={`flex justify-center ${f.reverse ? "lg:order-2 lg:justify-end" : "lg:justify-start"}`}
              >
                {f.visual}
              </FadeIn>

              {/* Texte */}
              <div
                className={`flex flex-col gap-6 ${f.reverse ? "lg:order-1" : ""}`}
              >
                <FadeIn>
                  <Eyebrow>{f.eyebrow}</Eyebrow>
                </FadeIn>
                <FadeIn delay={0.06}>
                  <Heading size="md">{f.title}</Heading>
                </FadeIn>
                <FadeIn delay={0.12}>
                  <Lead>{f.lead}</Lead>
                </FadeIn>
                <FadeIn delay={0.18}>
                  <CheckList items={f.bullets} />
                </FadeIn>
              </div>
            </div>
          </Container>
        </Section>
      ))}
    </>
  );
}
