// filepath: src/app/(storefront)/about/page.tsx

import { Users, Target, Heart, TrendingUp } from "lucide-react";

const TEAM: { name: string; role: string; bio: string; avatar: string }[] =
  [];

const VALUES = [
  {
    icon: Target,
    title: "Notre Mission",
    description:
      "Démocratiser le commerce en ligne en Afrique en offrant aux entrepreneurs locaux une plateforme simple, fiable et accessible pour vendre leurs produits.",
  },
  {
    icon: Heart,
    title: "Nos Valeurs",
    description:
      "Confiance, transparence et innovation. Nous croyons en un écosystème commercial équitable où chaque vendeur a les mêmes opportunités de succès.",
  },
  {
    icon: TrendingUp,
    title: "Notre Vision",
    description:
      "Devenir la référence du e-commerce en Afrique de l'Ouest d'ici 2027, en connectant des milliers de vendeurs à des millions d'acheteurs.",
  },
  {
    icon: Users,
    title: "Notre Communauté",
    description:
      "Une communauté grandissante de vendeurs et d'acheteurs qui font confiance à Pixel-Mart pour leurs transactions quotidiennes.",
  },
];

const STATS = [
  { value: "500+", label: "Vendeurs actifs" },
  { value: "10 000+", label: "Produits disponibles" },
  { value: "3", label: "Pays couverts" },
  { value: "98%", label: "Clients satisfaits" },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container px-4 text-center max-w-3xl mx-auto">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            À propos
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            La marketplace pensée pour{" "}
            <span className="text-primary">l'Afrique</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Pixel-Mart est née d'une conviction simple : les entrepreneurs
            africains méritent une plateforme e-commerce adaptée à leurs
            réalités, avec des paiements Mobile Money et une interface en
            français.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="container px-4 py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Ce qui nous anime</h2>
          <p className="mt-3 text-muted-foreground">
            Les piliers qui guident chacune de nos décisions
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <value.icon className="size-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-muted/30 py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Notre histoire</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Pixel-Mart a été fondée en 2023 à Cotonou, au Bénin, par une
                équipe de jeunes entrepreneurs frustrés par le manque de
                solutions e-commerce adaptées au marché ouest-africain. Les
                plateformes existantes étaient soit trop chères, soit trop
                complexes, soit tout simplement inadaptées aux réalités locales.
              </p>
              <p>
                Notre premier défi a été l'intégration des paiements Mobile
                Money — MTN, Orange, Wave et Moov — qui représentent plus de 80%
                des transactions digitales en Afrique de l'Ouest. Aujourd'hui,
                nos vendeurs acceptent ces paiements en quelques clics.
              </p>
              <p>
                En moins d'un an, nous avons accueilli plus de 500 vendeurs
                actifs au Bénin, en Côte d'Ivoire et au Sénégal. Notre objectif
                est d'étendre notre présence à toute l'Afrique francophone d'ici
                2026.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team — populated when available */}
      {TEAM.length > 0 && (
        <section className="container px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">L'équipe</h2>
            <p className="mt-3 text-muted-foreground">
              Les personnes derrière Pixel-Mart
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3 max-w-3xl mx-auto">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="text-center rounded-xl border bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg mx-auto mb-4">
                  {member.avatar}
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-primary mb-2">{member.role}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary/5 border-t py-16">
        <div className="container px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Rejoignez l'aventure Pixel-Mart
          </h2>
          <p className="text-muted-foreground mb-6">
            Vous êtes vendeur ? Créez votre boutique gratuitement et commencez à
            vendre dès aujourd'hui.
          </p>
          <a
            href="/onboarding/vendor"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Devenir vendeur
          </a>
        </div>
      </section>
    </main>
  );
}
