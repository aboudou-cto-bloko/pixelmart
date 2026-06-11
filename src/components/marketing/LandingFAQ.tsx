"use client";

// filepath: src/components/marketing/LandingFAQ.tsx
// FAQ — section claire, réponses courtes (< 2 phrases), accordéon net.

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, Container, Eyebrow, Heading } from "./LandingKit";
import { FadeIn } from "./FadeIn";

const FAQS = [
  {
    q: "Quels modes de paiement pour mes clients ?",
    a: "MTN Money, Moov Money, Celtiis Cash — et le cash à la livraison. Aucune carte bancaire requise.",
  },
  {
    q: "Comment je reçois mes gains ?",
    a: "Votre balance est créditée après chaque paiement confirmé. Vous retirez sur votre Mobile Money, sous 48h.",
  },
  {
    q: "Puis-je avoir ma propre boutique en ligne ?",
    a: "Oui. Une URL dédiée /shop/votre-boutique, avec votre logo et vos couleurs. Zéro logo Pixel-Mart visible.",
  },
  {
    q: "Quelle commission prenez-vous ?",
    a: "5% sur les ventes en offre Free. Réduit à 3% (Pro) et 2% (Business). Calculée et déduite automatiquement.",
  },
  {
    q: "Y a-t-il des frais cachés ou un engagement ?",
    a: "Aucun. Inscription gratuite, sans engagement. Vous ne payez qu'une commission sur les ventes réelles.",
  },
];

export function LandingFAQ() {
  return (
    <Section id="faq" tone="light" className="py-24 md:py-32">
      <Container className="max-w-3xl">
        <div className="flex flex-col gap-6">
          <FadeIn>
            <Eyebrow>FAQ</Eyebrow>
          </FadeIn>
          <FadeIn delay={0.06}>
            <Heading size="md">Questions fréquentes.</Heading>
          </FadeIn>
        </div>

        <FadeIn delay={0.12} className="mt-10">
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border bg-white px-5 data-[state=open]:border-foreground/30"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold tracking-[-0.01em] text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </Container>
    </Section>
  );
}
