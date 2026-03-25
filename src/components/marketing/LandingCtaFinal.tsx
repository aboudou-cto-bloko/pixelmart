"use client";

// filepath: src/components/marketing/LandingCtaFinal.tsx
// CTA pré-footer + mot impact animé qui alterne entre 3 mots (motion AnimatePresence).

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FadeIn } from "./FadeIn";

const WORDS = ["VENDEZ.", "GRANDISSEZ.", "ENCAISSEZ."];
const INTERVAL_MS = 2200;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function AnimatedWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={{ height: "clamp(4.2rem, 19vw, 17rem)" }}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={WORDS[index]}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="absolute inset-x-0 select-none text-center font-heading font-black uppercase leading-none tracking-tighter text-foreground/[0.07]"
          style={{ fontSize: "clamp(4rem, 18vw, 16rem)" }}
        >
          {WORDS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function LandingCtaFinal() {
  return (
    <>
      {/* Pre-footer CTA */}
      <section className="py-32">
        <div className="container mx-auto max-w-xl px-4 text-center">
          <FadeIn>
            <h2 className="mb-3 text-2xl font-black text-foreground md:text-3xl">
              Prêt à lancer votre boutique ?
            </h2>
            <p className="mb-8 text-base text-muted-foreground">
              Rejoignez la liste d&apos;attente. On vous prévient dès le
              lancement.
            </p>
            <Button size="lg" asChild className="gap-2">
              <a href="#waitlist">
                Rejoindre la liste d&apos;attente
                <ArrowRight className="size-4" />
              </a>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Impact word animé */}
      <div className="overflow-hidden">
        <Separator className="opacity-10" />
        <div className="py-8">
          <AnimatedWord />
        </div>
        <Separator className="opacity-10" />
      </div>
    </>
  );
}
