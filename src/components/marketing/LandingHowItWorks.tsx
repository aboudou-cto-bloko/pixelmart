// filepath: src/components/marketing/LandingHowItWorks.tsx

import { FadeIn, Stagger, StaggerItem } from "./FadeIn";

const STEPS = [
  {
    number: "01",
    title: "Créez votre boutique",
    body: "Renseignez le nom, la description, choisissez votre pays. Votre URL dédiée est générée automatiquement. Prêt en 2 minutes.",
    detail: "3 étapes d'onboarding — slug auto-généré, logo uploadable",
  },
  {
    number: "02",
    title: "Ajoutez vos produits",
    body: "Photos (jusqu'à 10), prix, variantes (taille, couleur), gestion de stock. Produits physiques ou digitaux. Brouillon ou publié.",
    detail: "Formulaire complet avec validations — images Convex Storage",
  },
  {
    number: "03",
    title: "Vendez & encaissez",
    body: "Vos clients commandent, paient en Mobile Money ou à la livraison. Vous recevez une notification, vous préparez la commande, l'argent arrive dans votre balance.",
    detail: "Moneroo Webhook → votre balance créditée automatiquement",
  },
  {
    number: "04",
    title: "Retirez vos gains",
    body: "Demandez un virement sur votre Mobile Money (MTN, Orange) ou votre compte bancaire. Minimum 1 FCFA. Vos gains sont protégés.",
    detail: "Payout via Moneroo — 48h de délai de sécurité (F-03)",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="comment" className="py-24">
      <div className="container mx-auto px-4">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Comment ça marche
          </p>
          <h2 className="text-3xl font-black text-foreground md:text-4xl">
            De zéro à votre première vente.
          </h2>
        </FadeIn>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-[18px] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />

          <Stagger className="grid gap-8 lg:grid-cols-4">
            {STEPS.map((step) => (
              <StaggerItem key={step.number}>
                <div className="relative flex flex-col gap-4">
                  {/* Step number */}
                  <div className="relative z-10 flex size-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-black text-primary">
                    {step.number}
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-base font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground/40">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
