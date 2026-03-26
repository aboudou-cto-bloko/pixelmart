// filepath: src/components/marketing/LandingProblem.tsx

import { MessageSquareOff, CreditCard, BarChart2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FadeIn, Stagger, StaggerItem } from "./FadeIn";

const PROBLEMS = [
  {
    icon: MessageSquareOff,
    title: "Vos commandes se perdent dans WhatsApp",
    body: "Vous gérez vos ventes dans des conversations. Pas de confirmation, pas de suivi, pas de récap. Quand un client revient 3 semaines après, vous cherchez dans vos chats.",
    quote:
      "\"J'ai perdu 3 commandes ce mois parce que je n'avais pas vu le message.\"",
  },
  {
    icon: CreditCard,
    title: "Vos clients n'ont pas de carte bancaire",
    body: "Au Bénin, la grande majorité paye via Mobile Money. Les solutions e-commerce classiques ne supportent pas MTN ou Moov Money nativement.",
    quote:
      '"J\'ai dû refuser 5 commandes faute de solution de paiement adaptée."',
  },
  {
    icon: BarChart2,
    title: "Vous ne savez pas ce qui se vend vraiment",
    body: "Vous avez des ventes, mais pas d'analytics. Quel produit rapporte le plus ? Quel client revient ? Vous décidez à l'instinct.",
    quote:
      '"Je commande 100 unités de chaque. Je ne sais jamais ce qui va marcher."',
  },
];

export function LandingProblem() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <FadeIn className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Le problème
          </p>
          <h2 className="text-3xl font-black text-foreground md:text-4xl">
            Vendre en ligne au Bénin,
            <br />
            <span className="text-muted-foreground/50">
              c&apos;est encore trop compliqué.
            </span>
          </h2>
        </FadeIn>

        <Stagger className="grid gap-4 md:grid-cols-3">
          {PROBLEMS.map((p) => {
            const Icon = p.icon;
            return (
              <StaggerItem key={p.title}>
                <Card className="flex h-full flex-col gap-4 p-6 transition-colors hover:ring-border cursor-default">
                  <CardHeader className="p-0 gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
                      <Icon className="size-4 text-destructive" />
                    </div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {p.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col gap-3 flex-1">
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {p.body}
                    </CardDescription>
                    <blockquote className="mt-auto rounded-lg border-l-2 border-destructive/30 bg-destructive/5 py-2 pl-3 text-xs italic text-muted-foreground/60">
                      {p.quote}
                    </blockquote>
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
