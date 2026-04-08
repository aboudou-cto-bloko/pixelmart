# Tutoriel complet — Pixel-Mart

Pixel-Mart est une marketplace multi-vendeurs dédiée à l'Afrique de l'Ouest (Bénin en priorité). Ce tutoriel couvre les trois profils d'utilisateurs : **client**, **vendeur** et **administrateur**.

---

## Table des matières

1. [Créer un compte et se connecter](#1-créer-un-compte-et-se-connecter)
2. [Interface client — Acheter sur Pixel-Mart](#2-interface-client--acheter-sur-pixel-mart)
3. [Interface vendeur — Gérer sa boutique](#3-interface-vendeur--gérer-sa-boutique)
4. [Module finances — Revenus et retraits](#4-module-finances--revenus-et-retraits)
5. [Module stockage — Service entrepôt](#5-module-stockage--service-entrepôt)
6. [Interface admin — Administrer la plateforme](#6-interface-admin--administrer-la-plateforme)
7. [Notifications et préférences](#7-notifications-et-préférences)

---

## 1. Créer un compte et se connecter

### 1.1 Inscription

1. Accédez à `/register`.
2. Renseignez votre **nom complet**, **email**, et **mot de passe**.
   - Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
3. Cliquez sur **S'inscrire**.
4. Un email de vérification est envoyé. Cliquez sur le lien dans l'email pour activer votre compte.
5. Vous êtes automatiquement connecté après vérification.

### 1.2 Connexion

1. Accédez à `/login`.
2. Entrez votre email et mot de passe.
3. Après 5 tentatives échouées, le compte est verrouillé pendant 30 minutes.

### 1.3 Mot de passe oublié

1. Sur la page de connexion, cliquez sur **Mot de passe oublié ?**
2. Entrez votre email — un lien de réinitialisation valable **30 minutes** est envoyé.
3. Cliquez sur le lien reçu et définissez un nouveau mot de passe.

### 1.4 Authentification à deux facteurs (2FA)

Activez la 2FA depuis **Paramètres → Sécurité** pour sécuriser votre compte. Elle est **obligatoire** pour effectuer des retraits financiers.

1. Cliquez sur **Activer la 2FA**.
2. Scannez le QR code avec une app authenticator (Google Authenticator, Authy…).
3. Entrez le code de confirmation.

---

## 2. Interface client — Acheter sur Pixel-Mart

### 2.1 Parcourir les produits

- **Page d'accueil (`/`)** : affiche les produits tendance, les meilleures ventes, les deals de la semaine et les promotions.
- **Catalogue (`/products`)** : filtrez par catégorie, fourchette de prix ou note. Utilisez la barre de recherche pour trouver un produit par nom.
- **Catégories (`/categories`)** : naviguez dans l'arborescence (2 niveaux max).
- **Boutiques (`/stores`)** : parcourez les boutiques des vendeurs. Chaque boutique a sa propre page `/shop/[slug]`.

### 2.2 Page produit

La page d'un produit affiche :
- Un **carrousel d'images** — cliquez pour zoomer.
- La **description** riche (HTML).
- Les **spécifications techniques** (matière, garantie…).
- Le **sélecteur de variantes** (taille, couleur) — le prix et le stock s'adaptent à la variante choisie.
- La section **Questions & Réponses** — posez une question publique au vendeur.
- Les **avis clients** avec notes et photos.
- Les **produits similaires**.

### 2.3 Ajouter au panier et à la liste de souhaits

- Cliquez sur **Ajouter au panier** — le compteur dans la barre de navigation se met à jour.
- Cliquez sur l'icône cœur pour ajouter à votre **liste de souhaits** (accessible depuis votre profil).
- Le panier est persisté localement — il survit à la fermeture du navigateur.

### 2.4 Passer une commande (checkout en 3 étapes)

**Étape 1 — Adresse de livraison**

1. Saisissez une adresse dans le champ de recherche (auto-complétion Nominatim/OpenStreetMap, restreinte au Bénin).
2. Ou utilisez le **bouton carte** pour placer un marqueur sur la carte interactive (Leaflet).
3. Ajoutez un complément d'adresse si nécessaire.

**Étape 2 — Mode de livraison**

1. Choisissez le type de livraison :
   - **Standard** — délai normal, tarif de base.
   - **Urgent** — livraison rapide, supplément.
   - **Fragile** — conditionnement spécial, supplément.
2. Les frais de livraison sont calculés en temps réel selon la **distance** (Haversine) et le **poids** total du panier.
3. Entrez un **code promo** si vous en avez un.

**Étape 3 — Paiement**

Deux options :
- **Paiement en ligne** via Moneroo : Mobile Money (MTN, Orange Money, Wave, Flooz) ou virement bancaire.
- **Paiement à la livraison (Cash on Delivery)** : réglé en espèces à la réception.

Après confirmation, vous recevez un email de confirmation avec votre numéro de commande.

### 2.5 Suivre ses commandes

1. Accédez à **Mes commandes** (`/orders`).
2. Cliquez sur une commande pour voir son **historique d'événements** (timeline) : commande reçue, en traitement, expédiée, livrée.
3. Vous recevez des notifications (email + in-app) à chaque changement de statut.

### 2.6 Retourner un article

1. Depuis la page de détail commande, cliquez sur **Demander un retour**.
2. Sélectionnez le(s) article(s) concerné(s) et le motif du retour.
3. Le vendeur approuve ou refuse la demande.
4. En cas d'approbation, renvoyez l'article et le remboursement sera émis.

---

## 3. Interface vendeur — Gérer sa boutique

### 3.1 Accéder au tableau de bord vendeur

Connectez-vous avec un compte vendeur. Vous êtes redirigé vers `/vendor`. Si vous possédez plusieurs boutiques, un sélecteur apparaît pour choisir la boutique active.

### 3.2 Tableau de bord principal

La page d'accueil vendeur affiche :
- **KPIs** : commandes du jour, revenu du mois, solde disponible.
- **Progression de l'onboarding** : checklist pour compléter votre boutique.
- **Commandes récentes** à traiter en priorité.

### 3.3 Gérer les produits

#### Créer un produit

1. Allez dans **Produits → Nouveau produit**.
2. Renseignez :
   - **Titre** et **description** (éditeur de texte riche TipTap avec insertion d'images).
   - **Prix de vente** et **prix barré** (optionnel pour afficher une promotion).
   - **Coût d'achat** (pour vos calculs de marge, non visible par les clients).
   - **Catégorie** (2 niveaux).
   - **Images** : glissez-déposez ou cliquez pour uploader (plusieurs images supportées).
   - **Inventaire** : quantité en stock.
   - **Poids** (en grammes) — utilisé pour le calcul des frais de livraison.
3. Cliquez sur **Enregistrer** (brouillon) ou **Publier**.

#### Ajouter des variantes

1. Dans l'éditeur produit, cliquez sur **Ajouter une variante**.
2. Définissez les attributs (ex. : Taille = S/M/L, Couleur = Rouge/Bleu).
3. Chaque variante peut avoir son propre **prix** et son propre **stock**.

#### Ajouter des spécifications

Dans l'onglet **Spécifications**, ajoutez des paires clé-valeur (ex. : `Matière: Coton`, `Garantie: 12 mois`). Ces informations apparaissent dans un tableau sur la page produit.

#### Import CSV en masse

1. Allez dans **Produits → Importer**.
2. Téléchargez le modèle CSV.
3. Remplissez le fichier avec vos produits et importez-le.

### 3.4 Gérer les commandes

**Liste des commandes (`/vendor/orders`)** : filtrez par statut (en attente, en traitement, expédiée, livrée, annulée).

**Cycle de vie d'une commande :**

| Statut | Action vendeur |
|--------|----------------|
| `pending` | Attendre le paiement (auto-expiré en 2h) |
| `paid` | Confirmer la réception → passer en `processing` |
| `processing` | Préparer et expédier → passer en `shipped` |
| `shipped` | Fournir le numéro de suivi |
| `delivered` | Automatique après confirmation client ou +7 jours |

Pour chaque commande, vous pouvez voir les **informations client**, les **articles commandés**, les **frais de livraison** et la **commission Pixel-Mart** prélevée.

#### Créer un lot de livraison

1. Sélectionnez plusieurs commandes à expédier ensemble.
2. Cliquez sur **Créer un lot**.
3. Le système groupe les commandes par zone géographique.
4. Exportez le **PDF récapitulatif** à remettre au livreur.

### 3.5 Gérer les retours

1. Accédez à **Commandes → Retours**.
2. Pour chaque demande de retour : lisez le motif, approuvez ou refusez.
3. En cas d'approbation et réception de l'article, déclenchez le remboursement.

### 3.6 Créer des codes promo

1. Allez dans **Promotions → Nouveau coupon**.
2. Configurez :
   - **Code** (ex. : `PROMO20`).
   - **Type** : pourcentage, montant fixe ou livraison gratuite.
   - **Contraintes** : montant minimum, nombre d'utilisations max, date d'expiration.
3. Activez/désactivez le coupon à tout moment.

### 3.7 Répondre aux avis et questions

- **Avis (`/vendor/reviews`)** : lisez les avis clients et répondez publiquement.
- **Questions produits** : les questions apparaissent sur la page produit. Répondez depuis l'éditeur produit ou directement via la liste des questions.

### 3.8 Gérer les publicités

1. Accédez à **Publicités → Réserver un espace**.
2. Choisissez l'emplacement souhaité :
   - **Hero banner** — bandeau principal de la page d'accueil.
   - **Banner** — bannière secondaire.
   - **Spotlight** — mise en avant produit.
3. Sélectionnez les dates et le contenu (produit, boutique ou visuel personnalisé).
4. Le prix est calculé dynamiquement selon la **demande** (multiplicateur sur le tarif de base).
5. Validez et payez via Moneroo.

### 3.9 Personnaliser sa boutique

#### Identité (`/vendor/store/settings`)
- Nom de la boutique, description, logo, bannière.
- Liens réseaux sociaux.
- Visibilité (publique / privée).

#### Thème (`/vendor/store/theme`)
Choisissez parmi 5 thèmes visuels : **Default**, **Modern**, **Classic**, **Royal**, **Nature**. Chaque thème propose un mode clair ou sombre.

#### Meta Pixel (`/vendor/store/meta`)
Configurez votre **Meta Pixel ID** et **access token** pour suivre les conversions sur votre boutique via la Conversions API (événements : vue produit, ajout panier, achat).

### 3.10 Analytics

Accédez à **Analytics (`/vendor/analytics`)** pour visualiser :
- **GMV** (Volume de marchandises vendu) sur 1j / 7j / 30j / 90j / 12 mois.
- **Volume de commandes** et **taux de conversion**.
- **Panier moyen (AOV)**.

---

## 4. Module finances — Revenus et retraits

### 4.1 Comprendre son solde

| Solde | Description |
|-------|-------------|
| **Solde disponible** | Fonds immédiatement retirables |
| **Solde en attente** | Fonds libérés 48h après livraison confirmée |

La commission Pixel-Mart est déduite automatiquement à la création de la commande.

### 4.2 Demander un retrait (payout)

1. Accédez à **Finances → Retraits**.
2. Cliquez sur **Demander un retrait**.
3. Entrez le montant souhaité (minimum **655 XOF**).
4. **Confirmez avec votre code 2FA** (obligatoire).
5. Le retrait passe en statut `pending`, puis `processing` (envoyé via Moneroo) et enfin `completed`.

> **Important** : si vous avez des dettes de stockage impayées depuis plus de 30 jours, elles sont déduites automatiquement du montant avant versement.

### 4.3 Historique des transactions

**Finances → Transactions** : consultez chaque mouvement (vente, commission, remboursement, retrait, frais de stockage) avec sa date, son montant et son type.

### 4.4 Factures

**Finances → Factures** : téléchargez les factures générées pour les frais de stockage et les transactions significatives.

---

## 5. Module stockage — Service entrepôt

Pixel-Mart propose un service d'entrepôt : stockez vos produits dans les locaux de la plateforme.

### 5.1 Créer une demande de dépôt

1. Accédez à **Stockage → Nouvelle demande**.
2. Sélectionnez les produits à déposer et les quantités.
3. Une **demande** est créée avec un code unique (format `PM-XXX`).
4. Déposez physiquement vos articles à l'entrepôt en communiquant ce code à l'agent.

### 5.2 Suivi de la demande

| Statut | Signification |
|--------|---------------|
| `pending` | Demande créée, dépôt non encore reçu |
| `received` | Agent a reçu et mesuré les articles |
| `in_stock` | Admin a validé, articles en stock, facture générée |
| `rejected` | Admin a refusé la demande (motif communiqué) |

### 5.3 Facturation du stockage

Après validation, une **facture de stockage** est générée. Trois modes de paiement :
- **Immédiat** — déducted directement du solde.
- **Auto-débit** — déduit automatiquement des prochains paiements.
- **Différé** — remboursé lors du prochain retrait.

> Les dettes de stockage impayées depuis plus de 30 jours bloquent les retraits.

### 5.4 Retirer des articles de l'entrepôt

1. Accédez à **Stockage → Retraits**.
2. Créez une demande de retrait en spécifiant les articles et quantités souhaités.
3. L'admin traite la demande et les articles vous sont retournés.

---

## 6. Interface admin — Administrer la plateforme

### 6.1 Tableau de bord admin

Accédez au tableau de bord depuis `/admin`. Vous y trouvez :
- KPIs globaux de la plateforme (GMV, commandes, utilisateurs actifs).
- Retraits en attente d'approbation.
- Boutiques récemment inscrites.

### 6.2 Gestion des utilisateurs

**Admin → Utilisateurs** :
- Recherchez un utilisateur par nom ou email.
- Consultez son profil (historique des commandes, solde, rôle).
- **Bannissez** un compte abusif (réversible).
- Modifiez le rôle d'un utilisateur.

### 6.3 Gestion des boutiques

**Admin → Boutiques** :
- **Vérifiez** et approuvez les nouvelles boutiques.
- **Suspendez** une boutique en infraction.
- Modifiez le **taux de commission** par tier.

### 6.4 Gestion des catégories

**Admin → Catégories** :
- Créez, renommez et réorganisez les catégories (max 2 niveaux).
- Définissez l'ordre d'affichage dans le menu.

### 6.5 Approbation des retraits

**Admin → Retraits** :
- Consultez la file d'attente des retraits vendeurs en statut `pending`.
- **Approuvez** : Moneroo est appelé automatiquement.
- **Refusez** avec un motif.

### 6.6 Gestion du stockage

**Admin → Stockage** :
- Consultez les demandes de dépôt reçues par les agents.
- **Validez** une demande : entrez les mesures officielles et le tarif applicable → facture créée automatiquement.
- **Refusez** avec un motif.
- Suivez les dettes impayées.

### 6.7 Tarifs de livraison

**Admin → Tarifs livraison** :
- Définissez des tranches de distance (km) avec leur tarif (XOF).
- Configurez les suppléments de poids, les tarifs de nuit et les majorations par type de livraison.

### 6.8 Configuration de la plateforme

**Admin → Configuration** :
- Modifiez les constantes de la plateforme : taux de commission par défaut, délais, seuils.
- Toute modification est enregistrée dans le journal d'audit (`platform_events`).

---

## 7. Notifications et préférences

### 7.1 Centre de notifications in-app

Cliquez sur la cloche dans la barre de navigation pour accéder à vos notifications. Les notifications couvrent :
- Changements de statut de commande.
- Nouveaux avis et questions.
- Alertes de stock bas.
- Dettes de stockage.
- Confirmation de retrait.

### 7.2 Notifications push (navigateur)

1. Accédez à **Paramètres → Notifications**.
2. Cliquez sur **Activer les notifications push**.
3. Acceptez la permission dans le navigateur.
4. Vous recevrez désormais des notifications même si l'onglet est fermé.

> Les notifications push sont gérées par un Service Worker. Si vous changez de navigateur ou d'appareil, réactivez-les.

### 7.3 Emails transactionnels

Tous les événements importants déclenchent un email (via Resend) :
- Confirmation de commande.
- Expédition et livraison.
- Remboursement.
- Validation / rejet d'une demande de stockage.
- Retrait confirmé.

---

*Document généré le 04/04/2026 — Pixel-Mart v1.0*
