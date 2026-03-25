// filepath: src/components/marketing/LandingFeatures.tsx
// Grid de features secondaires — 3 colonnes, icône + titre + description.

import { Store, Star, Tag, Package, ClipboardList, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem } from "./FadeIn";

const FEATURES = [
  {
    icon: Store,
    title: "Votre boutique, votre marque",
    description:
      "Votre adresse, votre logo, vos couleurs. Vos clients ne voient que vous — pas Pixel-Mart.",
  },
  {
    icon: Tag,
    title: "Codes promo",
    description:
      "Offrez des réductions à vos clients fidèles ou lors d'une opération spéciale. Vous choisissez le montant et la durée.",
  },
  {
    icon: Star,
    title: "Avis clients vérifiés",
    description:
      "Seuls les acheteurs qui ont vraiment reçu leur commande peuvent laisser un avis. Zéro faux avis.",
  },
  {
    icon: Package,
    title: "Physique & digital",
    description:
      "Robes, sneakers, e-books — peu importe ce que vous vendez. Stock et variantes gérés automatiquement.",
  },
  {
    icon: ClipboardList,
    title: "Vos chiffres en clair",
    description:
      "Vos revenus de la semaine, du mois, vos produits qui marchent le mieux. En un coup d'œil.",
  },
  {
    icon: Users,
    title: "Vendeur et acheteur",
    description:
      "Achetez sur d'autres boutiques pendant que la vôtre tourne. Un seul compte pour les deux.",
  },
];

export function LandingFeatures() {
  return (
    <section className="py-32">
      <div className="container mx-auto px-4">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Fonctionnalités
          </p>
          <h2 className="text-3xl font-black text-foreground md:text-4xl">
            Tout ce dont vous avez besoin.
            <br />
            <span className="text-muted-foreground/45">Rien de superflu.</span>
          </h2>
        </FadeIn>

        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <StaggerItem key={f.title}>
                <Card className="flex h-full flex-col gap-4 p-6 transition-colors hover:ring-border/60 cursor-default">
                  <CardContent className="p-0 flex flex-col gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-4 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                      {f.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
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
