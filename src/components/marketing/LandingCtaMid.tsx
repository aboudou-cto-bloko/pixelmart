// filepath: src/components/marketing/LandingCtaMid.tsx

import { FadeIn } from "./FadeIn";
import { LandingQuickCapture } from "./LandingQuickCapture";

export function LandingCtaMid() {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-[120px]" />
      </div>

      <div className="container relative mx-auto max-w-2xl px-4 text-center">
        <FadeIn>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Liste d&apos;attente
          </p>
          <h2 className="mb-4 text-3xl font-black text-foreground md:text-4xl">
            Soyez parmi les premiers.
          </h2>
          <p className="mb-10 text-base text-muted-foreground">
            Inscrivez votre email. On vous contacte dès que Pixel-Mart est prêt.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <LandingQuickCapture
            layout="inline"
            cta="Réserver ma place"
            showCount={true}
            className="items-center justify-center"
          />
        </FadeIn>
      </div>
    </section>
  );
}
