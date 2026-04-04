import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Pixel-Mart",
  description:
    "Conditions générales d'utilisation de la marketplace Pixel-Mart.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold tracking-tight">
            Conditions générales d'utilisation
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : 4 avril 2026
          </p>

          <hr />

          <section>
            <h2 className="text-xl font-semibold">Préambule</h2>
            <p>
              Les présentes conditions générales d'utilisation régissent l'accès
              et l'utilisation de la marketplace Pixel-Mart, accessible à
              l'adresse{" "}
              <a
                href="https://www.pixel-mart-bj.com"
                className="text-primary hover:underline"
              >
                www.pixel-mart-bj.com
              </a>
              .
            </p>
            <p>
              En accédant à la Plateforme, en créant un compte ou en utilisant
              nos services, vous acceptez sans réserve l'ensemble des
              dispositions des présentes CGU. Si vous n'acceptez pas ces
              conditions, veuillez ne pas utiliser nos services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">1. Définitions</h2>
            <ul>
              <li>
                <strong>Plateforme</strong> — la marketplace en ligne
                Pixel-Mart, ses applications web et services associés.
              </li>
              <li>
                <strong>Client</strong> — tout utilisateur qui achète des
                produits sur la Plateforme.
              </li>
              <li>
                <strong>Vendeur</strong> — tout professionnel ou particulier qui
                propose des produits à la vente sur la Plateforme.
              </li>
              <li>
                <strong>Pixel-Mart</strong> — l'exploitant de la Plateforme,
                agissant en tant qu'intermédiaire entre les vendeurs et les
                clients.
              </li>
              <li>
                <strong>Produit</strong> — tout bien physique ou numérique
                proposé à la vente par un vendeur sur la Plateforme.
              </li>
              <li>
                <strong>Commande</strong> — acte d'achat conclu entre un client
                et un vendeur via la Plateforme.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Accès à la Plateforme</h2>
            <p>
              L'accès à la Plateforme est gratuit. Pixel-Mart se réserve le
              droit de modifier, suspendre ou interrompre temporairement tout ou
              partie de la Plateforme pour des raisons de maintenance,
              d'évolution technique ou de sécurité, sans préavis.
            </p>
            <p>
              Pour passer une commande ou ouvrir une boutique, vous devez créer
              un compte en fournissant des informations exactes, complètes et à
              jour. Vous êtes responsable de la confidentialité de vos
              identifiants de connexion et de toutes les activités effectuées
              sous votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Règles de conduite</h2>
            <p>En utilisant la Plateforme, vous vous engagez à :</p>
            <ul>
              <li>
                Ne pas utiliser la Plateforme à des fins illégales, frauduleuses
                ou non autorisées.
              </li>
              <li>
                Ne pas publier de contenu diffamatoire, injurieux, menaçant,
                obscène ou contraire aux bonnes mœurs.
              </li>
              <li>
                <strong>
                  Ne pas proposer de produits à caractère sexuel, pornographique
                  ou adulte sur la Plateforme.
                </strong>{" "}
                Tout contenu de cette nature sera retiré sans préavis et le
                compte concerné pourra être suspendu ou banni.
              </li>
              <li>
                Ne pas tenter de perturber, endommager ou accéder de manière non
                autorisée aux systèmes de la Plateforme.
              </li>
              <li>
                Ne pas collecter ou exploiter les données personnelles d'autres
                utilisateurs sans leur consentement.
              </li>
              <li>
                Ne pas utiliser de robots, scrapers ou autres moyens automatisés
                pour accéder à la Plateforme sans autorisation écrite préalable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Comptes utilisateurs</h2>
            <p>
              Chaque utilisateur est responsable de la sécurité de son compte.
              En cas de suspicion d'utilisation non autorisée, vous devez nous
              contacter immédiatement à{" "}
              <a
                href="mailto:contact@pixel-mart-bj.com"
                className="text-primary hover:underline"
              >
                contact@pixel-mart-bj.com
              </a>
              .
            </p>
            <p>
              Pixel-Mart se réserve le droit de suspendre ou de supprimer tout
              compte en cas de violation des présentes CGU, sans préjudice des
              dommages et intérêts qui pourraient être réclamés.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Rôle de Pixel-Mart</h2>
            <p>
              Pixel-Mart agit en tant qu'<strong>intermédiaire</strong> entre
              les vendeurs et les clients. La Plateforme met à disposition un
              espace de mise en relation et des outils de gestion, mais n'est
              pas le vendeur des produits proposés.
            </p>
            <p>
              Le contrat de vente est conclu directement entre le client et le
              vendeur. Pixel-Mart n'est pas partie à ce contrat et ne peut être
              tenu responsable de la qualité, de la conformité ou de la légalité
              des produits vendus.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              6. Obligations des vendeurs
            </h2>
            <p>Les vendeurs s'engagent à :</p>
            <ul>
              <li>
                Fournir des descriptions de produits exactes, complètes et non
                trompeuses.
              </li>
              <li>Publier des photos fidèles des produits proposés.</li>
              <li>
                Respecter les délais de traitement et d'expédition indiqués.
              </li>
              <li>
                Ne pas proposer de produits contrefaits, illicites, dangereux ou
                interdits par la loi.
              </li>
              <li>
                <strong>
                  Ne pas publier de produits à caractère sexuel, pornographique
                  ou adulte.
                </strong>
              </li>
              <li>
                Répondre aux questions des clients et aux demandes de retour
                dans des délais raisonnables.
              </li>
              <li>
                Se conformer à toutes les lois et réglementations applicables en
                matière de commerce, de consommation et de protection des
                données.
              </li>
              <li>
                Maintenir des niveaux de stock à jour et ne pas accepter de
                commandes pour des produits indisponibles.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Commandes et paiements</h2>

            <h3 className="text-lg font-medium">7.1 Passation de commande</h3>
            <p>
              Toute commande passée sur la Plateforme constitue une offre
              d'achat. La commande est confirmée lorsque le paiement est validé
              (en ligne) ou lorsque le vendeur accepte la commande (contre
              remboursement).
            </p>

            <h3 className="text-lg font-medium">7.2 Modes de paiement</h3>
            <p>
              Les paiements sont traités par notre partenaire{" "}
              <strong>Moneroo</strong> et peuvent être effectués via :
            </p>
            <ul>
              <li>Mobile Money : MTN MoMo, Orange Money, Wave, Flooz</li>
              <li>Contre remboursement (COD) — paiement à la livraison</li>
            </ul>

            <h3 className="text-lg font-medium">7.3 Prix</h3>
            <p>
              Les prix sont affichés en Franc CFA (XOF) et s'entendent toutes
              taxes comprises. Les frais de livraison sont calculés séparément
              et affichés avant validation de la commande.
            </p>

            <h3 className="text-lg font-medium">7.4 Remboursements</h3>
            <p>
              En cas de remboursement, le montant est restitué via le même moyen
              de paiement que celui utilisé lors de l'achat. Les délais de
              traitement dépendent du prestataire de paiement et peuvent prendre
              jusqu'à 14 jours ouvrables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Livraison</h2>
            <p>
              La livraison est assurée par le service de livraison Pixel-Mart ou
              directement par le vendeur, selon le mode de service choisi par ce
              dernier.
            </p>
            <ul>
              <li>
                <strong>Livraison standard</strong> — délai indiqué lors de la
                commande, variable selon la distance et la zone géographique.
              </li>
              <li>
                <strong>Livraison urgente</strong> — délai réduit avec
                supplément tarifaire.
              </li>
              <li>
                <strong>Retrait en point de collecte</strong> — disponible si le
                vendeur a configuré un point de retrait.
              </li>
            </ul>
            <p>
              En cas de retard de livraison dépassant 7 jours ouvrables au-delà
              de la date estimée, le client peut demander l'annulation de sa
              commande avec remboursement intégral.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              9. Retours et remboursements
            </h2>
            <p>
              Le client dispose d'un délai de <strong>48 heures</strong> à
              compter de la réception de sa commande pour demander un retour.
              Les retours sont soumis aux conditions suivantes :
            </p>
            <ul>
              <li>
                Le produit doit être dans son état d'origine, non utilisé.
              </li>
              <li>
                Le motif du retour doit être justifié (produit défectueux, non
                conforme à la description, endommagé pendant le transport, ou
                changement d'avis).
              </li>
              <li>
                Le vendeur dispose de 7 jours pour accepter ou refuser la
                demande de retour.
              </li>
              <li>
                En cas d'acceptation, le remboursement est effectué dans un
                délai de 14 jours ouvrables.
              </li>
            </ul>
            <p>
              Les produits numériques ne sont ni repris ni remboursés une fois
              téléchargés.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              10. Contenu généré par les utilisateurs
            </h2>
            <p>
              Les avis produits, questions/réponses, messages et tout autre
              contenu publié par les utilisateurs sur la Plateforme restent la
              propriété de leurs auteurs. En publiant du contenu, vous accordez
              à Pixel-Mart une licence non exclusive, mondiale et gratuite pour
              utiliser, reproduire et afficher ce contenu dans le cadre du
              fonctionnement de la Plateforme.
            </p>
            <p>
              Pixel-Mart se réserve le droit de modérer, modifier ou supprimer
              tout contenu jugé contraire aux présentes CGU, sans préavis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              11. Propriété intellectuelle
            </h2>
            <p>
              L'ensemble des éléments de la Plateforme (marque Pixel-Mart, logo,
              design, code source, textes, images, graphismes) sont la propriété
              exclusive de Pixel-Mart ou de leurs titulaires respectifs et sont
              protégés par les lois sur la propriété intellectuelle.
            </p>
            <p>
              Toute reproduction, représentation ou utilisation non autorisée de
              ces éléments est interdite et constitue une contrefaçon.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              12. Limitation de responsabilité
            </h2>
            <p>
              Pixel-Mart s'engage à mettre en œuvre tous les moyens raisonnables
              pour assurer le bon fonctionnement de la Plateforme. Toutefois,
              Pixel-Mart ne saurait être tenu responsable :
            </p>
            <ul>
              <li>
                De la qualité, de la conformité ou de la légalité des produits
                vendus par les vendeurs.
              </li>
              <li>
                Des litiges entre clients et vendeurs, bien que Pixel-Mart
                s'efforce de faciliter leur résolution.
              </li>
              <li>
                Des interruptions temporaires de la Plateforme pour des raisons
                de maintenance, de force majeure ou de circonstances
                indépendantes de sa volonté.
              </li>
              <li>
                Des dommages indirects, tels que perte de données, perte de
                chiffre d'affaires ou préjudice commercial.
              </li>
              <li>
                Des contenus publiés par les utilisateurs, sous réserve de
                l'obligation de retrait en cas de signalement de contenu
                illicite.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              13. Protection des données personnelles
            </h2>
            <p>
              La collecte et le traitement de vos données personnelles sont
              régis par notre{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Politique de confidentialité
              </a>
              , qui fait partie intégrante des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              14. Cookies et données de navigation
            </h2>
            <p>
              La Plateforme utilise des cookies et des technologies similaires
              pour assurer son bon fonctionnement, mémoriser vos préférences et
              vous informer de l'état de vos commandes. Vous pouvez gérer vos
              préférences via les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              15. Résolution des litiges
            </h2>
            <p>
              En cas de litige, les parties s'engagent à rechercher une solution
              amiable avant toute action judiciaire. Pixel-Mart met à
              disposition un service de médiation pour faciliter la résolution
              des conflits entre clients et vendeurs.
            </p>
            <p>
              À défaut de résolution amiable, tout litige relatif aux présentes
              CGU sera soumis à la compétence exclusive des tribunaux de{" "}
              <strong>Cotonou, Bénin</strong>, conformément au droit béninois.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">16. Modification des CGU</h2>
            <p>
              Pixel-Mart se réserve le droit de modifier les présentes CGU à
              tout moment. Les utilisateurs seront informés des modifications
              substantielles par e-mail ou par notification sur la Plateforme.
              L'utilisation continue de la Plateforme après la publication des
              modifications constitue une acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">17. Nous contacter</h2>
            <p>
              Pour toute question relative aux présentes CGU ou à l'utilisation
              de la Plateforme :
            </p>
            <ul>
              <li>
                E-mail :{" "}
                <a
                  href="mailto:contact@pixel-mart-bj.com"
                  className="text-primary hover:underline"
                >
                  contact@pixel-mart-bj.com
                </a>
              </li>
              <li>Adresse : Cotonou, Bénin</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
