# Guide Plateforme Pixel-Mart

> Référence complète pour la création de tutoriels et la prise en main de la plateforme.
> Couvre tous les rôles : Client, Vendeur, Agent d'entrepôt, Admin.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Authentification](#2-authentification)
3. [Marketplace publique — Parcours client](#3-marketplace-publique--parcours-client)
4. [Dashboard vendeur](#4-dashboard-vendeur)
5. [Boutique personnalisée (Vendor Shop)](#5-boutique-personnalisée-vendor-shop)
6. [Système de paiement & finances](#6-système-de-paiement--finances)
7. [Service Stockage Entrepôt](#7-service-stockage-entrepôt)
8. [Service Publicités](#8-service-publicités)
9. [Analytics avancés](#9-analytics-avancés)
10. [Agent d'entrepôt](#10-agent-dentrepôt)
11. [Statuts & cycles de vie](#11-statuts--cycles-de-vie)
12. [Récapitulatif des routes](#12-récapitulatif-des-routes)

---

## 1. Vue d'ensemble

**Pixel-Mart** est une marketplace multi-vendeurs pour l'Afrique de l'Ouest. Elle permet à des vendeurs indépendants de créer et gérer leur boutique en ligne, et à des clients d'acheter via Mobile Money ou carte bancaire.

### Rôles utilisateur

| Rôle | Accès | Description |
|------|-------|-------------|
| `customer` | `/`, `/products`, `/orders`, `/cart` | Acheteur sur la marketplace |
| `vendor` | `/vendor/*`, `/shop/[slug]/*` | Vendeur avec dashboard complet |
| `agent` | `/agent` | Opérateur de réception en entrepôt |
| `admin` | `/admin/*` | Gestion globale de la plateforme |

### Devise & paiements

- Devise principale : **XOF (Franc CFA)**
- Paiements acceptés : Mobile Money (MTN, Orange, Wave, Moov, Wizall) + Carte bancaire (Stripe)
- Tous les montants sont stockés en **centimes XOF** (1 000 FCFA = 1 000 centimes dans le système)

### Services disponibles

| Service | Pour qui | Route |
|---------|----------|-------|
| Marketplace | Clients & vendeurs | `/products`, `/stores` |
| Dashboard vendeur | Vendeurs | `/vendor/*` |
| Boutique personnalisée | Vendeurs | `/shop/[slug]` |
| Stockage entrepôt | Vendeurs | `/vendor/storage` |
| Publicités | Vendeurs | `/vendor/ads` |
| Analytics | Vendeurs | `/vendor/analytics` |
| Coupons & promos | Vendeurs | `/vendor/coupons` |
| Livraisons groupées | Vendeurs | `/vendor/delivery` |
| Finance & virements | Vendeurs | `/vendor/finance` |

---

## 2. Authentification

### 2.1 Inscription client

**Route :** `/register`

1. Renseigner nom complet, email, mot de passe
2. Indicateur de force du mot de passe en temps réel
3. Validation email (lien envoyé par Resend)
4. Après vérification → redirection vers la marketplace

### 2.2 Inscription vendeur

**Route :** `/register` puis `/onboarding/vendor`

L'inscription vendeur se fait en deux temps : créer un compte, puis compléter l'onboarding boutique.

**Étape 1 — Compte** (identique au client)

**Étape 2 — Onboarding boutique** (`/onboarding/vendor`)

| Étape | Champs |
|-------|--------|
| 1 — Boutique | Nom, description |
| 2 — Localisation | Pays, zone géographique |
| 3 — Livraison | Entrepôt Pixel-Mart ou adresse de retrait personnalisée (carte interactive) |
| 4 — Contact | Téléphone, email, réseaux sociaux |

Une fois l'onboarding terminé, la boutique est créée et le vendeur est redirigé vers `/vendor/dashboard`.

### 2.3 Connexion & session

**Route :** `/login`

- Authentification email/mot de passe via Better Auth
- Session persistante (cookie HTTP-only)
- Vendeur multi-boutique → redirection vers `/vendor/select-store` pour choisir la boutique active

### 2.4 Mot de passe oublié

1. `/forgot-password` → saisir email
2. Email de réinitialisation envoyé
3. Lien → `/reset-password` → nouveau mot de passe

---

## 3. Marketplace publique — Parcours client

### 3.1 Navigation & recherche

**Route :** `/products`

**Filtres disponibles :**

| Paramètre URL | Valeurs | Exemple |
|---------------|---------|---------|
| `q` | Texte libre | `?q=smartphone` |
| `category` | Slug catégorie | `?category=electronique` |
| `min_price` | Entier (centimes) | `?min_price=5000` |
| `max_price` | Entier (centimes) | `?max_price=100000` |
| `in_stock` | `true` | `?in_stock=true` |
| `sort` | `relevance` \| `newest` \| `price_asc` \| `price_desc` | `?sort=newest` |

**Catégories disponibles** (accès via `/categories/[slug]`) :
- `electronique` — Smartphones, tablettes, accessoires
- `mode` — Vêtements, chaussures, accessoires de mode
- `maison-deco` — Mobilier, décoration, cuisine
- `beaute-sante` — Cosmétiques, soins, bien-être
- `alimentation` — Épicerie, boissons, produits locaux
- `sport` — Équipements sportifs, fitness

### 3.2 Page produit

**Route :** `/products/[slug]`

**Ce que le client voit :**
- Galerie d'images (slider)
- Prix, prix barré (si promotion), économie réalisée
- Description complète
- Note moyenne et nombre d'avis
- Sélecteur de variantes (couleur, taille, etc.)
- Indicateur de stock disponible
- Fiche vendeur (nom boutique, badge "Vérifié", note)
- Section Questions & Réponses

**Actions :**
- Ajouter au panier
- Poser une question (visible de tous)

### 3.3 Panier

**Route :** `/cart`

- Articles regroupés **par boutique** (une commande sera créée par boutique)
- Modification des quantités (±)
- Suppression d'un article
- Persistance locale (localStorage)
- Bouton "Procéder au paiement" → `/checkout`

### 3.4 Checkout

**Route :** `/checkout`

Le checkout crée une commande distincte pour chaque boutique du panier.

**Pour chaque boutique, le client renseigne :**

1. **Adresse de livraison**
   - Prénom, nom, adresse ligne 1, ligne 2
   - Ville, code postal, pays
   - Téléphone

2. **Mode de livraison**
   - Standard — délai normal
   - Urgent — livraison express
   - Fragile — emballage renforcé
   - *(Le frais de livraison est calculé automatiquement selon la distance et le poids)*

3. **Code promo** (optionnel)
   - Réduction en % ou montant fixe
   - Livraison gratuite
   - Validation du montant minimum

4. **Note** pour le vendeur (optionnel)

5. **Résumé de commande**
   - Sous-total, frais livraison, réduction, **total à payer**

6. **Choix du mode de paiement** → Mobile Money ou Carte

**Règle importante :** une commande = un vendeur. Si le panier contient 3 boutiques, 3 commandes sont créées et payées en une seule transaction.

### 3.5 Paiement

Après confirmation, le client est redirigé vers le fournisseur de paiement :

- **Mobile Money** (via Moneroo) → Page Moneroo → OTP téléphone → Confirmation
- **Carte bancaire** (via Stripe) → Stripe Hosted Checkout → Confirmation

Après paiement réussi :
- Webhook reçu par Pixel-Mart
- Commande(s) passées au statut `paid`
- Email de confirmation envoyé au client et au vendeur
- Redirection vers `/checkout/confirmation`

### 3.6 Suivi des commandes

**Route :** `/orders`

**Filtres par statut :**
- Toutes, En attente, Payées, En traitement, Expédiées, Livrées, Annulées, Remboursées

**Chaque ligne affiche :** numéro de commande (PM-AAAA-XXXX), boutique, date, statut, montant.

**Détail commande** — `/orders/[id]` :
- Timeline complète des événements
- Adresse et mode de livraison
- Articles commandés avec images
- Récapitulatif des montants
- Numéro de suivi & transporteur (si expédiée)
- Actions : télécharger facture, contacter le vendeur, demander un retour

### 3.7 Avis

Après livraison d'une commande, le client peut laisser un avis sur chaque produit :
- Note 1 à 5 étoiles
- Titre (optionnel) et commentaire
- Photos (max 5)
- L'avis est lié à la commande (achat vérifié automatiquement)
- Le vendeur peut répondre

### 3.8 Retours & remboursements

**Route :** `/orders/[id]/return`

**Raisons disponibles :**
- Produit défectueux
- Article non conforme à la description
- Mauvais article reçu
- Endommagé pendant le transport
- Changement d'avis

**Cycle :**
`requested` → `approved` (vendeur) → `received` (agent) → `refunded`

---

## 4. Dashboard vendeur

### 4.1 Vue d'ensemble — `/vendor/dashboard`

**KPI en temps réel :**

| Carte | Contenu |
|-------|---------|
| Revenu ce mois | Montant total des ventes payées du mois en cours |
| Commandes | Total commandes + nombre en cours de traitement |
| Produits actifs | Catalogue publié + alertes rupture de stock |
| Solde disponible | Balance utilisable + montant en attente de déblocage (48h) |

**Alertes automatiques :**
- Commandes payées non traitées (badge orange)
- Produits en stock faible (< seuil configuré)

**Graphiques :**
- Revenus des 7 derniers jours (barres)
- 5 dernières commandes (tableau)
- Top produits vendus

---

### 4.2 Catalogue produits — `/vendor/products`

#### Créer un produit — `/vendor/products/new`

**Champs obligatoires :**
- Titre
- Description (éditeur HTML riche)
- Catégorie
- Prix
- Au moins 1 image

**Champs optionnels :**

| Champ | Description |
|-------|-------------|
| Prix barré | Affiche une réduction visuelle |
| Prix coût | Calcule la marge automatiquement |
| Variantes | Plusieurs combinaisons (couleur + taille) avec prix et stock par variante |
| Spécifications | Attributs libres clé/valeur (Matériau, Garantie, Dimensions…) |
| SKU / Code barre | Référence interne |
| Tags | Mots-clés pour la recherche |
| Poids & dimensions | Utilisés pour le calcul des frais de livraison |
| SEO | Titre, meta description, mots-clés |

**Gestion du stock :**
- Activer le suivi des stocks
- Quantité disponible
- Seuil d'alerte stock faible
- Quantité en entrepôt Pixel-Mart (si service stockage activé)

**Statuts produit :**

| Statut | Visible | Commandable |
|--------|---------|-------------|
| `draft` (brouillon) | Non | Non |
| `active` (publié) | Oui | Oui |
| `archived` | Non | Non |
| `out_of_stock` | Oui | Non |

#### Gérer le catalogue

**Actions en masse :** sélection multiple → modifier statut → supprimer

**Import/Export CSV :**
- Import : mapping colonnes → catégories via slug
- Export : tous les produits au format CSV

---

### 4.3 Gestion des commandes — `/vendor/orders`

#### Traitement d'une commande — `/vendor/orders/[id]`

| Statut actuel | Action disponible | Résultat |
|---------------|-------------------|----------|
| `paid` | Confirmer réception & démarrer la préparation | → `processing` |
| `processing` | Marquer prête à expédier | → `ready_for_delivery` |
| `ready_for_delivery` | Grouper dans un lot de livraison | → `shipped` |
| `shipped` | Marquer livrée (si livraison manuelle) | → `delivered` |
| `paid` / `processing` | Annuler (avec raison) | → `cancelled` + remboursement auto |

**Informations disponibles :**
- Adresse de livraison du client
- Articles avec quantités et prix
- Note du client (si saisie au checkout)
- Historique des événements (timeline)
- Référence et statut du paiement

---

### 4.4 Livraisons groupées — `/vendor/delivery`

Le système de livraisons groupées permet de rassembler plusieurs commandes prêtes en un **lot** (batch) transmis à l'admin pour assignation à un livreur.

**Workflow :**

```
Commandes "prêtes à expédier"
        ↓
Vendeur sélectionne et regroupe → Lot créé (status: pending)
        ↓
Vendeur télécharge bon de livraison PDF
        ↓
Vendeur transmet à l'admin (status: transmitted)
        ↓
Admin assigne un livreur (status: assigned)
        ↓
Livraisons en cours (status: in_progress)
        ↓
Toutes livrées (status: completed)
```

**Modes de regroupement :**
- Par zone géographique (automatique)
- Manuel (sélection libre)

---

### 4.5 Paramètres boutique — `/vendor/store/settings`

**Informations générales :**
- Nom, description, logo, bannière
- Couleur primaire
- Pays & devise

**Contact :**
- Téléphone (format international)
- WhatsApp
- Email, site web, Facebook, Instagram

**Livraison :**
- Utiliser l'entrepôt Pixel-Mart (active le service stockage)
- Ou définir une adresse de retrait personnalisée via la carte interactive

---

### 4.6 Thème boutique — `/vendor/store/theme`

5 thèmes prédéfinis, tous personnalisables :

| Thème | Couleur principale | Style |
|-------|--------------------|-------|
| **Classique** | Bleu `#2563EB` | Professionnel, polyvalent |
| **Minimal** | Noir `#18181B` | Lignes fines, typographie forte |
| **Vibrant** | Orange `#EA580C` | Couleurs vives, énergie africaine |
| **Royal** | Violet `#7C3AED` | Prestige, boutique premium |
| **Naturel** | Vert `#16A34A` | Tons chauds, nature |

**Options :**
- Mode clair / sombre
- Override couleur primaire (picker hex libre)
- Aperçu en temps réel

Le thème s'applique à la **boutique personnalisée** (`/shop/[slug]`).

---

### 4.7 Avis clients — `/vendor/reviews`

- Consulter tous les avis avec note, commentaire et photos
- Filtrer par note (1 à 5 étoiles) ou statut (published / flagged)
- **Répondre** à un avis (texte libre, visible par le client)
- Les avis non publiés sont flaggés pour modération admin

---

### 4.8 Codes promo — `/vendor/coupons`

**Créer un coupon :**

| Champ | Description |
|-------|-------------|
| Code | Ex: `ETE20` |
| Type | `percentage` (%) / `fixed_amount` (montant fixe) / `free_shipping` |
| Valeur | 20 pour 20%, ou 5000 pour 50 FCFA de réduction |
| Panier minimum | Montant minimum pour activer le coupon |
| Utilisations max | Total (ex: 100 codes disponibles) |
| Max par client | Généralement 1 |
| Produits/catégories | Restriction optionnelle |
| Dates de validité | Début et fin optionnels |

---

### 4.9 Notifications — `/vendor/notifications`

**Événements notifiés :**

| Événement | Canal |
|-----------|-------|
| Nouvelle commande payée | Email + In-app + Push |
| Stock faible | Email + In-app + Push |
| Virement complété | Email + In-app + Push |
| Nouvel avis client | Email + In-app + Push |
| Demande de retour | Email + In-app + Push |
| Stockage validé / rejeté | Email + In-app + Push |
| Facture stockage créée | Email + In-app + Push |

**Paramètres :**
- Activer/désactiver les push notifications par appareil
- Historique complet des notifications

---

## 5. Boutique personnalisée (Vendor Shop)

### 5.1 Activation

**Route :** `/vendor/store/meta`

1. Activer le toggle "Boutique personnalisée"
2. La boutique est accessible à `pixel-mart-bj.com/shop/[votre-slug]`
3. Design automatiquement basé sur le thème choisi dans `/vendor/store/theme`

### 5.2 Pages de la boutique personnalisée

| Route | Contenu |
|-------|---------|
| `/shop/[slug]` | Page d'accueil avec hero, présentation, produits récents |
| `/shop/[slug]/products` | Catalogue complet filtrable |
| `/shop/[slug]/products/[slug]` | Détail produit avec variantes |
| `/shop/[slug]/cart` | Panier boutique |
| `/shop/[slug]/checkout` | Checkout dédié à cette boutique |
| `/shop/[slug]/checkout/confirmation` | Page de remerciement |

### 5.3 Page d'accueil boutique

**Sections affichées :**
- Hero avec bannière et logo
- Badge "Boutique vérifiée" (si applicable)
- Note moyenne et nombre de produits
- Description et liens réseaux sociaux
- Grille de produits (récents + meilleures ventes)

### 5.4 Meta Pixel & Conversions API

**Route :** `/vendor/store/meta`

Permet au vendeur de connecter son **Facebook/Meta Pixel** pour suivre les performances publicitaires.

| Champ | Description |
|-------|-------------|
| Pixel ID | Identifiant du pixel Meta (15-16 chiffres) |
| Access Token | Token API Conversions (server-side) |
| Code événement test | Pour valider les événements en test |

**Événements automatiquement trackés :**

| Événement | Déclencheur | Méthode |
|-----------|-------------|---------|
| `PageView` | Chaque page de la boutique | JS (client) |
| `ViewContent` | Ouverture d'une fiche produit | JS (client) |
| `AddToCart` | Ajout au panier | JS (client) |
| `InitiateCheckout` | Début du checkout | JS (client) |
| `Purchase` | Confirmation paiement (webhook) | Serveur (CAPI) |

> Le tracking serveur (`Purchase`) est envoyé via l'API Conversions Meta depuis Convex, ce qui le rend insensible aux bloqueurs de publicités.

---

## 6. Système de paiement & finances

### 6.1 Méthodes de paiement

**Mobile Money (Moneroo) — disponible par pays :**

| Pays | MTN | Orange | Wave | Moov | Wizall |
|------|:---:|:------:|:----:|:----:|:------:|
| Bénin (BJ) | ✓ | | | ✓ | |
| Sénégal (SN) | | ✓ | ✓ | | ✓ |
| Côte d'Ivoire (CI) | ✓ | ✓ | ✓ | ✓ | |
| Cameroun (CM) | ✓ | ✓ | | | |
| Mali (ML) | | ✓ | ✓ | | ✓ |
| Burkina Faso (BF) | | ✓ | | | |
| Guinée (GN) | ✓ | ✓ | | | |

**Carte bancaire (Stripe) :** disponible dans tous les pays.

### 6.2 Modèle de commission

Pixel-Mart prélève une commission sur chaque vente :

| Plan boutique | Commission |
|---------------|------------|
| Free | 5% |
| Pro | 3% |
| Business | 2% |

**Exemple pour une vente de 10 000 FCFA (plan Pro) :**
```
Montant client          10 000 FCFA
Commission Pixel-Mart      -300 FCFA (3%)
═══════════════════════════════════
Revenu net vendeur       9 700 FCFA
```

### 6.3 Règle des 48h (F-03)

Après confirmation d'un paiement, le montant reste en **solde en attente** (`pending_balance`) pendant 48 heures. Passé ce délai, il bascule automatiquement en **solde disponible** (`balance`) et peut être retiré.

> **Pourquoi ?** Cette fenêtre permet de gérer les potentiels remboursements ou litiges avant que l'argent soit accessible.

```
Paiement confirmé
       ↓
[Solde en attente]  ←── 48h de délai
       ↓
[Solde disponible]  ←── Peut être retiré
```

### 6.4 Dashboard finance — `/vendor/finance`

**Vue d'ensemble :**
- Solde disponible (retirable maintenant)
- Solde en attente (libéré dans < 48h)
- Revenu brut sur la période
- Commissions déduites
- Revenu net

**Historique des transactions :**

| Type | Description |
|------|-------------|
| `sale` | Crédit suite à une vente |
| `fee` | Commission Pixel-Mart déduite |
| `refund` | Débit suite à un remboursement |
| `payout` | Débit lors d'un virement |
| `credit` | Crédit divers (correction, remboursement de dette…) |
| `ad_payment` | Paiement d'un espace publicitaire |
| `storage_debt` | Débit de dette de stockage lors d'un virement |

### 6.5 Demander un virement — `/vendor/finance/payouts`

1. Cliquer "Demander un paiement"
2. Saisir le montant (minimum 655 FCFA)
3. Choisir la méthode :
   - Mobile Money (Moneroo)
   - Virement bancaire
   - PayPal
4. Renseigner les coordonnées de paiement
5. Confirmer

**Cycle du virement :**
```
pending → (admin valide) → processing → (provider confirme) → completed
                                     ou → failed (re-crédité automatiquement)
```

**Frais de virement :**
- Mobile Money : ~1% du montant
- Virement bancaire : ~1-2%
- Ces frais sont déduits du montant net reçu

> **Règle F-05 (priorité dettes stockage) :** Si le vendeur a des factures de stockage impayées, leur montant est automatiquement déduit du virement avant calcul des frais.

### 6.6 Factures — `/vendor/finance/invoices`

- Historique complet des factures de ventes
- Regroupées par mois
- Téléchargement PDF pour la comptabilité

---

## 7. Service Stockage Entrepôt

> Le service de stockage permet aux vendeurs de stocker leurs produits dans l'entrepôt Pixel-Mart. Les commandes sont préparées et expédiées directement depuis l'entrepôt, sans que le vendeur ait à gérer la logistique.

### 7.1 Activation

Dans `/vendor/store/settings`, activer "Utiliser l'entrepôt Pixel-Mart".

### 7.2 Flux de stockage complet

```
1. Vendeur crée une demande de stockage
        ↓
2. Système génère un code de dépôt (PM-XXX)
        ↓
3. Vendeur apporte le colis à l'entrepôt Pixel-Mart
        ↓
4. Agent scanne le code → saisit les mesures réelles
        Status → received
        ↓
5. Admin valide → calcule les frais de stockage
        Status → in_stock
        ↓
6. Facture de stockage générée
        ↓
7. Produit lié au stock entrepôt (warehouse_qty)
```

### 7.3 Demander un stockage — `/vendor/storage`

1. Cliquer "Nouvelle demande"
2. Sélectionner le produit
3. Indiquer la quantité estimée
4. Choisir le type de mesure (unités ou poids)
5. Valider → code PM-XXX généré
6. Imprimer ou noter le code pour l'apposer sur le colis

### 7.4 Tarification stockage

Les frais sont calculés automatiquement selon le volume lors de la validation par l'admin :

| Volume | Tarif |
|--------|-------|
| ≤ 50 unités | 100 FCFA / unité |
| > 50 unités | 60 FCFA / unité |
| 5 – 25 kg | 5 000 FCFA forfait |
| > 25 kg | 5 000 FCFA + 250 FCFA/kg au-dessus de 25 kg |

### 7.5 Modes de paiement des frais de stockage

| Mode | Description |
|------|-------------|
| Immédiat | Paiement via Mobile Money au moment de la validation |
| Auto-débit | Déduit automatiquement du prochain virement |
| Différé | Accumulé en dette mensuelle, déduit lors du prochain payout |

> **Règle F-06 :** Si une facture de stockage est impayée depuis plus de 30 jours, le vendeur ne peut plus retirer ses produits de l'entrepôt.

### 7.6 Facturation stockage — `/vendor/billing`

- Toutes les factures de stockage avec statut (paid / unpaid)
- Montant de la dette mensuelle accumulée
- Historique des paiements

---

## 8. Service Publicités

> Les espaces publicitaires permettent aux vendeurs de promouvoir leurs produits ou boutique sur des emplacements premium de la marketplace.

**Route :** `/vendor/ads`

### 8.1 Emplacements disponibles

| Emplacement | Format | Position |
|-------------|--------|----------|
| Hero principal | Bannière pleine largeur | Top homepage |
| Bannière milieu | Format intermédiaire | Section centrale homepage |
| Sidebar | Format vertical | Sidebar pages produits |
| Footer | Format horizontal | Bas de page |

### 8.2 Réserver un espace

1. Sélectionner l'emplacement
2. Choisir le type de contenu :
   - Promotion d'un produit spécifique
   - Promotion de la boutique
   - Bannière personnalisée (image + CTA)
3. Uploader le visuel ou sélectionner un produit
4. Définir les dates (début et fin)
5. Confirmer le prix (calculé dynamiquement)
6. Payer → activation

### 8.3 Tarification dynamique

Les prix varient selon :
- L'emplacement (hero > sidebar > footer)
- La période (multiplicateurs sur les périodes de forte demande : soldes, fêtes)
- La durée (jour / semaine / mois)

### 8.4 Système de priorité

Quand plusieurs publicités sont actives sur le même emplacement, la rotation s'effectue selon la priorité :

| Priorité | Type |
|----------|------|
| 100 | Override admin (toujours affiché) |
| 50 | Espace acheté par vendeur |
| 10 | File d'attente |
| 0 | Contenu organique |

### 8.5 Suivi des performances

Chaque annonce affiche :
- Impressions (nombre d'affichages)
- Clics
- Taux de clic (CTR)
- Statut en temps réel (pending / active / completed)

---

## 9. Analytics avancés

**Route :** `/vendor/analytics`

### 9.1 Filtres

- **Période :** 7 derniers jours, 30 jours, 90 jours, 12 mois
- **Source :** Toutes, Marketplace Pixel-Mart, Boutique personnalisée (`/shop/[slug]`)

### 9.2 Métriques disponibles

**Performance globale :**

| Métrique | Description |
|----------|-------------|
| Commandes totales | Nombre de commandes sur la période |
| Revenu total | Montant brut encaissé |
| Panier moyen | Revenu / nombre de commandes |
| Taux de conversion | Visiteurs → commandes |
| Clients uniques | Acheteurs distincts |

**Graphiques :**
- Ventes par jour (courbe)
- Revenu par jour (barres)
- Top 10 produits (tableau : produit, quantité vendue, revenu généré)
- Revenu par catégorie (camembert)

**Données clients :**
- Nouveaux clients vs clients récurrents
- Revenu moyen par client
- Historique d'achat par client

---

## 10. Agent d'entrepôt

**Route :** `/agent`

L'agent est un opérateur physique présent dans l'entrepôt Pixel-Mart. Son rôle est de **réceptionner, peser/compter et valider** les articles déposés par les vendeurs.

### 10.1 Réceptionner un dépôt

1. Le vendeur arrive avec son colis et son code **PM-XXX**
2. L'agent accède à `/agent`
3. Saisit le code PM-XXX dans le champ de recherche
4. La demande correspondante apparaît (produit, vendeur, quantité estimée)
5. L'agent mesure et saisit les **données réelles** :
   - Nombre d'unités effectives (si type = unités)
   - Poids réel en kg (si type = poids)
6. Peut ajouter une note (état du colis, remarques)
7. Valide → statut de la demande passe à `received`
8. L'admin est notifié pour validation finale

---

## 11. Statuts & cycles de vie

### 11.1 Commandes

```
pending ──→ paid ──→ processing ──→ shipped ──→ delivered
   │                     │
   └─→ cancelled         └─→ cancelled (remboursement auto)
                                   │
                             refunded ←──── (depuis paid ou delivered)
```

| Statut | Signification |
|--------|---------------|
| `pending` | Commande créée, en attente de paiement |
| `paid` | Paiement confirmé, en attente du vendeur |
| `processing` | Vendeur prépare la commande |
| `shipped` | Commande expédiée (numéro de suivi disponible) |
| `delivered` | Commande livrée au client |
| `cancelled` | Commande annulée |
| `refunded` | Remboursement effectué |

### 11.2 Virements (Payouts)

| Statut | Signification |
|--------|---------------|
| `pending` | Demande créée, en attente de validation admin |
| `processing` | Admin a validé, en cours d'envoi chez le provider |
| `completed` | Argent reçu par le vendeur |
| `failed` | Échec chez le provider (solde re-crédité automatiquement) |

### 11.3 Produits

| Statut | Visible marketplace | Commandable |
|--------|:-------------------:|:-----------:|
| `draft` | Non | Non |
| `active` | Oui | Oui |
| `archived` | Non | Non |
| `out_of_stock` | Oui (avec badge) | Non |

### 11.4 Demandes de stockage

| Statut | Signification |
|--------|---------------|
| `pending_drop_off` | Demande créée, vendeur doit apporter le colis |
| `received` | Reçu et mesuré par l'agent |
| `in_stock` | Validé et en stock |
| `rejected` | Rejeté par l'admin (raison indiquée) |

### 11.5 Retours

| Statut | Signification |
|--------|---------------|
| `requested` | Client a soumis la demande |
| `approved` | Vendeur a accepté le retour |
| `rejected` | Vendeur a refusé |
| `received` | Article retourné reçu |
| `refunded` | Client remboursé |

### 11.6 Lots de livraison

| Statut | Signification |
|--------|---------------|
| `pending` | Lot créé par le vendeur, pas encore transmis |
| `transmitted` | Transmis à l'admin pour assignation |
| `assigned` | Livreur assigné |
| `in_progress` | Livraisons en cours |
| `completed` | Toutes les commandes livrées |
| `cancelled` | Lot annulé |

---

## 12. Récapitulatif des routes

### Client

| Route | Page |
|-------|------|
| `/` | Accueil marketplace |
| `/products` | Catalogue avec filtres |
| `/products/[slug]` | Fiche produit |
| `/categories/[slug]` | Produits d'une catégorie |
| `/stores` | Annuaire des boutiques |
| `/stores/[slug]` | Page publique d'une boutique |
| `/cart` | Panier |
| `/checkout` | Processus de commande |
| `/checkout/confirmation` | Page post-paiement |
| `/orders` | Mes commandes |
| `/orders/[id]` | Détail d'une commande |
| `/orders/[id]/return` | Demande de retour |
| `/about` | À propos de Pixel-Mart |
| `/privacy` | Politique de confidentialité |
| `/terms` | Conditions d'utilisation |

### Vendeur

| Route | Page |
|-------|------|
| `/vendor/dashboard` | Tableau de bord KPI |
| `/vendor/products` | Catalogue produits |
| `/vendor/products/new` | Créer un produit |
| `/vendor/products/[id]/edit` | Éditer un produit |
| `/vendor/orders` | Liste des commandes |
| `/vendor/orders/[id]` | Détail & traitement d'une commande |
| `/vendor/orders/returns` | Demandes de retour |
| `/vendor/delivery` | Lots de livraison |
| `/vendor/delivery/[id]` | Détail d'un lot |
| `/vendor/analytics` | Analytics détaillés |
| `/vendor/finance` | Solde & transactions |
| `/vendor/finance/invoices` | Factures de ventes |
| `/vendor/finance/payouts` | Demandes de virement |
| `/vendor/store/settings` | Paramètres de la boutique |
| `/vendor/store/theme` | Thème & apparence |
| `/vendor/store/meta` | Meta Pixel & boutique perso |
| `/vendor/reviews` | Avis clients |
| `/vendor/coupons` | Codes promo |
| `/vendor/storage` | Service stockage entrepôt |
| `/vendor/billing` | Facturation stockage |
| `/vendor/ads` | Espaces publicitaires |
| `/vendor/notifications` | Centre de notifications |
| `/vendor/select-store` | Sélectionner boutique (multi-boutiques) |

### Boutique personnalisée

| Route | Page |
|-------|------|
| `/shop/[slug]` | Accueil boutique |
| `/shop/[slug]/products` | Catalogue boutique |
| `/shop/[slug]/products/[slug]` | Fiche produit boutique |
| `/shop/[slug]/checkout` | Checkout boutique |
| `/shop/[slug]/checkout/confirmation` | Confirmation paiement |

### Agent & Admin

| Route | Page |
|-------|------|
| `/agent` | Réception entrepôt |
| `/admin/dashboard` | Dashboard admin (en développement) |

---

*Document maintenu dans `/docs/PLATFORM_GUIDE.md` — mettre à jour à chaque nouvelle fonctionnalité.*
