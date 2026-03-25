// filepath: src/components/marketing/LandingTrust.tsx

import { ShieldCheck, Clock, MapPin, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem } from "./FadeIn";

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Vos paiements sont protégés",
    description:
      "Chaque transaction est sécurisée de bout en bout. Vos clients paient en confiance, et vous recevez votre argent sans intermédiaire douteux.",
  },
  {
    icon: RefreshCw,
    title: "Vos stocks se mettent à jour instantanément",
    description:
      "Dès qu'une commande est passée, votre stock est ajusté automatiquement. Plus de survente, plus de commandes impossibles à honorer.",
  },
  {
    icon: MapPin,
    title: "Pensé pour le marché béninois",
    description:
      "Les opérateurs, les prix de livraison, les habitudes d'achat locales — tout est calibré pour Cotonou et le Bénin, pas adapté d'un produit générique.",
  },
  {
    icon: Clock,
    title: "Votre argent vous appartient",
    description:
      "Votre balance est créditée après chaque vente confirmée. Vous demandez un retrait quand vous le souhaitez, directement sur votre Mobile Money.",
  },
];

export function LandingTrust() {
  return (
    <section className="relative overflow-hidden py-32">
      <div className="pointer-events-none absolute inset-0 bg-card/20" />

      <div className="container relative mx-auto px-4">
        <FadeIn className="mb-16 text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-green-500/10">
            <ShieldCheck className="size-7 text-green-400" />
          </div>
          <h2 className="text-3xl font-black text-foreground md:text-4xl">
            Votre commerce, en sécurité.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
            Pixel-Mart est conçu pour que vous puissiez vous concentrer sur
            votre business — pas sur la logistique ou les problèmes de paiement.
          </p>
        </FadeIn>

        <Stagger className="grid gap-4 sm:grid-cols-2">
          {TRUST_POINTS.map((t) => {
            const Icon = t.icon;
            return (
              <StaggerItem key={t.title}>
                <Card className="h-full p-6 cursor-default transition-colors hover:ring-green-500/15">
                  <CardContent className="p-0 flex flex-col gap-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-green-500/10">
                      <Icon className="size-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="mb-2 text-base font-bold text-foreground">
                        {t.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {t.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
