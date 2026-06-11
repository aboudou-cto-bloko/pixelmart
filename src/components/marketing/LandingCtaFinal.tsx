"use client";

// filepath: src/components/marketing/LandingCtaFinal.tsx
// CTA de clôture — fond noir, 3 étapes numérotées, mot impact animé.

import { useState, useEffect } from "react";
import { Section, Container, Heading, Cta } from "./LandingKit";
import { FadeIn } from "./FadeIn";

const STEPS = [
  { n: "01", label: "Ajoutez votre premier produit" },
  { n: "02", label: "Personnalisez votre boutique" },
  { n: "03", label: "Encaissez en Mobile Money" },
];

const WORDS = ["VENDEZ.", "GRANDISSEZ.", "ENCAISSEZ."];

// Mot impact rotatif — setInterval + keyframe CSS (pm-rise). Pas d'eval, CSP-safe.
function ImpactWord() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: "clamp(3.5rem, 16vw, 14rem)" }}
    >
      <p
        key={WORDS[index]}
        className="absolute inset-x-0 select-none text-center font-heading font-semibold uppercase leading-none tracking-[-0.05em] text-foreground/[0.08]"
        style={{
          fontSize: "clamp(3.5rem, 15vw, 14rem)",
          animation: "pm-rise 0.5s ease both",
        }}
      >
        {WORDS[index]}
      </p>
    </div>
  );
}

export function LandingCtaFinal() {
  return (
    <Section tone="ink" className="pt-24 md:pt-32">
      <Container className="text-center">
        <FadeIn className="flex flex-col items-center gap-7">
          <Heading size="lg">Lancez vite sur Pixel-Mart.</Heading>

          <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-5 py-7"
              >
                <span className="font-heading text-2xl font-semibold tracking-[-0.03em] text-primary">
                  {s.n}
                </span>
                <span className="text-sm font-medium tracking-[-0.01em] text-foreground">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <Cta href="/register">Démarrer gratuitement</Cta>
        </FadeIn>
      </Container>

      <div className="mt-16 border-t border-border pt-6">
        <ImpactWord />
      </div>
    </Section>
  );
}
