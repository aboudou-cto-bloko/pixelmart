import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Pixel-Mart",
  description:
    "Découvrez comment Pixel-Mart collecte, utilise et protège vos données personnelles.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <h1 className="text-3xl font-bold tracking-tight">
            Politique de confidentialité
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : 4 avril 2026
          </p>

          <hr />

          <section>
            <h2 className="text-xl font-semibold">Introduction</h2>
            <p>
              Pixel-Mart (« nous », « notre », « la Plateforme ») s'engage à
              protéger la vie privée de ses utilisateurs. La présente politique
              de confidentialité explique quelles données personnelles nous
              collectons, pourquoi nous les collectons, comment nous les
              utilisons et quels sont vos droits.
            </p>
            <p>
              En utilisant Pixel-Mart, vous acceptez les pratiques décrites dans
              cette politique. Si vous n'acceptez pas ces conditions, veuillez
              ne pas utiliser nos services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              1. Données personnelles que nous collectons
            </h2>

            <h3 className="text-lg font-medium">1.1 Données d'identité</h3>
            <ul>
              <li>
                <strong>Nom complet</strong> — collecté lors de l'inscription,
                de la commande en tant qu'invité, ou de l'inscription à la liste
                d'attente.
              </li>
              <li>
                <strong>Adresse e-mail</strong> — collectée lors de
                l'inscription, de la connexion, de la réinitialisation du mot de
                passe, de la commande invitée, de l'inscription à la newsletter
                et de la liste d'attente.
              </li>
              <li>
                <strong>Photo de profil</strong> — téléchargée par l'utilisateur
                ou importée via le service d'authentification.
              </li>
            </ul>

            <h3 className="text-lg font-medium">1.2 Données de contact</h3>
            <ul>
              <li>
                <strong>Numéro de téléphone</strong> — renseigné de manière
                optionnelle dans les paramètres du profil (format
                international).
              </li>
              <li>
                <strong>Adresse de livraison</strong> — collectée lors du
                paiement : nom complet, adresse (ligne 1, ligne 2), ville, code
                postal, pays, téléphone.
              </li>
              <li>
                <strong>Coordonnées géographiques</strong> — latitude et
                longitude de l'adresse de livraison, obtenues via le sélecteur
                d'adresse OpenStreetMap lors du paiement.
              </li>
              <li>
                <strong>Contacts de la boutique</strong> (vendeurs) — téléphone,
                WhatsApp, e-mail, site web, Facebook, Instagram — renseignés
                dans les paramètres de la boutique.
              </li>
            </ul>

            <h3 className="text-lg font-medium">1.3 Données financières</h3>
            <ul>
              <li>
                <strong>Solde vendeur</strong> — calculé automatiquement par la
                plateforme à partir des transactions.
              </li>
              <li>
                <strong>Détails de retrait</strong> — nom du titulaire du
                compte, numéro de compte (masqué), code banque, numéro de
                téléphone — transmis lors d'une demande de retrait via notre
                partenaire de paiement Moneroo.
              </li>
              <li>
                <strong>Méthode de paiement</strong> — MTN Mobile Money, Orange
                Money, Wave, Flooz, Visa, Mastercard — sélectionnée lors du
                paiement.
              </li>
              <li>
                <strong>Historique des transactions</strong> — journal financier
                immuable de toutes les opérations (ventes, remboursements,
                retraits, frais).
              </li>
            </ul>

            <h3 className="text-lg font-medium">1.4 Données de localisation</h3>
            <ul>
              <li>
                <strong>Pays de la boutique</strong> — renseigné lors de
                l'inscription vendeur.
              </li>
              <li>
                <strong>Point de collecte personnalisé</strong> — coordonnées
                GPS et adresse du point de retrait (vendeurs en mode « livraison
                uniquement »).
              </li>
              <li>
                <strong>Distance de livraison</strong> — calculée
                automatiquement entre le point de collecte et l'adresse du
                client.
              </li>
            </ul>

            <h3 className="text-lg font-medium">
              1.5 Contenu généré par les utilisateurs
            </h3>
            <ul>
              <li>
                <strong>Avis produits</strong> — note, titre, commentaire,
                photos — publiés sur les pages produits.
              </li>
              <li>
                <strong>Questions et réponses</strong> — échangées entre clients
                et vendeurs sur les pages produits.
              </li>
              <li>
                <strong>Notes de commande</strong> — instructions de livraison
                ou demandes spéciales lors du paiement.
              </li>
              <li>
                <strong>Demandes de retour</strong> — motif et catégorie de
                raison pour les retours produits.
              </li>
              <li>
                <strong>Messages</strong> — échangés entre clients et vendeurs
                via la messagerie interne.
              </li>
              <li>
                <strong>Contenu des boutiques</strong> — descriptions de
                boutique, fiches produits, images, spécifications techniques.
              </li>
            </ul>

            <h3 className="text-lg font-medium">
              1.6 Données de navigation et préférences
            </h3>
            <ul>
              <li>
                <strong>Historique des commandes</strong> — toutes les commandes
                passées sur la plateforme.
              </li>
              <li>
                <strong>Liste de souhaits (wishlist)</strong> — produits ajoutés
                aux favoris par l'utilisateur.
              </li>
              <li>
                <strong>Préférence de langue</strong> — français ou anglais,
                définie à la création du compte.
              </li>
              <li>
                <strong>Panier d'achat</strong> — articles ajoutés au panier,
                stockés localement dans le navigateur.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              2. Comment nous utilisons vos données
            </h2>
            <p>Nous utilisons vos données personnelles pour :</p>
            <ul>
              <li>
                <strong>Exécution du contrat</strong> — créer et gérer votre
                compte, traiter vos commandes, effectuer les livraisons, gérer
                les paiements et les remboursements.
              </li>
              <li>
                <strong>Communication transactionnelle</strong> — vous envoyer
                des confirmations de commande, des notifications de statut de
                commande, des alertes de stock, des reçus et factures.
              </li>
              <li>
                <strong>Service client</strong> — répondre à vos questions,
                traiter vos retours et réclamations, fournir une assistance via
                notre messagerie interne et notre chat en direct.
              </li>
              <li>
                <strong>Amélioration de la plateforme</strong> — analyser
                l'utilisation de nos services, améliorer nos fonctionnalités et
                l'expérience utilisateur.
              </li>
              <li>
                <strong>Marketing (avec votre consentement)</strong> — vous
                envoyer des newsletters et des offres promotionnelles si vous
                vous y êtes abonné.
              </li>
              <li>
                <strong>Sécurité et conformité</strong> — prévenir la fraude,
                respecter nos obligations légales et réglementaires.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Partage de vos données</h2>
            <p>
              Nous ne vendons jamais vos données personnelles. Nous pouvons
              partager vos données avec les tiers suivants :
            </p>

            <h3 className="text-lg font-medium">3.1 Partenaires de paiement</h3>
            <p>
              Notre prestataire de paiement traite les transactions Mobile Money
              (MTN, Orange Money, Wave, Flooz) et les retraits vendeurs. Nous
              lui transmettons votre e-mail, le montant de la transaction,
              l'identifiant de commande et, pour les retraits, les détails de
              votre compte (nom, numéro masqué, téléphone).
            </p>

            <h3 className="text-lg font-medium">
              3.2 Service d'envoi d'e-mails
            </h3>
            <p>
              Notre prestataire d'e-mails délivre nos communications
              transactionnelles (confirmations de commande, notifications de
              statut, etc.). Nous lui transmettons votre e-mail, votre nom et le
              contenu de l'e-mail (détails de commande, noms de produits, prix,
              adresses).
            </p>

            <h3 className="text-lg font-medium">3.3 Géocodage d'adresses</h3>
            <p>
              Notre service de cartographie fournit l'autocomplétion d'adresses
              et le géocodage lors du paiement. Les requêtes d'adresse et les
              coordonnées sont envoyées à leurs serveurs.
            </p>

            <h3 className="text-lg font-medium">
              3.4 Hébergement et infrastructure
            </h3>
            <p>
              Nos prestataires d'hébergement et d'infrastructure cloud stockent
              notre base de données, notre backend et les fichiers uploadés
              (images produits, logos, photos d'avis). Toutes les données
              listées dans la section 1 y sont stockées.
            </p>
            <p>
              Notre fournisseur d'hébergement web et de CDN peut collecter votre
              adresse IP, les en-têtes de requête et les journaux serveur.
            </p>

            <h3 className="text-lg font-medium">3.5 Notifications push</h3>
            <p>
              Les services de notification push de votre navigateur délivrent
              nos notifications. Nous transmettons les identifiants de
              subscription et le contenu de la notification (titre, corps, URL).
            </p>

            <h3 className="text-lg font-medium">3.6 Support en direct</h3>
            <p>
              Notre prestataire de chat en direct, présent sur toutes les pages,
              reçoit les messages échangés et les informations du navigateur.
            </p>

            <h3 className="text-lg font-medium">
              3.7 Pixels publicitaires (vendeurs uniquement)
            </h3>
            <p>
              Les vendeurs peuvent configurer leur propre pixel de suivi
              publicitaire sur leur boutique. Dans ce cas, le vendeur est
              responsable des données collectées via son pixel. Pixel-Mart n'est
              pas responsable du traitement des données par les plateformes
              publicitaires dans ce contexte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              4. Durée de conservation des données
            </h2>
            <ul>
              <li>
                <strong>Comptes utilisateurs</strong> — conservés tant que le
                compte est actif. En cas de suppression, les données sont
                désactivées sous 30 jours, à l'exception des données financières
                soumises à des obligations légales de conservation.
              </li>
              <li>
                <strong>Données financières</strong> (transactions, commandes,
                retraits) — conservées conformément aux obligations légales en
                vigueur au Bénin (5 à 10 ans). Ces données sont immuables par
                conception.
              </li>
              <li>
                <strong>Abonnés newsletter</strong> — conservés jusqu'à
                désabonnement.
              </li>
              <li>
                <strong>Notifications push</strong> — conservées jusqu'à
                expiration ou désabonnement.
              </li>
              <li>
                <strong>Journal d'audit</strong> — conservé indéfiniment à des
                fins de sécurité et de conformité.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et
              organisationnelles appropriées pour protéger vos données
              personnelles contre tout accès non autorisé, toute perte ou
              altération.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Vos droits</h2>
            <p>
              Conformément à la loi n° 2017-20 du 20 avril 2017 portant
              protection des données à caractère personnel en République du
              Bénin, vous disposez des droits suivants :
            </p>
            <ul>
              <li>
                <strong>Droit d'accès</strong> — obtenir une copie de vos
                données personnelles que nous détenons.
              </li>
              <li>
                <strong>Droit de rectification</strong> — corriger des données
                inexactes ou incomplètes.
              </li>
              <li>
                <strong>Droit à l'effacement</strong> — demander la suppression
                de vos données, sous réserve des obligations légales de
                conservation.
              </li>
              <li>
                <strong>Droit à la portabilité</strong> — recevoir vos données
                dans un format structuré et lisible.
              </li>
              <li>
                <strong>Droit d'opposition</strong> — vous opposer au traitement
                de vos données à des fins de marketing direct.
              </li>
              <li>
                <strong>Droit de limitation</strong> — demander la limitation du
                traitement de vos données dans certaines circonstances.
              </li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à{" "}
              <a
                href="mailto:contact@pixel-mart-bj.com"
                className="text-primary hover:underline"
              >
                contact@pixel-mart-bj.com
              </a>
              .
            </p>
            <p>
              Vous avez également le droit de déposer une plainte auprès de
              l'Autorité de Protection des Données à Caractère Personnel (APDP)
              du Bénin.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              7. Transferts de données hors du Bénin
            </h2>
            <p>
              Certaines de vos données peuvent être transférées et stockées en
              dehors du Bénin, notamment aux États-Unis (Convex, Resend, Vercel)
              et via les réseaux de distribution de contenu (CDN). Nous prenons
              les mesures appropriées pour garantir que vos données soient
              protégées conformément à cette politique et à la législation
              applicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              8. Modifications de cette politique
            </h2>
            <p>
              Nous pouvons modifier cette politique de confidentialité à tout
              moment. Toute modification sera publiée sur cette page avec une
              date de mise à jour révisée. Nous vous encourageons à consulter
              régulièrement cette page pour rester informé de la manière dont
              nous protégeons vos données.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Nous contacter</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité
              ou le traitement de vos données personnelles :
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
