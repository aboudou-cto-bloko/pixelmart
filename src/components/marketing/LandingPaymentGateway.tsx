"use client";

// filepath: src/components/marketing/LandingPaymentGateway.tsx
//
// Logos inline SVG aux couleurs officielles des opérateurs.
// À remplacer par de vraies images quand les assets seront disponibles :
//   public/logos/mtn-momo.svg   → depuis mtn.bj/wp-content/themes/mtn-vivid-wp/public/img/mtn-logo-footer.svg
//   public/logos/moov-money.svg → depuis moov-africa.bj (à télécharger)
//   public/logos/celtiis.svg    → depuis celtiis.bj (à télécharger)

import { ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem } from "./FadeIn";

// ─── Logos inline SVG ─────────────────────────────────────────────────────────

function MtnLogo({ className }: { className?: string }) {
  return (
    // Logo SVG depuis mtn.bj — héberger localement en prod
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="https://www.mtn.bj/wp-content/themes/mtn-vivid-wp/public/img/mtn-logo-footer.svg"
      alt="MTN Mobile Money"
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = "none";
        e.currentTarget.nextElementSibling?.classList.remove("hidden");
      }}
    />
  );
}

function MtnFallback() {
  return (
    <svg viewBox="0 0 56 24" className="h-6 w-auto" aria-label="MTN">
      <rect width="56" height="24" rx="4" fill="#F8C000" />
      <text
        x="28"
        y="17"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="11"
        fill="#000000"
      >
        MTN
      </text>
    </svg>
  );
}

function MoovMoneyLogo() {
  return (
    <svg viewBox="0 0 96 32" className="h-7 w-auto" aria-label="Moov Money">
      <rect width="96" height="32" rx="6" fill="#003B8E" />
      <text
        x="48"
        y="13"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="9"
        fill="#FF6B00"
        letterSpacing="1"
      >
        MOOV
      </text>
      <text
        x="48"
        y="25"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="400"
        fontSize="7.5"
        fill="#FFFFFF"
        letterSpacing="0.5"
      >
        MONEY
      </text>
    </svg>
  );
}

function CeltiisLogo() {
  return (
    <svg viewBox="0 0 80 32" className="h-7 w-auto" aria-label="Celtiis">
      <rect width="80" height="32" rx="6" fill="#E30613" />
      <text
        x="40"
        y="14"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="9"
        fill="#FFFFFF"
        letterSpacing="1"
      >
        CELTIIS
      </text>
      <text
        x="40"
        y="25"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="400"
        fontSize="7"
        fill="rgba(255,255,255,0.7)"
        letterSpacing="0.5"
      >
        CASH
      </text>
    </svg>
  );
}

// ─── Section principale ───────────────────────────────────────────────────────

export function LandingPaymentGateway() {
  return (
    <section className="py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Paiements
          </p>
          <h2 className="text-3xl font-black text-foreground md:text-4xl">
            Vos clients paient avec
            <br />
            <span className="text-muted-foreground/50">
              ce qu&apos;ils ont déjà.
            </span>
          </h2>
        </FadeIn>

        {/* Logos opérateurs */}
        <Stagger className="mb-10 flex flex-wrap items-center justify-center gap-6">
          <StaggerItem>
            <div className="flex flex-col items-center gap-2">
              <div className="flex cursor-default items-center justify-center rounded-xl border border-border/40 bg-card p-3 transition-colors hover:border-border hover:bg-card/80">
                <MtnLogo className="h-7 w-auto" />
                <MtnFallback />
              </div>
              <span className="text-[10px] text-muted-foreground/50">
                MTN Mobile Money
              </span>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="flex flex-col items-center gap-2">
              <div className="flex cursor-default items-center justify-center rounded-xl border border-border/40 bg-card p-3 transition-colors hover:border-border hover:bg-card/80">
                <MoovMoneyLogo />
              </div>
              <span className="text-[10px] text-muted-foreground/50">
                Moov Money
              </span>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="flex flex-col items-center gap-2">
              <div className="flex cursor-default items-center justify-center rounded-xl border border-border/40 bg-card p-3 transition-colors hover:border-border hover:bg-card/80">
                <CeltiisLogo />
              </div>
              <span className="text-[10px] text-muted-foreground/50">
                Celtiis Cash
              </span>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="flex flex-col items-center gap-2">
              <div className="flex cursor-default items-center justify-center rounded-xl border border-dashed border-border/30 bg-muted/5 px-5 py-3">
                <span className="text-xs text-muted-foreground/30">
                  + à venir
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/50">
                via Moneroo
              </span>
            </div>
          </StaggerItem>
        </Stagger>

        {/* Moneroo explication */}
        <FadeIn>
          <Card className="overflow-hidden ring-1 ring-primary/10">
            <div className="border-b border-border/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  Propulsé par Moneroo
                </span>
              </div>
            </div>
            <div className="grid gap-0 divide-y divide-border/30 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <CardContent className="px-6 py-5">
                <p className="mb-1 text-sm font-medium text-foreground">
                  Une passerelle, tous les opérateurs.
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Moneroo connecte Pixel-Mart à l&apos;ensemble des agrégateurs
                  de Mobile Money béninois via une seule intégration. Si un
                  nouvel opérateur est supporté, vos clients peuvent
                  l&apos;utiliser automatiquement — sans aucune modification de
                  votre côté.
                </p>
              </CardContent>
              <CardContent className="px-6 py-5">
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-green-400" />
                  <span className="text-sm font-medium text-foreground">
                    Conforme PCI-DSS
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Aucune donnée de paiement ne transite par nos serveurs.
                  Moneroo est certifié PCI-DSS — le standard international de
                  sécurité des transactions. Vos clients et vous êtes protégés.
                </p>
              </CardContent>
            </div>
          </Card>
        </FadeIn>
      </div>
    </section>
  );
}
