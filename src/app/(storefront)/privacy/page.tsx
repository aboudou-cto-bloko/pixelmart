// filepath: src/app/(storefront)/privacy/page.tsx

const SECTIONS = [
  {
    title: "1. Responsable du traitement",
    content: `Pixel-Mart est la plateforme marketplace opérée depuis Cotonou, Bénin. En tant que responsable du traitement, nous vous informons de la manière dont vos données personnelles sont collectées, utilisées et protégées lorsque vous utilisez nos services.`,
  },
  {
    title: "2. Données collectées",
    content: `Nous collectons uniquement les données nécessaires au fonctionnement du service :\n\n• Données de compte : nom, adresse email, numéro de téléphone\n• Données de commande : adresse de livraison, historique d'achats\n• Données de paiement : numéro Mobile Money (traité par Moneroo — nous ne stockons aucune donnée bancaire brute)\n• Données de navigation : pages consultées, actions sur la plateforme (à des fins d'amélioration du service)\n• Données vendeurs : informations sur la boutique, coordonnées bancaires pour les retraits`,
  },
  {
    title: "3. Finalités du traitement",
    content: `Vos données sont traitées pour :\n\n• Créer et gérer votre compte\n• Traiter vos commandes et paiements\n• Vous envoyer des notifications transactionnelles (confirmation de commande, livraison, retrait)\n• Améliorer l'expérience de la plateforme\n• Respecter nos obligations légales et comptables\n\nNous n'utilisons pas vos données à des fins publicitaires tierces sans votre consentement explicite.`,
  },
  {
    title: "4. Base légale",
    content: `Le traitement de vos données repose sur :\n\n• L'exécution du contrat : pour traiter vos commandes et gérer votre compte\n• Notre intérêt légitime : pour améliorer la sécurité et les performances de la plateforme\n• Votre consentement : pour les communications marketing (désabonnement possible à tout moment)\n• L'obligation légale : pour nos obligations comptables et fiscales`,
  },
  {
    title: "5. Partage des données",
    content: `Vos données peuvent être partagées avec :\n\n• Moneroo : traitement sécurisé des paiements Mobile Money\n• Resend : envoi des emails transactionnels\n• Le vendeur concerné : uniquement les informations nécessaires à la livraison (nom, adresse)\n\nNous ne vendons jamais vos données personnelles à des tiers.`,
  },
  {
    title: "6. Conservation des données",
    content: `Vos données sont conservées aussi longtemps que votre compte est actif. En cas de suppression de compte, les données sont effacées dans un délai de 30 jours, à l'exception des données comptables conservées conformément aux obligations légales (généralement 5 à 10 ans selon la législation béninoise applicable).`,
  },
  {
    title: "7. Vos droits",
    content: `Conformément à la réglementation applicable sur la protection des données, vous disposez des droits suivants :\n\n• Droit d'accès : obtenir une copie de vos données\n• Droit de rectification : corriger des données inexactes\n• Droit à l'effacement : demander la suppression de vos données\n• Droit d'opposition : vous opposer à certains traitements\n• Droit à la portabilité : recevoir vos données dans un format structuré\n\nPour exercer ces droits, contactez-nous à privacy@pixel-mart-bj.com.`,
  },
  {
    title: "8. Sécurité",
    content: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :\n\n• Chiffrement des communications (HTTPS)\n• Authentification sécurisée avec sessions HTTP-only\n• Accès restreint aux données selon le rôle (RBAC)\n• Aucune donnée de paiement brute stockée sur nos serveurs\n• Surveillance des accès et journaux d'audit`,
  },
  {
    title: "9. Cookies",
    content: `Pixel-Mart utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d'authentification). Nous n'utilisons pas de cookies publicitaires tiers. Votre session est maintenue via un cookie HTTP-only sécurisé qui expire automatiquement.`,
  },
  {
    title: "10. Modification de cette politique",
    content: `Nous pouvons mettre à jour cette politique à tout moment. En cas de modification substantielle, nous vous en informons par email ou via une notification sur la plateforme. En continuant à utiliser Pixel-Mart après la mise à jour, vous acceptez la nouvelle politique.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="max-w-2xl mx-auto text-center px-4">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            Légal
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Politique de confidentialité
          </h1>
          <p className="mt-6 text-muted-foreground">
            Dernière mise à jour : janvier 2025
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-10">
          <p className="text-sm text-muted-foreground leading-relaxed">
            La protection de vos données personnelles est une priorité pour
            Pixel-Mart. Cette politique explique quelles données nous
            collectons, pourquoi nous les collectons et comment vous pouvez
            exercer vos droits.
          </p>
        </div>

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold mb-4 text-primary">
                {section.title}
              </h2>
              <div className="rounded-xl border bg-card p-6">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Des questions sur vos données personnelles ?
          </p>
          <a
            href="mailto:privacy@pixel-mart-bj.com"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            privacy@pixel-mart-bj.com
          </a>
        </div>
      </div>
    </div>
  );
}
