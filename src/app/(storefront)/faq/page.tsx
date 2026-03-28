// filepath: src/app/(storefront)/faq/page.tsx

"use client";

import * as React from "react";
import { ChatwayButton } from "@/components/atoms/ChatwayButton";
import { ChevronDown } from "lucide-react";

const FAQ_CATEGORIES = [
  {
    category: "Achats & Commandes",
    questions: [
      {
        q: "Comment passer une commande sur Pixel-Mart ?",
        a: "Parcourez notre catalogue, ajoutez les produits souhaités à votre panier, puis suivez les étapes du checkout. Vous pouvez payer via Mobile Money (MTN, Orange, Wave, Moov) ou par carte Visa.",
      },
      {
        q: "Comment suivre ma commande ?",
        a: "Après votre achat, rendez-vous dans 'Mes commandes' depuis votre compte. Vous y trouverez le statut en temps réel de chaque commande ainsi que les informations de livraison.",
      },
      {
        q: "Puis-je annuler une commande ?",
        a: "Oui, vous pouvez annuler une commande tant qu'elle n'a pas encore été expédiée par le vendeur. Rendez-vous dans 'Mes commandes' et cliquez sur 'Annuler la commande'.",
      },
      {
        q: "Les prix affichés incluent-ils les frais de livraison ?",
        a: "Non, les frais de livraison sont calculés séparément lors du checkout en fonction de votre adresse et du vendeur. Vous verrez le montant total avant de confirmer votre commande.",
      },
    ],
  },
  {
    category: "Paiements",
    questions: [
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "Pixel-Mart accepte MTN Mobile Money, Orange Money, Wave, Moov Flooz et les cartes Visa. Tous les paiements sont sécurisés via notre partenaire Moneroo.",
      },
      {
        q: "Mon paiement a échoué, que faire ?",
        a: "Vérifiez d'abord que votre solde Mobile Money est suffisant. Si le problème persiste, attendez quelques minutes et réessayez. Si le montant a été débité sans confirmation, contactez notre support — nous vous rembourserons.",
      },
      {
        q: "Est-ce que mes données de paiement sont sécurisées ?",
        a: "Absolument. Pixel-Mart ne stocke aucune donnée bancaire ou Mobile Money. Tous les paiements transitent par Moneroo, certifié aux normes de sécurité les plus strictes.",
      },
    ],
  },
  {
    category: "Livraison",
    questions: [
      {
        q: "Quels sont les délais de livraison ?",
        a: "Les délais varient selon le vendeur et votre localisation. En général, comptez 1 à 3 jours ouvrables pour Cotonou, et 3 à 7 jours pour les autres villes du Bénin.",
      },
      {
        q: "Livrez-vous dans toute l'Afrique de l'Ouest ?",
        a: "Actuellement, nous livrons au Bénin, en Côte d'Ivoire et au Sénégal. Nous travaillons à étendre notre couverture à d'autres pays prochainement.",
      },
      {
        q: "Que faire si je ne reçois pas ma commande ?",
        a: "Si votre commande est marquée comme livrée mais que vous ne l'avez pas reçue, contactez d'abord le vendeur via la messagerie de la commande. Si le problème n'est pas résolu sous 48h, contactez notre support.",
      },
    ],
  },
  {
    category: "Retours & Remboursements",
    questions: [
      {
        q: "Comment retourner un produit ?",
        a: "Vous avez 7 jours après réception pour demander un retour. Allez dans 'Mes commandes', sélectionnez la commande concernée et cliquez sur 'Demander un retour'. Le vendeur examinera votre demande.",
      },
      {
        q: "Dans quel délai suis-je remboursé ?",
        a: "Une fois le retour approuvé par le vendeur, le remboursement est effectué sous 3 à 5 jours ouvrables sur votre moyen de paiement initial.",
      },
    ],
  },
  {
    category: "Vendeurs",
    questions: [
      {
        q: "Comment devenir vendeur sur Pixel-Mart ?",
        a: "Créez un compte, puis rendez-vous sur 'Devenir vendeur'. Remplissez les informations de votre boutique et commencez à ajouter vos produits. L'inscription est gratuite.",
      },
      {
        q: "Quelles sont les commissions prélevées ?",
        a: "Pixel-Mart prélève une commission de 5% sur chaque vente réalisée. Il n'y a pas de frais d'abonnement mensuel sur le plan gratuit.",
      },
      {
        q: "Comment recevoir mes paiements en tant que vendeur ?",
        a: "Vos gains sont créditées sur votre solde Pixel-Mart après chaque vente confirmée. Vous pouvez demander un virement vers votre compte Mobile Money à tout moment depuis votre dashboard.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium hover:text-primary transition-colors"
      >
        <span>{q}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {a}
        </p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container px-4 text-center max-w-2xl mx-auto">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            FAQ
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Questions fréquentes
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Trouvez rapidement les réponses à vos questions sur Pixel-Mart.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="container px-4 py-20 max-w-3xl mx-auto">
        <div className="space-y-10">
          {FAQ_CATEGORIES.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-lg font-bold mb-4 text-primary">
                {cat.category}
              </h2>
              <div className="rounded-xl border bg-card px-6">
                {cat.questions.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-xl border bg-muted/30 p-8 text-center">
          <h3 className="font-bold text-lg mb-2">
            Vous n'avez pas trouvé votre réponse ?
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Notre équipe est disponible pour vous aider.
          </p>
          <ChatwayButton className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Contactez-nous
          </ChatwayButton>
        </div>
      </section>
    </main>
  );
}
