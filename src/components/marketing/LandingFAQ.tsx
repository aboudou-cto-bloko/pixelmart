"use client";

// filepath: src/components/marketing/LandingFAQ.tsx

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeIn } from "./FadeIn";

const FAQS = [
  {
    q: "Quels modes de paiement sont acceptés par mes clients ?",
    a: "MTN Mobile Money, Moov Money, Celtiis Cash — et le paiement à la livraison (cash on delivery). Pas de carte bancaire requise. Tous ces moyens transitent via Moneroo, une passerelle certifiée PCI-DSS. Les opérateurs disponibles peuvent évoluer sans modification de votre boutique. Le paiement par carte (Stripe) est prévu dans une version ultérieure.",
  },
  {
    q: "Comment je reçois mes gains ?",
    a: "Votre balance est créditée automatiquement après chaque paiement confirmé (webhook Moneroo). Vous pouvez ensuite demander un virement sur votre Mobile Money (MTN, Orange) ou votre compte bancaire. Un délai de 48h est appliqué à titre de sécurité, puis le virement est initié via Moneroo.",
  },
  {
    q: "Puis-je avoir ma propre boutique en ligne, séparée du marketplace ?",
    a: "Oui. Pixel-Mart vous donne une URL dédiée du type /shop/votre-boutique — sans aucun logo Pixel-Mart visible. Vous pouvez choisir vos couleurs, uploader votre logo et personnaliser l'apparence. Cette boutique est liée à votre compte vendeur.",
  },
  {
    q: "Puis-je vendre des produits numériques (ebooks, formations, etc.) ?",
    a: "Oui. Lors de la création d'un produit, vous pouvez le marquer comme « produit digital ». Pas de gestion de stock, pas de livraison physique. Le fichier est associé au produit.",
  },
  {
    q: "Quelle commission Pixel-Mart prélève-t-elle ?",
    a: "En offre Free, la commission est de 5% sur chaque vente (500 points de base). Les offres Pro et Business réduiront cette commission. La commission est calculée automatiquement et déduite de votre net à encaisser.",
  },
  {
    q: "Y a-t-il une période d'engagement ou des frais cachés ?",
    a: "Non. L'inscription est gratuite, sans engagement. Vous ne payez qu'une commission sur les ventes réelles. Pas d'abonnement obligatoire pour démarrer.",
  },
];

export function LandingFAQ() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-2xl px-4">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2 className="text-3xl font-black text-foreground md:text-4xl">
            Questions fréquentes.
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Accordion type="single" collapsible className="flex flex-col gap-2">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border/40 bg-card/50 px-5 data-[state=open]:border-border data-[state=open]:bg-card"
              >
                <AccordionTrigger className="py-4 text-left text-sm font-semibold text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}
