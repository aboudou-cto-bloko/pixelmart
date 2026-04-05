import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Pixel-Mart Vendeurs",
  description:
    "Conditions générales de vente pour les vendeurs sur la marketplace Pixel-Mart.",
};

export default function VendorTermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold tracking-tight">
            Conditions générales de vente — Vendeurs
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : 4 avril 2026
          </p>

          <hr />

          <section>
            <h2 className="text-xl font-semibold">Préambule</h2>
            <p>
              Les présentes conditions générales de vente (ci-après les « CGV
              Vendeurs ») régissent les relations commerciales entre Pixel-Mart
              et les vendeurs qui proposent des produits à la vente sur la
              marketplace Pixel-Mart (ci-après la « Plateforme »).
            </p>
            <p>
              En créant un compte vendeur, en activant une boutique ou en
              utilisant les services de vente de la Plateforme, vous acceptez
              sans réserve l'ensemble des dispositions des présentes CGV
              Vendeurs. Ces conditions complètent les{" "}
              <a href="/terms" className="text-primary hover:underline">
                Conditions générales d'utilisation
              </a>{" "}
              qui s'appliquent à tous les utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              1. Objet et rôle de Pixel-Mart
            </h2>
            <p>
              Pixel-Mart met à disposition des vendeurs une marketplace en ligne
              leur permettant de proposer des produits à la vente à des clients
              finaux. Pixel-Mart agit en tant qu'<strong>intermédiaire</strong>{" "}
              technique et commercial entre les vendeurs et les clients.
            </p>
            <p>
              Le contrat de vente est conclu directement entre le vendeur et le
              client. Pixel-Mart n'est pas partie à ce contrat et n'assume pas
              la qualité de vendeur au sens du droit de la consommation.
            </p>
            <p>
              Le vendeur conserve l'entière responsabilité de ses produits, de
              leur description, de leur prix, de leur conformité et de leur
              légalité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              2. Inscription et activation d'une boutique
            </h2>

            <h3 className="text-lg font-medium">2.1 Conditions d'accès</h3>
            <p>Pour ouvrir une boutique sur Pixel-Mart, le vendeur doit :</p>
            <ul>
              <li>
                Disposer d'un compte utilisateur valide sur la Plateforme.
              </li>
              <li>
                Fournir des informations exactes et complètes lors de
                l'inscription (nom, coordonnées, pays d'activité).
              </li>
              <li>
                Accepter les présentes CGV Vendeurs ainsi que les{" "}
                <a href="/terms" className="text-primary hover:underline">
                  Conditions générales d'utilisation
                </a>
                .
              </li>
            </ul>

            <h3 className="text-lg font-medium">2.2 Vérification</h3>
            <p>
              Pixel-Mart se réserve le droit de vérifier l'identité et la
              légitimité de tout vendeur avant d'activer sa boutique. La
              boutique peut rester en statut « en attente » jusqu'à la
              validation par l'administrateur de la Plateforme.
            </p>

            <h3 className="text-lg font-medium">2.3 Multi-boutiques</h3>
            <p>
              Un même vendeur peut posséder plusieurs boutiques. Chaque boutique
              dispose de son propre catalogue, de ses propres paramètres et de
              son propre solde financier.
            </p>

            <h3 className="text-lg font-medium">2.4 Niveaux d'abonnement</h3>
            <p>
              Pixel-Mart propose plusieurs niveaux d'abonnement avec des taux de
              commission différents. Les détails des tarifs sont communiqués
              lors de l'inscription ou sur demande auprès du support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Obligations du vendeur</h2>
            <p>Le vendeur s'engage à :</p>
            <ul>
              <li>
                Proposer uniquement des produits légaux, conformes aux
                réglementations en vigueur au Bénin et dans les pays de
                livraison.
              </li>
              <li>
                Fournir des descriptions de produits exactes, complètes et non
                trompeuses, incluant les caractéristiques essentielles
                (matériaux, dimensions, poids, couleur, fonctionnalités).
              </li>
              <li>
                Publier des photos fidèles des produits, sans retouche altérant
                significativement leur apparence réelle.
              </li>
              <li>
                <strong>
                  Ne pas proposer de produits à caractère sexuel, pornographique
                  ou adulte.
                </strong>{" "}
                Tout contenu de cette nature sera retiré sans préavis et le
                compte pourra être suspendu ou banni définitivement.
              </li>
              <li>
                Ne pas vendre de produits contrefaits, illicites, dangereux,
                prohibés ou soumis à une réglementation particulière sans
                autorisation.
              </li>
              <li>
                Maintenir les niveaux de stock à jour et ne pas accepter de
                commandes pour des produits indisponibles.
              </li>
              <li>
                Traiter les commandes dans les délais indiqués et respecter les
                engagements de livraison.
              </li>
              <li>
                Répondre aux questions des clients et aux demandes de retour
                dans des délais raisonnables.
              </li>
              <li>
                Se conformer à toutes les lois et réglementations applicables en
                matière de commerce, de consommation, de propriété
                intellectuelle et de protection des données.
              </li>
              <li>
                Honorer les commandes confirmées. En cas d'indisponibilité d'un
                produit après confirmation, le vendeur doit en informer le
                client et procéder au remboursement intégral.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Catalogue produits</h2>

            <h3 className="text-lg font-medium">
              4.1 Création de fiches produits
            </h3>
            <p>
              Le vendeur crée et gère son catalogue via le tableau de bord
              vendeur. Chaque fiche produit doit inclure au minimum :
            </p>
            <ul>
              <li>Un titre clair et descriptif.</li>
              <li>Une description détaillée.</li>
              <li>Au moins une image du produit.</li>
              <li>Un prix en Franc CFA (XOF).</li>
              <li>Une catégorie de classement.</li>
              <li>Le niveau de stock disponible.</li>
            </ul>

            <h3 className="text-lg font-medium">4.2 Variantes</h3>
            <p>
              Le vendeur peut définir des variantes pour chaque produit
              (couleur, taille, etc.) avec des prix, stocks et images
              spécifiques.
            </p>

            <h3 className="text-lg font-medium">4.3 Modération</h3>
            <p>
              Pixel-Mart se réserve le droit de modérer, modifier ou supprimer
              toute fiche produit jugée non conforme aux présentes CGV, sans
              préavis. Le vendeur sera notifié de toute suppression.
            </p>

            <h3 className="text-lg font-medium">4.4 Statuts</h3>
            <p>Les produits peuvent avoir les statuts suivants :</p>
            <ul>
              <li>
                <strong>Brouillon</strong> — non visible par les clients.
              </li>
              <li>
                <strong>Actif</strong> — visible et achetable.
              </li>
              <li>
                <strong>Rupture de stock</strong> — visible mais non achetable.
              </li>
              <li>
                <strong>Archivé</strong> — non visible, conservé pour référence.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Commandes</h2>

            <h3 className="text-lg font-medium">5.1 Réception</h3>
            <p>
              Lorsqu'un client passe une commande, le vendeur reçoit une
              notification par e-mail et via le tableau de bord. La commande est
              automatiquement enregistrée avec le statut « en attente » jusqu'à
              confirmation du paiement.
            </p>

            <h3 className="text-lg font-medium">5.2 Traitement</h3>
            <p>
              Une fois le paiement confirmé, le vendeur doit traiter la commande
              en passant au statut « en préparation », puis « expédié » avec un
              numéro de suivi si applicable.
            </p>

            <h3 className="text-lg font-medium">5.3 Délais de traitement</h3>
            <p>
              Le vendeur s'engage à expédier ou préparer la commande dans un
              délai raisonnable, conformément aux indications fournies sur sa
              boutique. En cas de retard, le vendeur doit en informer le client
              et Pixel-Mart.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Prix et commissions</h2>

            <h3 className="text-lg font-medium">6.1 Fixation des prix</h3>
            <p>
              Le vendeur est libre de fixer les prix de ses produits. Les prix
              doivent être affichés en Franc CFA (XOF), toutes taxes comprises.
            </p>

            <h3 className="text-lg font-medium">6.2 Commission Pixel-Mart</h3>
            <p>
              Pixel-Mart prélève une commission sur chaque vente, calculée sur
              le montant total de la commande hors frais de livraison. Le taux
              de commission applicable dépend du niveau d'abonnement du vendeur.
            </p>
            <ul>
              <li>
                <strong>Free</strong> — 7 % (700 basis points).
              </li>
              <li>
                <strong>Pro</strong> — 3 % (300 basis points).
              </li>
              <li>
                <strong>Business</strong> — 2 % (200 basis points).
              </li>
            </ul>
            <p>
              La commission est calculée comme suit :
              <br />
              <code>
                commission = (sous-total − remise coupon) × taux_commission / 10
                000
              </code>
            </p>

            <h3 className="text-lg font-medium">6.3 Frais de livraison</h3>
            <p>
              Les frais de livraison sont calculés séparément et facturés au
              client. Ils ne sont pas inclus dans l'assiette de calcul de la
              commission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Paiements</h2>

            <h3 className="text-lg font-medium">
              7.1 Modes de paiement acceptés
            </h3>
            <p>
              Les paiements sont traités par notre prestataire de paiement et
              incluent :
            </p>
            <ul>
              <li>Mobile Money : MTN MoMo, Orange Money, Wave, Flooz</li>
              <li>Contre remboursement (COD) — paiement à la livraison</li>
            </ul>

            <h3 className="text-lg font-medium">7.2 Flux financier</h3>
            <p>Lors d'une vente :</p>
            <ol>
              <li>Le client paie le montant total (produits + livraison).</li>
              <li>Pixel-Mart prélève sa commission et les frais de service.</li>
              <li>
                Le solde net est crédité sur le{" "}
                <strong>solde en attente</strong> du vendeur.
              </li>
              <li>
                Après livraison confirmée et expiration d'un délai de{" "}
                <strong>48 heures</strong>, le solde en attente est transféré
                vers le <strong>solde disponible</strong> du vendeur.
              </li>
            </ol>

            <h3 className="text-lg font-medium">7.3 Sécurité</h3>
            <p>
              Toutes les transactions sont sécurisées et vérifiées
              automatiquement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Retraits (payouts)</h2>

            <h3 className="text-lg font-medium">8.1 Demande de retrait</h3>
            <p>
              Le vendeur peut demander le retrait de son solde disponible à tout
              moment via le tableau de bord financier.
            </p>

            <h3 className="text-lg font-medium">8.2 Montant minimum</h3>
            <p>
              Le montant minimum de retrait est défini par la plateforme. Toute
              demande inférieure sera rejetée.
            </p>

            <h3 className="text-lg font-medium">8.3 Méthodes de retrait</h3>
            <p>Les retraits sont effectués via :</p>
            <ul>
              <li>Mobile Money (MTN, Orange Money, Wave, Flooz)</li>
              <li>Virement bancaire</li>
            </ul>

            <h3 className="text-lg font-medium">8.4 Délai</h3>
            <p>
              Les retraits sont traités dans un délai de 1 à 5 jours ouvrables
              après validation.
            </p>

            <h3 className="text-lg font-medium">8.5 Sécurité</h3>
            <p>
              Les retraits peuvent nécessiter une vérification en deux étapes
              (2FA) pour les montants importants.
            </p>

            <h3 className="text-lg font-medium">8.6 Dette de stockage</h3>
            <p>
              En cas de dette de stockage impayée, celle-ci est déduite en
              priorité sur le montant du retrait avant tout versement au
              vendeur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Livraison</h2>

            <h3 className="text-lg font-medium">9.1 Modes de livraison</h3>
            <p>Le vendeur peut choisir parmi les modes de service suivants :</p>
            <ul>
              <li>
                <strong>Service complet Pixel-Mart</strong> — le vendeur dépose
                ses produits à l'entrepôt Pixel-Mart, qui gère le stockage et la
                livraison.
              </li>
              <li>
                <strong>Livraison uniquement</strong> — Pixel-Mart gère la
                livraison, mais le vendeur conserve le stock chez lui.
              </li>
              <li>
                <strong>Indépendant</strong> — le vendeur gère entièrement sa
                logistique (stock et livraison).
              </li>
            </ul>

            <h3 className="text-lg font-medium">9.2 Frais de livraison</h3>
            <p>
              Les frais de livraison sont calculés automatiquement en fonction
              de la distance, du poids du colis et du type de livraison
              (standard, urgent, fragile). La grille tarifaire est configurable
              par l'administrateur.
            </p>

            <h3 className="text-lg font-medium">9.3 Lots de livraison</h3>
            <p>
              Le vendeur peut regrouper plusieurs commandes dans des lots de
              livraison (delivery batches) pour optimiser la logistique.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              10. Retours et remboursements
            </h2>

            <h3 className="text-lg font-medium">10.1 Délai de retour</h3>
            <p>
              Le client dispose d'un délai de <strong>48 heures</strong> à
              compter de la réception de sa commande pour demander un retour.
            </p>

            <h3 className="text-lg font-medium">10.2 Conditions</h3>
            <p>Les retours sont soumis aux conditions suivantes :</p>
            <ul>
              <li>
                Le produit doit être dans son état d'origine, non utilisé et
                dans son emballage d'origine.
              </li>
              <li>
                Le motif du retour doit être justifié : produit défectueux, non
                conforme à la description, endommagé pendant le transport, ou
                changement d'avis.
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

            <h3 className="text-lg font-medium">10.3 Exceptions</h3>
            <p>
              Les produits numériques ne sont ni repris ni remboursés une fois
              téléchargés.
            </p>

            <h3 className="text-lg font-medium">10.4 Workflow</h3>
            <p>Le processus de retour suit le workflow suivant :</p>
            <ul>
              <li>
                <strong>Demandé</strong> — le client soumet une demande.
              </li>
              <li>
                <strong>Approuvé</strong> — le vendeur accepte la demande.
              </li>
              <li>
                <strong>Reçu</strong> — le vendeur confirme la réception du
                retour.
              </li>
              <li>
                <strong>Remboursé</strong> — le remboursement est effectué.
              </li>
              <li>
                <strong>Rejeté</strong> — le vendeur refuse la demande (avec
                motif).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Entrepôt et stockage</h2>

            <h3 className="text-lg font-medium">
              11.1 Demande de mise en stock
            </h3>
            <p>
              Le vendeur peut déposer ses produits à l'entrepôt Pixel-Mart en
              créant une demande de stockage. Un code de stockage unique (format{" "}
              <code>PM-NNN</code>) est généré et doit être apposé sur le colis.
            </p>

            <h3 className="text-lg font-medium">
              11.2 Réception et validation
            </h3>
            <p>
              À la réception, un agent Pixel-Mart mesure et vérifie le contenu
              du colis. Un administrateur valide ensuite la demande et génère
              une facture de stockage.
            </p>

            <h3 className="text-lg font-medium">11.3 Tarifs de stockage</h3>
            <p>
              Les frais de stockage sont calculés en fonction du nombre d'unités
              et du poids des produits déposés. La grille tarifaire est
              communiquée lors de la demande de mise en stock.
            </p>

            <h3 className="text-lg font-medium">11.4 Modes de paiement</h3>
            <p>
              Le vendeur peut choisir parmi trois modes de paiement des frais de
              stockage :
            </p>
            <ul>
              <li>
                <strong>Immédiat</strong> — paiement direct lors de la
                validation.
              </li>
              <li>
                <strong>Prélèvement automatique</strong> — déduction automatique
                sur les ventes.
              </li>
              <li>
                <strong>Différé</strong> — accumulation en dette mensuelle,
                déduite lors du prochain retrait.
              </li>
            </ul>

            <h3 className="text-lg font-medium">11.5 Blocage</h3>
            <p>
              Un vendeur avec une facture impayée depuis plus de 30 jours ne
              peut pas retirer ses produits de l'entrepôt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              12. Publicité et espaces publicitaires
            </h2>
            <p>
              Les vendeurs peuvent réserver des espaces publicitaires sur la
              Plateforme pour mettre en avant leurs produits ou leur boutique.
            </p>
            <ul>
              <li>
                Les espaces sont listés dans le catalogue publicitaire avec des
                prix dynamiques basés sur la demande.
              </li>
              <li>
                La réservation est soumise à paiement préalable ou validation
                admin.
              </li>
              <li>
                Les métriques d'impressions et de clics sont suivies et
                accessibles depuis le tableau de bord.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              13. Propriété intellectuelle
            </h2>
            <p>
              L'ensemble des éléments de la Plateforme (marque Pixel-Mart, logo,
              design, code source) sont la propriété exclusive de Pixel-Mart.
            </p>
            <p>
              Le vendeur conserve la propriété intellectuelle de ses propres
              contenus (photos, descriptions, logo de boutique). En publiant du
              contenu sur la Plateforme, le vendeur accorde à Pixel-Mart une
              licence non exclusive d'utilisation dans le cadre du
              fonctionnement de la marketplace.
            </p>
            <p>
              Le vendeur garantit que ses contenus ne portent pas atteinte aux
              droits de tiers et s'engage à indemniser Pixel-Mart en cas de
              réclamation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              14. Suspension et résiliation
            </h2>

            <h3 className="text-lg font-medium">14.1 Motifs de suspension</h3>
            <p>
              Pixel-Mart peut suspendre ou bannir un compte vendeur en cas de :
            </p>
            <ul>
              <li>Violation des présentes CGV ou des CGU.</li>
              <li>
                Publication de produits illicites, contrefaits ou interdits.
              </li>
              <li>
                Publication de produits à caractère sexuel, pornographique ou
                adulte.
              </li>
              <li>Fraude ou tentative de fraude.</li>
              <li>Non-respect répété des délais de livraison.</li>
              <li>Facture de stockage impayée depuis plus de 30 jours.</li>
              <li>Signalements répétés de la part des clients.</li>
            </ul>

            <h3 className="text-lg font-medium">14.2 Conséquences</h3>
            <p>En cas de suspension ou de résiliation :</p>
            <ul>
              <li>Les produits du vendeur sont masqués de la marketplace.</li>
              <li>Les commandes en cours doivent être honorées.</li>
              <li>
                Le solde disponible du vendeur est conservé et peut être retiré
                selon les conditions habituelles, sous réserve de tout litige en
                cours.
              </li>
            </ul>

            <h3 className="text-lg font-medium">
              14.3 Résiliation par le vendeur
            </h3>
            <p>
              Le vendeur peut fermer sa boutique à tout moment depuis les
              paramètres de la boutique. Les commandes en cours doivent être
              honorées avant la fermeture effective.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              15. Limitation de responsabilité
            </h2>
            <p>
              Pixel-Mart s'engage à mettre en œuvre tous les moyens raisonnables
              pour assurer le bon fonctionnement de la Plateforme. Toutefois,
              Pixel-Mart ne saurait être tenu responsable :
            </p>
            <ul>
              <li>
                De la qualité, de la conformité ou de la légalité des produits
                vendus par le vendeur.
              </li>
              <li>
                Des litiges entre le vendeur et ses clients, bien que Pixel-Mart
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
            </ul>
            <p>
              Le vendeur est seul responsable de ses produits, de leur
              description, de leur prix et de leur conformité aux
              réglementations applicables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              16. Protection des données personnelles
            </h2>
            <p>
              La collecte et le traitement des données personnelles des vendeurs
              sont régis par notre{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Politique de confidentialité
              </a>
              , qui fait partie intégrante des présentes CGV.
            </p>
            <p>
              Le vendeur s'engage à respecter la législation applicable en
              matière de protection des données personnelles dans le cadre de
              son activité sur la Plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              17. Résolution des litiges
            </h2>
            <p>
              En cas de litige entre Pixel-Mart et un vendeur, les parties
              s'engagent à rechercher une solution amiable avant toute action
              judiciaire.
            </p>
            <p>
              À défaut de résolution amiable, tout litige relatif aux présentes
              CGV sera soumis à la compétence exclusive des tribunaux de{" "}
              <strong>Cotonou, Bénin</strong>, conformément au droit béninois.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">18. Modification des CGV</h2>
            <p>
              Pixel-Mart se réserve le droit de modifier les présentes CGV à
              tout moment. Les vendeurs seront informés des modifications
              substantielles par e-mail ou par notification sur la Plateforme.
              L'utilisation continue des services de vente après la publication
              des modifications constitue une acceptation des nouvelles CGV.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">19. Nous contacter</h2>
            <p>
              Pour toute question relative aux présentes CGV ou à l'activité de
              vendeur sur la Plateforme :
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
