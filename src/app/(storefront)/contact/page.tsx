// filepath: src/app/(storefront)/contact/page.tsx

import { Phone, Mail, MapPin, Clock } from "lucide-react";

const CONTACT_INFO = [
  {
    icon: MapPin,
    title: "Adresse",
    lines: ["Quartier Cadjehoun", "Cotonou, Bénin"],
  },
  {
    icon: Phone,
    title: "Téléphone",
    lines: ["+229 XX XX XX XX", "Lun - Sam, 8h - 18h"],
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["contact@pixel-mart-bj.com", "support@pixel-mart-bj.com"],
  },
  {
    icon: Clock,
    title: "Horaires",
    lines: ["Lundi - Vendredi : 8h - 18h", "Samedi : 9h - 14h"],
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container px-4 text-center max-w-2xl mx-auto">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            Contact
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            On est à votre écoute
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Une question, un problème ou une suggestion ? Notre équipe vous
            répond dans les plus brefs délais.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-2 max-w-5xl mx-auto">
          {/* Form */}
          <div className="rounded-xl border bg-card p-8">
            <h2 className="text-xl font-bold mb-6">Envoyez-nous un message</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom</label>
                  <input
                    type="text"
                    placeholder="Votre prénom"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom</label>
                  <input
                    type="text"
                    placeholder="Votre nom"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sujet</label>
                <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Sélectionnez un sujet</option>
                  <option value="support">Support technique</option>
                  <option value="vendor">Devenir vendeur</option>
                  <option value="payment">Problème de paiement</option>
                  <option value="order">Suivi de commande</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  rows={5}
                  placeholder="Décrivez votre demande..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <button className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Envoyer le message
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">
                Informations de contact
              </h2>
              <p className="text-muted-foreground text-sm">
                Vous pouvez aussi nous contacter directement via ces canaux.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {CONTACT_INFO.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-xl border bg-card p-5"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    {item.lines.map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp */}
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
              <h3 className="font-semibold text-sm mb-1 text-green-600 dark:text-green-400">
                WhatsApp
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Pour une réponse rapide, contactez-nous sur WhatsApp.
              </p>
              <a
                href="https://wa.me/22900000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
              >
                Ouvrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
