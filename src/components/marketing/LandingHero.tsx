// filepath: src/components/marketing/LandingHero.tsx

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "./FadeIn";
import { AnimatedDashboardMockup } from "./AnimatedDashboardMockup";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-36">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        {/* Badge — pt-36 garantit qu'il est bien sous la nav fixe (h-14 = 56px) */}
        <FadeIn delay={0} once>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary">
              Disponible maintenant — Créez votre boutique
            </span>
          </div>
        </FadeIn>

        {/* Headline — FadeIn simple (pas RevealText) car déjà dans le viewport au montage */}
        <div className="flex flex-col items-center gap-0">
          <FadeIn delay={0.08} direction="up" once>
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-foreground md:text-7xl">
              Ajoutez vos produits
            </h1>
          </FadeIn>
          <FadeIn delay={0.16} direction="up" once>
            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-muted-foreground/35 md:text-7xl">
              On s&apos;occupe du reste.
            </h1>
          </FadeIn>
        </div>

        {/* Sous-titre */}
        <FadeIn delay={0.28} once>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
            La boutique e-commerce pensée pour les commerçants béninois.
            Paiements mobiles, suivi de commandes, boutique dédiée — tout en un.
          </p>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={0.36} once>
          <Button size="lg" asChild className="gap-2">
            <Link href="/register">
              Créer ma boutique
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </FadeIn>

        {/* Dashboard fidèle — reproduction exacte de l'app, animée */}
        <FadeIn delay={0.44} once className="w-full">
          <AnimatedDashboardMockup />
        </FadeIn>
      </div>
    </section>
  );
}
