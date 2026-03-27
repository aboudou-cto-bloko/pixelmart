// filepath: src/app/(storefront)/terms/page.tsx

const SECTIONS = [
  {
    title: "1. Présentation de Pixel-Mart",
    content: `Pixel-Mart est une marketplace multi-vendeurs opérée par la société Pixel-Mart SAS, dont le siège social est situé à Cotonou, Bénin. La plateforme permet à des vendeurs indépendants de proposer leurs produits à des acheteurs en Afrique de l'Ouest.\n\nEn accédant à la plateforme Pixel-Mart, vous acceptez sans réserve les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.`,
  },
  {
    title: "2. Inscription et compte utilisateur",
    content: `Pour utiliser certaines fonctionnalités de Pixel-Mart, vous devez créer un compte. Vous vous engagez à fournir des informations exactes, maintenir la confidentialité de vos identifiants, nous informer de toute utilisation non autorisée et être âgé d'au moins 18 ans. Pixel-Mart se réserve le droit de suspendre tout compte en cas de violation.`,
  },
  {
    title: "3. Conditions d'achat",
    content: `En passant une commande sur Pixel-Mart, vous acceptez que les prix sont en Francs CFA (XOF), que toute commande constitue une offre d'achat ferme, et que la confirmation est envoyée par email après validation du paiement. Pixel-Mart agit en tant qu'intermédiaire entre l'acheteur et le vendeur.`,
  },
  {
    title: "4. Paiements",
    content: `Les paiements sont traités par notre partenaire Moneroo. Nous acceptons MTN Mobile Money, Orange Money, Wave, Moov Flooz et les cartes Visa. Toutes les transactions sont sécurisées. Pixel-Mart ne stocke aucune donnée bancaire. En cas d'échec de paiement après débit, le remboursement est traité sous 5 jours ouvrables.`,
  },
  {
    title: "5. Politique de retour et remboursement",
    content: `Vous disposez de 7 jours calendaires après réception pour demander un retour, sous réserve que le produit soit dans son état d'origine et dans son emballage. Les frais de retour sont à la charge de l'acheteur, sauf en cas de produit défectueux ou non conforme.`,
  },
  {
    title: "6. Conditions vendeurs",
    content: `Les vendeurs s'engagent à proposer des produits légaux, fournir des descriptions exactes, respecter les délais d'expédition, gérer les retours de bonne foi et s'acquitter des commissions dues à Pixel-Mart (5% par vente). Pixel-Mart peut suspendre tout compte ne respectant pas ces conditions.`,
  },
  {
    title: "7. Propriété intellectuelle",
    content: `L'ensemble du contenu de Pixel-Mart est protégé par les droits de propriété intellectuelle. Toute reproduction non autorisée est interdite. Les vendeurs conservent leurs droits sur leurs contenus mais accordent à Pixel-Mart une licence d'utilisation pour les besoins de la plateforme.`,
  },
  {
    title: "8. Limitation de responsabilité",
    content: `Pixel-Mart ne peut être tenu responsable des actions des vendeurs, de la qualité des produits, des retards de livraison ou des pertes indirectes. La responsabilité de Pixel-Mart est limitée au montant de la transaction concernée.`,
  },
  {
    title: "9. Protection des données personnelles",
    content: `Pixel-Mart collecte vos données uniquement pour la gestion de votre compte, l'amélioration des services et les communications transactionnelles. Vous disposez d'un droit d'accès, de rectification et de suppression. Contactez privacy@pixel-mart-bj.com pour exercer ces droits.`,
  },
  {
    title: "10. Modification des conditions",
    content: `Pixel-Mart se réserve le droit de modifier ces conditions à tout moment. Les modifications entrent en vigueur dès leur publication. En continuant à utiliser Pixel-Mart, vous acceptez les nouvelles conditions.`,
  },
  {
    title: "11. Droit applicable et litiges",
    content: `Ces conditions sont régies par le droit béninois. En cas de litige, les parties rechercheront une solution amiable. À défaut, tout litige sera soumis aux tribunaux de Cotonou, Bénin. Contactez contact@pixel-mart-bj.com pour toute réclamation.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="max-w-2xl mx-auto text-center px-4">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            Légal
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Conditions d'utilisation
          </h1>
          <p className="mt-6 text-muted-foreground">
            Dernière mise à jour : janvier 2025
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-10">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bienvenue sur Pixel-Mart. En utilisant notre plateforme, vous
            acceptez les présentes conditions d'utilisation. Veuillez les lire
            attentivement avant d'effectuer tout achat ou de créer un compte
            vendeur.
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
            Des questions sur nos conditions d'utilisation ?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Contactez-nous
          </a>
        </div>
      </div>
    </div>
  );
}
