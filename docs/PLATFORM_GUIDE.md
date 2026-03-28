# Guide Plateforme Pixel-Mart

> Référence complète pour la prise en main de la plateforme.
> Couvre tous les rôles, toutes les pages, et explique précisément qui fait quoi et qui dépend de qui.

---

## Table des matières

1. [Vue d'ensemble & acteurs](#1-vue-densemble--acteurs)
2. [Comment les acteurs s'interconnectent](#2-comment-les-acteurs-sinterconnectent)
3. [Authentification](#3-authentification)
4. [Parcours client — Marketplace](#4-parcours-client--marketplace)
5. [Parcours client — Boutique personnalisée](#5-parcours-client--boutique-personnalisée)
6. [Dashboard vendeur — Catalogue & commandes](#6-dashboard-vendeur--catalogue--commandes)
7. [Dashboard vendeur — Finance & virements](#7-dashboard-vendeur--finance--virements)
8. [Dashboard vendeur — Stockage entrepôt](#8-dashboard-vendeur--stockage-entrepôt)
9. [Dashboard vendeur — Publicités](#9-dashboard-vendeur--publicités)
10. [Dashboard vendeur — Analytics, avis, coupons](#10-dashboard-vendeur--analytics-avis-coupons)
11. [Interface Agent d'entrepôt](#11-interface-agent-dentrepôt)
12. [Dashboard Admin](#12-dashboard-admin)
13. [Cycles de vie & machines d'état](#13-cycles-de-vie--machines-détat)
14. [Système de notifications](#14-système-de-notifications)
15. [Récapitulatif des routes](#15-récapitulatif-des-routes)

---

## 1. Vue d'ensemble & acteurs

**Pixel-Mart** est une marketplace multi-vendeurs pour l'Afrique de l'Ouest (Bénin / Cotonou). Elle repose sur **5 types d'acteurs** dont les actions s'enchaînent et se dépendent mutuellement.

### Les 5 acteurs

| Acteur | Rôle système | Espace | Ce qu'il fait |
|--------|-------------|--------|--------------|
| **Client** | `customer` | `/`, `/products`, `/orders` | Navigue, achète, suit ses commandes, retourne des articles, laisse des avis |
| **Vendeur** | `vendor` | `/vendor/*`, `/shop/[slug]` | Gère son catalogue, traite les commandes, fait des retraits, publie des publicités |
| **Agent** | `agent` | `/agent` | Réceptionne les colis à l'entrepôt, les pèse/compte, les valide |
| **Admin** | `admin` | `/admin/*` | Supervise la plateforme, vérifie les boutiques, approuve les retraits, configure tout |
| **Rôles admin spécialisés** | `finance` `logistics` `developer` `marketing` | `/admin/*` (sous-ensembles) | Délégation de responsabilités admin par domaine |

### Rôles admin spécialisés

Un `admin` peut déléguer certaines tâches à des membres de son équipe sans leur donner accès à tout :

| Rôle | Peut faire | Ne peut pas faire |
|------|-----------|------------------|
| `finance` | Voir analytics, gérer les retraits, accéder aux rapports | Supprimer des utilisateurs, modifier la config |
| `logistics` | Gérer les tarifs livraison, les pays, valider le stockage | Gérer les utilisateurs, les finances |
| `developer` | Modifier la configuration technique | Gérer utilisateurs, finances, logistique |
| `marketing` | Gérer les catégories, les publicités | Gérer les finances, les utilisateurs |
| `admin` | Tout, sans exception | — |

### Devise & argent

- Devise principale : **XOF (Franc CFA)**
- Tous les montants sont stockés en **centimes XOF** — mais pour le XOF, 1 centime = 1 FCFA (pas de division par 100)
- `5 000 centimes = 5 000 FCFA` — jamais `50 FCFA`
- Paiements : Mobile Money (MTN, Orange, Wave, Moov, Wizall) via **Moneroo**

---

## 2. Comment les acteurs s'interconnectent

Comprendre les dépendances entre acteurs est essentiel pour comprendre pourquoi une action d'un acteur a des conséquences sur un autre.

### Graphe des dépendances

```
[Better Auth] ──────────────▶ crée automatiquement un profil [users]
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    ▼                     ▼                       ▼
               [customer]           [vendor]                  [admin]
                    │                    │                        │
                    │ passe commande      │ gère produits          │ supervise
                    ▼                    ▼                        ▼
               [orders] ◀───────── [products]              [platform_events]
                    │                    │                   (audit log)
                    │ confirme           │ décrémente
                    ▼                    ▼
               [Moneroo] ─────▶ [webhook] ─────▶ [payments/mutations]
                                                         │
                          ┌──────────────────────────────┤
                          ▼                              ▼
                   [transactions]               [notifications]
                   (ledger F-01)             (in-app + email + push)
                          │                              │
                          ▼                              ▼
                   [store.balance]              [client / vendeur]
                   (pending 48h)
                          │
                          ▼ (cron +48h, règle F-03)
                   [store.balance disponible]
                          │
                          ▼ (vendeur demande retrait)
                   [payouts] ──▶ [Moneroo] ──▶ [webhook] ──▶ [confirmPayout]

[vendor] ──── crée demande stockage ──▶ [storage_requests]
                                                 │
                                                 ▼ (agent scanne)
                                         [agent reçoit colis]
                                                 │
                                                 ▼ (admin valide)
                                         [storage_invoices]
                                                 │
                                                 ▼
                                         [storage_debt] ──▶ déduit sur prochain retrait (F-05)
```

### Règle fondamentale : qui crée quoi

| Qui | Crée | Ce qui dépend de ça |
|-----|------|---------------------|
| Inscription | `users` record | Tout le reste — sans `users`, rien ne fonctionne |
| Client au checkout | `orders` (status: pending) | Stock décrémenté immédiatement |
| Moneroo (webhook) | Confirme `orders` (status: paid) | `transactions` sale+fee, `store.pending_balance`, emails, push |
| Cron (toutes les heures) | Libère le solde pending → disponible | Vendor peut retirer |
| Vendor (retrait) | `payouts` record | `transactions` payout, `store.balance` débité |
| Moneroo (webhook retrait) | Confirme `payouts` | Email+push vendor "retrait complété" |
| Vendor | `storage_requests` | Agent doit réceptionner |
| Agent | Scanne → `received` | Admin doit valider |
| Admin | Valide → `storage_invoices` | Facture générée, dette stockée |
| Cron (toutes les heures) | Publie les avis | `product.avg_rating` recalculé, email vendeur |
| Cron (toutes les 15min) | Active les pubs | Affichage storefront mis à jour |

### Les 3 mécanismes de communication entre modules

**1. Scheduler (non-bloquant)** — utilisé pour les notifications/emails/push depuis les mutations :
```
mutation confirmPayment
  └── ctx.scheduler.runAfter(0, notifyNewOrderInApp)  ← déclenché après commit
          └── email Resend + in-app + webpush
```
La mutation est commitée même si la notification échoue.

**2. RunMutation (depuis webhook)** — le webhook HTTP appelle une mutation via `ctx.runMutation` :
```
POST /webhooks/moneroo
  └── ctx.runMutation(internal.payments.mutations.confirmPayment, ...)
```

**3. Crons** — tâches périodiques qui appellent des mutations/actions internes :
```
cron toutes les heures → releaseBalances mutation
cron toutes les 12h   → autoConfirmDelivery mutation
cron toutes les 15min → processAdBookings mutation
```

---

## 3. Authentification

### 3.1 Inscription

**Route :** `/register`

Le processus d'inscription crée deux enregistrements liés :

```
[Formulaire /register]
    │ email + password (min 12 chars, 1 maj, 1 chiffre, 1 spécial)
    ▼
Better Auth (système d'auth)
    │ crée l'utilisateur dans sa table interne
    ▼
Trigger automatique → crée users record Pixel-Mart
    │ role: "customer", is_banned: false, is_verified: false
    ▼
Email de vérification → Resend → client
    ▼
Clic sur le lien → is_verified: true → session créée
```

> **Dépendance :** Tout le reste de la plateforme dépend du `users` record. Sans inscription complète (email vérifié), aucune commande ni boutique ne peut être créée.

**Cas spécial — Inscription vendeur :**
Après inscription standard, le vendeur accède à `/onboarding/vendor` pour créer sa boutique :

| Étape | Champs | Dépend de |
|-------|--------|-----------|
| 1 — Boutique | Nom, description | — |
| 2 — Localisation | Pays, zone | `country_config` (pays activés par admin) |
| 3 — Livraison | Entrepôt Pixel-Mart OU adresse custom (carte) | `delivery_rates` (configurées par admin) |
| 4 — Contact | Téléphone, email, réseaux | — |

La boutique est créée avec `status: "pending"` — elle n'est visible publiquement qu'après vérification par l'admin.

### 3.2 Connexion

**Route :** `/login`

```
[Formulaire /login]
    │ email + password
    ▼
Better Auth → vérifie credentials
    │ rate limit : 5 tentatives/15min, lockout 30min après 5 échecs
    ▼
Session créée → cookie HTTP-only (7 jours, refresh auto 24h)
    ▼
Middleware Next.js → vérifie cookie sur chaque route protégée
    ▼
AuthGuard (client) → vérifie user.role ∈ rolesAutorisés
    ▼
Si vendor multi-boutiques → /vendor/select-store
    │ listMyStores → sélection boutique active
    └── setActiveStore → patch users.active_store_id
```

> **Dépendance :** La session Better Auth est résolue à chaque requête Convex. Si la session est invalide ou expirée, `getMe` retourne null et toutes les mutations protégées échouent.

### 3.3 Réinitialisation mot de passe

1. `/forgot-password` → saisir email → email envoyé via Resend
2. Lien → `/reset-password?token=...` → saisir nouveau mot de passe
3. Token usage unique, expire après 1h

### 3.4 Déconnexion

```javascript
authClient.signOut()
    ├── Supprime session Better Auth côté serveur
    └── window.location.href = "/login"  ← full reload obligatoire
            └── vide le cache Convex (reactivity reset)
```

> **Important :** La déconnexion doit faire un full reload (`window.location.href`), pas un simple `router.push`. Sinon le cache Convex conserve les données de l'ancienne session.

---

## 4. Parcours client — Marketplace

### 4.1 Navigation & recherche — `/products`

Le client peut filtrer les produits via les paramètres URL :

| Paramètre | Valeurs | Exemple |
|-----------|---------|---------|
| `q` | Texte libre (full-text sur titre) | `?q=smartphone` |
| `category` | Slug catégorie | `?category=electronique` |
| `min_price` | Centimes | `?min_price=5000` |
| `max_price` | Centimes | `?max_price=100000` |
| `in_stock` | `true` | `?in_stock=true` |
| `sort` | `relevance` `newest` `price_asc` `price_desc` | `?sort=newest` |

> **Dépendance :** La recherche full-text utilise un `searchIndex` Convex sur le titre des produits. Seuls les produits `status: "active"` appartenant à des boutiques `status: "active"` sont indexés.

### 4.2 Page produit — `/products/[slug]`

Ce que le client voit et ce dont chaque élément dépend :

| Élément affiché | Dépend de |
|-----------------|-----------|
| Galerie d'images | `products.images[]` (Convex Storage) |
| Prix barré + économie | `products.compare_price` vs `products.price` |
| Note moyenne | `products.avg_rating` — calculé par le cron `autoPublishReviews` |
| Variantes (couleur, taille) | `product_variants` — disponibles si `is_available: true` |
| Stock disponible | `products.quantity` — mis à jour à chaque commande |
| Badge "Boutique vérifiée" | `stores.is_verified: true` — validé par admin |
| Avis | `reviews` — seulement `is_published: true` |
| Q&R | `product_questions` — `is_published: true` |

### 4.3 Panier — `/cart`

- Géré par `useCart()` en **localStorage** (pas de Convex)
- Persisté entre sessions sans connexion
- Regroupé par boutique — une boutique = une future commande séparée
- Validation de stock seulement au moment de `createOrder` (pas en temps réel)

> **Dépendance :** Le panier ne sait pas en temps réel si un article est épuisé. Le stock est vérifié et décrémenté **atomiquement** dans la mutation `createOrder`. Si insuffisant → erreur retournée au client.

### 4.4 Checkout — `/checkout`

Le checkout crée une commande par boutique dans le panier.

**Pour chaque boutique :**

1. **Adresse de livraison** (obligatoire)
   - Utilisée pour calculer la distance et les frais via `delivery.queries.getRate`
   - Geocoding via Nominatim (autocomplete adresse, 1 req/sec)

2. **Frais de livraison calculés automatiquement**
   - Distance vendeur → hub Pixel-Mart + hub → client
   - Type : Standard / Urgent / Fragile
   - Grille de prix : `delivery_rates` configurée par l'admin
   - Surcharge poids si `estimatedWeightKg > weight_threshold_kg`

3. **Code promo** (optionnel)
   - Validé via `coupons.queries.validate`
   - Vérifie : actif, non expiré, montant minimum, nombre d'utilisations restantes

4. **Mode de paiement**
   - En ligne : redirigé vers Moneroo après création de la commande
   - Contre-remboursement (COD) : commande directement à `paid`

**Ce qui se passe dans `createOrder` :**

```
Rate limit : 5 commandes/min par user
    │
    ├── Valide chaque item (product actif, stock suffisant, appartient au bon store)
    ├── Applique coupon (discount_amount)
    ├── Calcule commission = total × commission_rate / 10_000
    ├── Génère order_number "PM-YYYY-NNNN"
    ├── Insère orders {status: "pending"}
    ├── Décrémente product.quantity (ET variant.quantity si variante)
    └── logOrderEvent("created")
```

> **Dépendance chaîne :** `createOrder` → décrémente le stock → si paiement en ligne → `initiatePayment` → Moneroo → webhook → `confirmPayment` → crédite `store.pending_balance` → cron 48h → `store.balance` disponible.

### 4.5 Paiement — Moneroo

```
[Client confirme checkout]
    │
    ▼
actions.initiatePayment({orderId, returnUrl})
    ├── POST Moneroo API /payments
    │   {amount, currency, metadata: {order_id, order_number}}
    └── Retourne {checkout_url, reference}
            │
            ▼
[Client sur page Moneroo]
    ├── Saisit son numéro Mobile Money
    └── Valide l'OTP reçu par SMS

[Moneroo envoie le webhook] POST /webhooks/moneroo
    ├── Vérifie signature HMAC-SHA256 (PREMIER — avant tout traitement)
    └── confirmPayment mutation :
            ├── Idempotent : si déjà "paid", ignore
            ├── orders.status → "paid"
            ├── Crée transaction "sale" (crédite pending_balance)
            ├── Crée transaction "fee" (commission plateforme)
            ├── Email confirmation → client (OrderConfirmation)
            ├── Email notification → vendeur (NewOrder)
            └── Push notification → vendeur

[Moneroo redirige le client]
    └── /checkout/payment-callback → poll statut → /checkout/confirmation
```

### 4.6 Suivi commandes — `/orders` et `/orders/[id]`

| Section | Données affichées | Dépend de |
|---------|------------------|-----------|
| Liste | order_number, boutique, statut, montant, date | `orders` filtrés par customer_id |
| Timeline | Événements horodatés | `order_events` (journal immuable) |
| Suivi | Numéro de suivi, transporteur | `orders.tracking_number`, `orders.carrier` |
| Articles | Titre, image, qté, prix (snapshot) | `orders.items[]` — données gelées à la création |

> **Important :** Les `items` d'une commande sont des **snapshots immuables**. Même si le vendeur modifie ou supprime le produit après, l'historique de commande reste intact.

### 4.7 Demander un retour — `/orders/[id]/return`

**Conditions d'éligibilité (toutes requises) :**
- `order.status === "delivered"`
- Pas de return_request existant (sauf si `status: "rejected"`)
- `delivered_at < now - 14 jours` (fenêtre configurable)

**Raisons acceptées :** Produit défectueux · Article non conforme · Mauvais article · Endommagé · Changement d'avis

**Ce qui se passe :**
```
[Client soumet] requestReturn
    ├── Calcule refund_amount = sum(qty × unit_price des articles retournés)
    ├── Insère return_request {status: "requested"}
    ├── Notifie le vendeur (email + in-app + push)
    └── Notifie le client (confirmation)

[Vendor approuve] approveReturn → "approved" → notifie client
[Vendor rejette]  rejectReturn  → "rejected" → notifie client
[Vendor reçoit]   markReceived  → "received" → notifie client
[Vendor rembourse] processRefund
    ├── Restaure le stock (product.quantity += items.qty)
    ├── orders.payment_status → "refunded"
    ├── Crée transaction "refund" (débit store)
    ├── Lance remboursement Moneroo
    └── Notifie les deux parties
```

> **Dépendance :** Le remboursement Moneroo est initié par une `action` (appel API externe) planifiée via `scheduler`. La mutation elle-même ne fait pas l'appel — elle délègue pour rester transactionnelle.

### 4.8 Avis clients

**Conditions d'éligibilité :**
- `order.status === "delivered"`
- Aucun avis existant pour ce produit + cette commande

**Processus de publication :**
```
[Client soumet] reviews.mutations.create
    └── Insère review {is_published: false}

[Cron autoPublishReviews — toutes les heures]
    Pour les reviews non-publiées > 24h, non-flaggées :
        ├── is_published → true
        ├── Recalcule product.avg_rating
        └── Notifie le vendeur
```

> **Dépendance :** L'avis n'est pas immédiatement visible. Il attend le passage du cron (max 25h). Le vendeur ne peut pas supprimer un avis — il peut seulement répondre, ou le signaler (`flagged: true`) pour modération admin.

---

## 5. Parcours client — Boutique personnalisée

La boutique personnalisée est une vitrine indépendante sous `/shop/[slug]`. Elle utilise les mêmes données produits et commandes que la marketplace, mais dans un design personnalisé par le vendeur.

### 5.1 Activation

**Route vendeur :** `/vendor/store/meta`

Le vendeur active le toggle "Boutique personnalisée". La boutique devient accessible à `pixel-mart-bj.com/shop/[votre-slug]`.

> **Dépendance :** `stores.vendor_shop_enabled: true`. Si le vendeur désactive ce toggle, la boutique disparaît immédiatement (query `getBySlug` filtre sur ce flag).

### 5.2 Pages disponibles

| Route | Contenu | Dépend de |
|-------|---------|-----------|
| `/shop/[slug]` | Hero, produits récents, description | `stores.getBySlug`, `products.listByStore` |
| `/shop/[slug]/products` | Catalogue filtrable | `products.search` (filtre store_id) |
| `/shop/[slug]/products/[slug]` | Détail produit | `products.getBySlug` (scope store) |
| `/shop/[slug]/cart` | Panier | `useCart` (localStorage, scope store slug) |
| `/shop/[slug]/checkout` | Commande | `orders.createOrder` (source: "vendor_shop") |

### 5.3 Thème & apparence

**Route :** `/vendor/store/theme`

| Thème | Style | Couleur par défaut |
|-------|-------|--------------------|
| Default | Professionnel, polyvalent | Bleu `#2563EB` |
| Modern | Lignes fines, minimaliste | Noir `#18181B` |
| Classic | Chaleureux, traditionnel | Orange `#EA580C` |
| Royal | Prestige, premium | Violet `#7C3AED` |
| Nature | Tons chauds, naturels | Vert `#16A34A` |

Options : mode clair/sombre, override couleur primaire (picker hex libre), aperçu en temps réel.

### 5.4 Meta Pixel & Conversions API

**Route :** `/vendor/store/meta`

Connecte le Facebook/Meta Pixel du vendeur pour tracker les performances publicitaires.

| Événement | Méthode | Déclencheur |
|-----------|---------|-------------|
| `PageView` | JavaScript (navigateur) | Chaque page `/shop/[slug]` |
| `ViewContent` | JavaScript | Ouverture fiche produit |
| `AddToCart` | JavaScript | Ajout panier |
| `InitiateCheckout` | JavaScript | Début checkout |
| `Purchase` | **Serveur (CAPI)** | Webhook Moneroo → `meta/mutations.trackPurchase` |

> **Dépendance :** Le tracking `Purchase` est envoyé depuis le serveur Convex après confirmation du webhook. Il est insensible aux bloqueurs de publicités car il ne passe pas par le navigateur. Il n'est envoyé que si la commande a `source: "vendor_shop"` et que le store a un `meta_pixel_id` configuré.

---

## 6. Dashboard vendeur — Catalogue & commandes

### 6.1 Tableau de bord — `/vendor/dashboard`

| Carte KPI | Source | Rafraîchi |
|-----------|--------|-----------|
| Revenu ce mois | `orders` payées du mois, `store_id` courant | Temps réel (Convex reactivity) |
| Commandes en cours | `orders.status ∈ [paid, processing, shipped]` | Temps réel |
| Produits actifs | `products.status: "active"` | Temps réel |
| Solde disponible | `stores.balance` | Temps réel |
| Solde en attente | `stores.pending_balance` | Temps réel |

**Alertes automatiques :**
- Badge orange : commandes `paid` non traitées depuis > 24h
- Alerte rouge : produits avec `quantity ≤ low_stock_threshold`

> **Dépendance :** Le solde disponible (`stores.balance`) ne bouge que lorsque le cron `releaseBalances` (toutes les heures) libère les fonds après 48h. Le solde en attente (`stores.pending_balance`) est crédité instantanément à la confirmation du paiement.

### 6.2 Catalogue produits — `/vendor/products`

#### Créer un produit — `/vendor/products/new`

**Champs obligatoires :**

| Champ | Note |
|-------|------|
| Titre | — |
| Catégorie | Doit exister dans `categories` (créées par admin/marketing) |
| Prix | En FCFA — stocké en centimes |
| Au moins 1 image | Uploadée via Convex Storage (`generateUploadUrl`) |

**Champs importants :**

| Champ | Description | Impact |
|-------|-------------|--------|
| Prix barré | Affiche une promotion visuelle | Affiché sur la fiche produit |
| Variantes | Couleur/taille avec prix et stock par variante | Le stock est géré au niveau de la variante |
| Suivi stock | Active la décrémentation automatique | Sans ça, le stock n'est jamais bloqué |
| Seuil alerte | `low_stock_threshold` (défaut: 5) | Cron `checkLowStock` (toutes les 4h) envoie une alerte email+push si atteint |
| Poids (grammes) | Utilisé pour calculer les frais de livraison | Essentiel si articles lourds |
| SEO | Titre, meta description, mots-clés | Référencement Google |

**Statuts produit :**

| Statut | Visible sur la marketplace | Commandable |
|--------|--------------------------|-------------|
| `draft` | Non | Non |
| `active` | Oui | Oui (si stock > 0) |
| `out_of_stock` | Oui (avec badge) | Non |
| `archived` | Non | Non |

> **Dépendance :** Un produit `active` appartenant à un store `suspended` n'est **pas** visible. La query `listByStore` filtre sur `store.status: "active"` en plus du statut du produit.

#### Éditer un produit — `/vendor/products/[id]/edit`

Toutes les modifications sont disponibles. **Exception :** les images déjà uploadées dans des commandes passées ne sont pas affectées (snapshot dans `orders.items`).

### 6.3 Gestion des commandes — `/vendor/orders`

#### Transitions disponibles depuis `/vendor/orders/[id]`

| Statut actuel | Action vendeur | Nouveau statut | Ce qui se passe en plus |
|---------------|----------------|----------------|------------------------|
| `paid` | Confirmer & démarrer | `processing` | Email client "En préparation" + in-app + push |
| `processing` | Marquer expédiée + tracking | `shipped` | Email client "Expédiée" + in-app + push |
| `shipped` | Marquer livrée (livraison manuelle) | `delivered` | Email client "Livrée" + in-app + push + cron libère solde 48h après |
| `paid` | Annuler avec raison | `cancelled` | Remboursement Moneroo lancé + email + stock restauré |
| `processing` | Annuler avec raison | `cancelled` | Remboursement Moneroo lancé + email + stock restauré |

> **Dépendance :** Le passage à `delivered` déclenche le compteur de 48h. Le cron `releaseBalances` (toutes les heures) vérifie `delivered_at + 48h < now`. Jusqu'à ce délai, l'argent est bloqué en `pending_balance`.

> **Cron de secours :** Si le client ne confirme pas la livraison, le cron `autoConfirmDelivery` (toutes les 12h) passe automatiquement les commandes `shipped` depuis plus de 7 jours à `delivered`.

#### Confirmation automatique de livraison

Le client peut confirmer la réception depuis `/orders/[id]`. Si non fait :
- Cron toutes les 12h → orders shipped depuis > 7 jours → `delivered`
- Le vendeur n'a pas besoin d'intervenir

### 6.4 Livraisons groupées — `/vendor/delivery`

Permet de rassembler plusieurs commandes en un **lot** transmis à l'équipe logistique.

Il existe deux types de lots :

| Type | `is_warehouse_batch` | Qui prépare les colis | Départ depuis |
|------|---------------------|----------------------|---------------|
| **Lot standard** | `false` | Le vendeur lui-même | Ses propres locaux |
| **Lot entrepôt** | `true` | L'agent Pixel-Mart | L'entrepôt Pixel-Mart |

**Lot standard :**
```
[Vendor] sélectionne des commandes "ready_for_delivery"
    │
    ▼
delivery.mutations.createBatch({orderIds, isWarehouseBatch: false})
    ├── Génère batch_number "LOT-2026-0001"
    ├── Insert delivery_batch {status: "pending", is_warehouse_batch: false}
    └── Patch orders {batch_id, status: "shipped"}
```

**Lot entrepôt** (vendeur utilisant le service de stockage Pixel-Mart) :
```
[Vendor] voit colonne "Cmdes en attente" sur ses articles in_stock
    │   (nombre de commandes éligibles dont le produit est en stock)
    │
    ▼
delivery.mutations.createBatch({orderIds, isWarehouseBatch: true})
    ├── Vérifie qu'au moins un article est in_stock
    ├── Peuple items[].storage_code via product_id → PM-NNN
    ├── Insert delivery_batch {status: "pending", is_warehouse_batch: true}
    └── Patch orders {batch_id, status: "shipped", items avec storage_code}

[Agent voit le lot dans l'onglet "Expéditions"]
    └── Prélève les articles au code PM-NNN
```

**Flux commun (après création) :**
```
[Vendor télécharge le PDF bon de livraison]
    └── useDeliveryBatchPDF() → @react-pdf/renderer

[Vendor transmet] transmitBatch → batch.status: "transmitted"
[Admin] assigned → in_progress → completed
    └── Si lot entrepôt complété : warehouse_qty + actual_qty décrémentés
```

> **Dépendance :** Seules les commandes sans `batch_id` et avec `status ∈ [processing, ready_for_delivery]` apparaissent dans `listReadyForDelivery`. Une commande incluse dans un lot ne peut pas être incluse dans un autre.

### 6.5 Retours reçus — `/vendor/orders/returns`

Le vendeur voit toutes les demandes de retour pour sa boutique. Chaque demande affiche : articles concernés, raison du client, montant à rembourser.

**Workflow depuis la vue vendeur :**
1. `requested` → Vendeur approuve ou rejette
2. Si approuvé : vendor attend le retour physique → marque "reçu"
3. Vendor traite le remboursement (via Moneroo)

---

## 7. Dashboard vendeur — Finance & virements

### 7.1 Vue finance — `/vendor/finance`

| Carte | Données |
|-------|---------|
| Solde disponible | `stores.balance` — retirable maintenant |
| Solde en attente | `stores.pending_balance` — libéré après 48h (F-03) |
| Revenu brut (période) | Somme `orders.total_amount` payées |
| Commissions (période) | Somme `orders.commission_amount` |
| Revenu net (période) | Brut - commissions |

**Historique des transactions** — types :

| Type | Direction | Déclencheur |
|------|-----------|-------------|
| `sale` | Crédit | Webhook `payment.success` |
| `fee` | Débit | Même webhook (commission Pixel-Mart) |
| `refund` | Débit | Remboursement client approuvé |
| `payout` | Débit | Demande de retrait |
| `credit` | Crédit | Libération 48h (F-03) |
| `ad_payment` | Débit | Paiement espace publicitaire |

> **Règle F-01 (invariant absolu) :** Chaque ligne du tableau transactions correspond à une écriture comptable immuable. Il est impossible de modifier ou supprimer une transaction — on crée un reversal si erreur.

### 7.2 Demander un retrait — `/vendor/finance/payouts`

**Conditions requises :**
- `stores.status: "active"` (boutique non suspendue)
- `stores.balance ≥ 65 500 centimes` (655 FCFA minimum, règle F-02)

**Calcul du net reçu (avec dette stockage) :**

```
Montant demandé (gross)     : 100 000 FCFA
─ Dette stockage (F-05)     :  -5 000 FCFA  ← priorité absolue
= Montant après dette       :  95 000 FCFA
─ Frais Mobile Money (~2%)  :  -1 900 FCFA
═══════════════════════════════════════════
Net reçu sur le compte      :  93 100 FCFA
```

> **Règle F-05 :** Si le vendeur a des factures de stockage impayées (`storage_debt` non réglé), leur montant est déduit **en priorité** avant tout, avant même les frais de virement.

**Ce qui se passe lors d'une demande de retrait :**

```
requestPayout
    ├── Valide : solde ≥ minimum, boutique active
    ├── Récupère outstandingDebt (storage_debt non settled)
    ├── Calcule fee (selon méthode)
    ├── F-01 : Insert transaction "payout" {status: "pending"}
    ├── Patch store.balance -= grossAmount
    ├── Insert payouts {status: "pending"}
    │
    ├── Si outstandingDebt > 0 :
    │   Scheduler → settleDebtFromPayout
    │       ├── Marque invoices "deducted_from_payout"
    │       ├── Règle storage_debt
    │       └── Email+push vendor "dette déduite"
    │
    ├── Notifie vendor in-app "Demande soumise"
    ├── Notifie admins in-app "Nouveau retrait à traiter"
    │
    └── Scheduler → initializePayoutViaMoneroo
            ├── POST Moneroo /payouts
            └── updatePayoutReference → status: "processing"

[Moneroo webhook payout.completed]
    └── confirmPayout → status: "completed"
            └── Email+push vendor "Virement reçu ✓"

[Moneroo webhook payout.failed]
    └── failPayout
            ├── Re-crédite store.balance
            ├── Transaction reversal
            └── In-app vendor "Virement échoué"
```

### 7.3 Méthodes de retrait

| Méthode | Frais approximatifs | Délai |
|---------|--------------------|----|
| Mobile Money (Moneroo) | ~2% | Instantané |
| Virement bancaire | ~0.5–1% | 1–3 jours ouvrés |
| PayPal | Variable | 1–2 jours |

### 7.4 Factures — `/vendor/finance/invoices`

Historique de toutes les transactions, regroupées par mois. Téléchargement PDF via `useInvoiceDownload()`.

---

## 8. Dashboard vendeur — Stockage entrepôt

Le service de stockage permet aux vendeurs de déposer leurs produits à l'entrepôt Pixel-Mart. Les commandes sont ensuite préparées et expédiées depuis l'entrepôt.

### 8.1 Activation

**Route :** `/vendor/store/settings` → activer "Utiliser l'entrepôt Pixel-Mart"

> **Dépendance :** Active `stores.has_storage_plan: true`. Sans ce flag, les demandes de stockage ne sont pas accessibles.

### 8.2 Créer une demande — `/vendor/storage`

```
[Vendor] Nouvelle demande
    │ productName, estimatedQty?, productId? (lié au catalogue)
    ▼
storage.mutations.createRequest
    ├── generateStorageCode() → "PM-NNN" (séquentiel global, ex: PM-042)
    ├── Insert storage_request {status: "pending_drop_off"}
    ├── Email vendor "Votre code est PM-042 — écrivez-le sur le colis"
    └── In-app notification → tous les admins "Nouvelle demande PM-042"
```

Le vendeur imprime ou note le code **PM-NNN** et l'appose sur le colis avant de l'apporter à l'entrepôt.

> **Dépendance :** Le code PM-NNN est l'unique identifiant du colis. Sans lui, l'agent ne peut pas réceptionner le colis. Le code est généré côté serveur (séquentiel atomique), pas côté client.

### 8.3 Dépôt physique à l'entrepôt

1. Vendor se présente à l'entrepôt avec le colis + code PM-NNN
2. Agent scanne le code dans l'interface `/agent`
3. Agent saisit les mesures réelles (unités ou poids)
4. Statut → `received`
5. Admin valide → statut → `in_stock` + facture générée

### 8.4 Tarification (calculée automatiquement à la validation)

| Volume | Tarif | Exemple |
|--------|-------|---------|
| ≤ 50 unités | 100 FCFA / unité | 30 unités → 3 000 FCFA |
| > 50 unités | 60 FCFA / unité | 100 unités → 6 000 FCFA |
| 5 – 25 kg | 5 000 FCFA forfait | 12 kg → 5 000 FCFA |
| > 25 kg | 5 000 FCFA + 250 FCFA/kg au-delà | 30 kg → 5 000 + (5 × 250) = 6 250 FCFA |

### 8.5 Modes de paiement des frais

| Mode | Fonctionnement |
|------|---------------|
| Immédiat | Paiement Mobile Money via Moneroo au moment de la validation |
| Auto-débit | Déduit du prochain retrait automatiquement |
| Différé | Accumulé en dette mensuelle (`storage_debt`), déduit au prochain `requestPayout` (F-05) |

> **Règle F-06 :** Facture impayée depuis > 30 jours → le vendeur ne peut plus retirer ses produits de l'entrepôt. Le cron `notifyOverdueStorageDebts` (toutes les 24h) envoie une alerte in-app.

### 8.6 Facturation — `/vendor/billing`

- Toutes les factures de stockage avec statut
- Montant de dette mensuelle accumulée
- Historique des règlements

### 8.7 Retrait physique — récupérer des produits stockés

Un vendeur peut demander à récupérer physiquement tout ou partie de ses produits stockés à l'entrepôt (retour fournisseur, liquidation, etc.).

**Flux :**
```
[Vendor] Clique "Retrait" sur un article in_stock
    │
    ▼
storage.mutations.requestWithdrawal
    ├── Vérifie statut in_stock + quantité disponible
    ├── Vérifie absence de retrait en cours pour cet article
    └── Insert storage_withdrawals { status: "pending" }

[Admin] Voit la liste des retraits en attente (/admin/storage)
    ├── "Approuver" → status: "approved" (l'agent prépare les articles)
    ├── "Marquer remis" → status: "processed" → décrémente actual_qty + warehouse_qty
    └── "Refuser" → status: "cancelled"
```

> **Règle F-06 :** Un retrait peut être refusé si la boutique a une facture impayée depuis > 30 jours.

### 8.8 Matrice des scénarios vendeur

Tous les scénarios sont supportés — le vendeur peut activer l'un, l'autre, les deux, ou aucun des services :

| Scénario | `has_storage_plan` | Livraison Pixel-Mart | Comportement |
|----------|--------------------|---------------------|--------------|
| **Aucun service** | `false` | Non | Livraison manuelle par le vendeur. Pas d'accès à `/vendor/storage`. Les commandes doivent être traitées et expédiées manuellement. |
| **Stockage seul** | `true` | Non | Le vendeur stocke ses produits à l'entrepôt, mais organise sa propre livraison. Peut demander des **retraits physiques** depuis l'entrepôt. L'indicateur "Cmdes en attente" reste visible pour opportunités de lot entrepôt. |
| **Livraison seule** | `false` | Oui | Le vendeur prépare ses commandes depuis ses propres locaux et crée des **lots de livraison standard** (`is_warehouse_batch: false`). Pas d'accès à `/vendor/storage`. |
| **Stockage + Livraison** | `true` | Oui | Flux complet : stock à l'entrepôt → commandes entrantes → lot entrepôt (`is_warehouse_batch: true`) → agent prépare depuis le stock → livraison. `items[].storage_code` est peuplé automatiquement à la création du lot. |

**Conséquences sur l'inventaire :**
- Lot entrepôt complété (admin) → `products.warehouse_qty` et `storage_requests.actual_qty` décrémentés automatiquement
- Retrait physique traité (admin) → idem

---

## 9. Dashboard vendeur — Publicités

### 9.1 Emplacements disponibles — `/vendor/ads`

Les emplacements sont créés par l'admin dans `/admin/ads`. Chaque emplacement a un nombre de slots simultanés (`max_slots`).

| Emplacement | Position | Format |
|-------------|----------|--------|
| Hero principal | Haut de la homepage | Bannière pleine largeur |
| Bannière milieu | Section centrale homepage | Format intermédiaire |
| Card produit | Grille produits | Format card |
| Spotlight | Mise en avant premium | Format spotlight |

### 9.2 Réserver un espace

```
[Vendor] Choisit emplacement + dates + contenu
    │
    ▼
ads.mutations.createBooking
    ├── Calcule prix : durée_jours × base_price × demand_multiplier × peak_multiplier
    ├── Vérifie slots disponibles pour les dates choisies
    │   ├── Slots disponibles → status: "pending"
    │   └── Slots pleins      → status: "queued" (en liste d'attente)
    ├── Insert ad_booking
    └── Scheduler → initiateAdPayment → POST Moneroo /payments

[Webhook ad_payment.success]
    └── confirmAdPayment → status: "confirmed", priority: 50

[Cron processAdBookings — toutes les 15min]
    ├── "confirmed" + starts_at ≤ maintenant → "active"
    └── "active" + ends_at < maintenant → "completed"
```

### 9.3 Tarification dynamique

Le prix d'un emplacement varie selon :
- **Durée** : quotidien / hebdomadaire / mensuel
- **Demande** : `demand_multiplier` (ex: 1.5 en période de forte demande)
- **Périodes de pointe** : `peak_periods` (soldes, fêtes, événements) — multiplicateur additionnel

### 9.4 Système de priorité d'affichage

Quand plusieurs publicités sont actives sur le même slot :

| Priorité | Qui | Comportement |
|----------|-----|-------------|
| 100 | Admin | Toujours affiché en premier — override tout |
| 50 | Vendeur ayant payé | Rotation équitable entre vendeurs payants |
| 10 | File d'attente | Affiché seulement si slot libre |
| 0 | Contenu organique | Fallback quand aucune pub |

---

## 10. Dashboard vendeur — Analytics, avis, coupons

### 10.1 Analytics — `/vendor/analytics`

**Filtres disponibles :**
- Période : 7 jours, 30 jours, 90 jours
- Source : Toutes | Marketplace (`/products`) | Boutique personnalisée (`/shop/[slug]`)

**Métriques retournées :**

| Métrique | Calcul | Comparaison |
|----------|--------|-------------|
| GMV | Somme `orders.total_amount` (payées) | vs période précédente (%) |
| Commandes | Count orders payées | vs période précédente (%) |
| Panier moyen (AOV) | GMV / commandes | vs période précédente (%) |
| Taux conversion | orders payées / total orders | — |
| Clients uniques | Count distinct customer_id | — |

**Graphiques :** courbe de revenu journalier, top 10 produits (revenu + unités vendues), répartition par catégorie.

> **Dépendance :** Les analytics sont calculées à la volée par Convex (pas de pré-agrégation). Performant jusqu'à ~50k commandes. Au-delà, envisager une table `analytics_snapshots`.

### 10.2 Avis clients — `/vendor/reviews`

- Vue tous les avis : note, commentaire, photos, date
- Filtres : par note (1–5), publiés / flaggés
- **Répondre à un avis** : réponse visible publiquement sur la fiche produit
- **Signaler un avis** : marque `flagged: true` → visible par l'admin pour modération

> **Dépendance :** Le vendeur ne peut pas supprimer un avis. Seul l'admin peut dépublier un avis flaggé. Les avis publiés recalculent `products.avg_rating` automatiquement.

### 10.3 Codes promo — `/vendor/coupons`

**Types de réductions :**

| Type | Valeur | Exemple |
|------|--------|---------|
| `percentage` | % (0–100) | 20% → champ `value: 20` |
| `fixed_amount` | Centimes | 2 000 FCFA → champ `value: 2000` |
| `free_shipping` | Frais de livraison offerts | champ `value: 0` |

**Restrictions optionnelles :**
- Montant minimum de commande
- Utilisations max totales + max par client
- Produits ou catégories spécifiques
- Fenêtre de validité (dates début/fin)

> **Dépendance :** Le code est validé au checkout via `coupons.queries.validate` (query Convex réactive). Si le code expire pendant que le client est sur la page checkout, la validation échoue à la création de la commande.

### 10.4 Messagerie — `/vendor/messages`

Messagerie directe entre boutique et clients. Chaque conversation est un **thread** identifié par `"${store_id}_${customer_id}"`. Les threads peuvent être liés à une commande spécifique.

### 10.5 Notifications — `/vendor/notifications`

**Événements notifiés (email + in-app + push) :**

| Événement | Déclencheur |
|-----------|------------|
| Nouvelle commande payée | Webhook `payment.success` |
| Commande annulée | Client ou système |
| Stock faible | Cron `checkLowStock` (toutes les 4h) |
| Virement complété | Webhook `payout.completed` |
| Virement échoué | Webhook `payout.failed` |
| Nouvel avis client | Cron `autoPublishReviews` |
| Demande de retour | Client |
| Stockage réceptionné | Agent |
| Stockage validé / rejeté | Admin |
| Facture stockage créée | Admin (validation) |
| Dette stockage déduite | Lors d'un retrait |

**Push notifications :**
- Fonctionnent même navigateur fermé (Service Worker)
- Activables/désactivables par appareil
- Gérés par `/vendor/notifications` → toggle

---

## 11. Interface Agent d'entrepôt

**Route :** `/agent`

L'agent est l'opérateur physique de l'entrepôt. Il a accès à deux vues distinctes dans une interface à onglets.

### 11.1 Onglet "Scanner un colis" — Réceptionner

C'est l'action principale : réceptionner un colis apporté par un vendeur.

```
[Agent] Saisit le code PM-NNN
    │
    ▼
storage.queries.findByCode → affiche :
    ├── product_name (snapshot)
    ├── store_name (boutique du vendeur)
    ├── estimated_qty (ce que le vendeur avait estimé)
    └── status (doit être "pending_drop_off")

[Agent] Saisit les données réelles :
    ├── Type de mesure : "units" ou "weight"
    ├── Quantité réelle OU poids réel en kg
    └── Notes (état du colis, remarques)

[Agent] Valide → storage.mutations.receiveRequest
    ├── status → "received"
    ├── Stocke : agent_id, received_at, measurement_type, actual_qty/weight
    ├── Notifie admin in-app "PM-042 réceptionné"
    └── Notifie vendor in-app "Votre colis a été réceptionné"
```

> **Dépendance :** Si le code PM-NNN n'est pas trouvé ou si le statut n'est pas `pending_drop_off`, le scan échoue avec un message d'erreur. Un colis déjà réceptionné ne peut pas être scanné à nouveau.

### 11.2 Onglet "Pipeline" — Suivi global

Vue tableau de tous les colis en cours de traitement. Permet à l'agent de suivre l'ensemble du flux sans scanner un par un.

**Filtres disponibles :** Tous · En attente de dépôt · Réceptionnés · En stock · Rejetés

**Colonnes affichées :**

| Colonne | Source |
|---------|--------|
| Code PM | `storage_requests.storage_code` |
| Produit | `storage_requests.product_name` |
| Boutique | `stores.name` (jointure) |
| Statut | `storage_requests.status` |
| Qté estimée | `storage_requests.estimated_qty` |
| Qté réelle | `storage_requests.actual_qty` ou `actual_weight_kg` |
| Date réception | `storage_requests.received_at` |

> **Dépendance :** La query `listAllForAgent` utilise `requireAgent` — seuls les agents et admins peuvent voir tous les colis de tous les vendeurs. Un vendeur ne voit que ses propres colis via `getByStore`.

### 11.3 Validation (agent ou admin)

Après réception, l'agent **ou** l'admin peut valider le colis. La validation calcule et génère la facture.

```
storage.mutations.validateRequest
    ├── Calcule storage_fee (via grille tarifaire)
    ├── Insert storage_invoice {status: "unpaid"}
    ├── Si "deferred" → upsert storage_debt mensuelle
    ├── status → "in_stock"
    ├── Si product_id lié → product.quantity += actual_qty + product.warehouse_qty += actual_qty
    ├── Email vendor "Stockage validé"
    └── Email vendor "Facture générée — NNN FCFA"
```

### 11.4 Onglet "Expéditions" — Lots entrepôt à préparer

Quand un vendeur qui utilise **à la fois** le stockage et la livraison crée un lot `is_warehouse_batch: true`, ce lot apparaît dans l'onglet "Expéditions" de l'agent.

**Ce que l'agent voit :**
- Tous les lots entrepôt avec statut `transmitted`, `assigned` ou `in_progress`
- Codes de stockage (PM-NNN) des articles à prélever
- Détail par commande : articles, montant, mode de paiement (COD badge)
- Nom de la boutique

**Ce que l'agent fait :**
1. Prélève les articles au code PM-NNN indiqué
2. Prépare les colis pour livraison
3. L'admin passe le lot en `in_progress` puis `completed`
4. À la complétion : `products.warehouse_qty` et `storage_requests.actual_qty` sont décrémentés automatiquement

> **Dépendance :** Les `items[].storage_code` sont peuplés automatiquement par `createBatch` quand `isWarehouseBatch: true`, en faisant correspondre `product_id → storage_code` via les `storage_requests in_stock`.

---

## 12. Dashboard Admin

Le dashboard admin est accessible à `/admin/*`. Les pages visibles dépendent du rôle.

### 12.1 Qui voit quoi

| Page | `admin` | `finance` | `logistics` | `developer` | `marketing` |
|------|:-------:|:---------:|:-----------:|:-----------:|:-----------:|
| Vue d'ensemble | ✓ | ✓ | ✓ | ✓ | ✓ |
| Boutiques | ✓ | | | | |
| Utilisateurs | ✓ | | | | |
| Commandes | ✓ | | | | |
| Catégories | ✓ | | | | ✓ |
| Retraits | ✓ | ✓ | | | |
| Rapports | ✓ | ✓ | | | |
| Publicités | ✓ | ✓ | | | ✓ |
| Stockage | ✓ | ✓ | ✓ | | |
| Interface Agent | ✓ | | | | |
| Config plateforme | ✓ | | | ✓ | |
| Tarifs livraison | ✓ | | ✓ | | |
| Pays & Devises | ✓ | | ✓ | | |

### 12.2 Vue d'ensemble — `/admin/dashboard`

Trois onglets :

**Analytics** (sélecteur 7j / 30j / 90j)

| KPI | Description | Comparaison |
|-----|-------------|------------|
| GMV | Volume total de ventes | vs période précédente |
| Commissions | Revenus de commission plateforme | vs période précédente |
| Commandes payées | Nombre + panier moyen | vs période précédente |
| Taux de conversion | payées / total | — |
| Nouveaux utilisateurs | — | vs période précédente |
| Nouvelles boutiques | — | vs période précédente |
| Revenus nets plateforme | commissions + pub + stockage | — |
| Revenus publicitaires | — | — |
| Revenus stockage | — | — |

Graphiques : barres GMV + commissions par jour/semaine, camembert statuts commandes, camembert tiers boutiques, top 10 boutiques.

**Monitoring** — indicateurs de santé temps réel

| Indicateur | Seuil OK | Seuil WARN | Seuil CRITIQUE |
|------------|----------|-----------|----------------|
| Retraits en attente | 0 | < 48h d'âge | > 48h d'âge |
| Boutiques non vérifiées | 0 | ≤ 10 | > 10 |
| Boutiques bloquées (dette > 30j) | 0 | 1–5 | > 5 |
| Stockage à valider | 0 | ≤ 10 | > 10 |
| Commandes bloquées en "Payé" > 48h | 0 | 1–20 | > 20 |
| Paiements échoués (7j) | 0 | ≤ 10 | > 10 |

**Audit** — journal de toutes les actions admin

Filtrable par type : ban, rôle, vérification, suspension, retrait, config. Chaque événement affiche : action, cible, qui l'a fait, heure.

> **Dépendance :** Le journal d'audit (`platform_events`) est alimenté par toutes les mutations admin via la fonction helper `logEvent`. Il est immuable.

### 12.3 Gestion des utilisateurs — `/admin/users`

**Actions disponibles :**

| Action | Qui peut | Effet |
|--------|---------|-------|
| Bannir | `admin` | `users.is_banned: true` → accès immédiatement refusé |
| Débannir | `admin` | `users.is_banned: false` |
| Changer le rôle | `admin` | Modifie `users.role` + log audit |
| Supprimer le compte | `admin` | Hard-delete Better Auth (sessions, accounts, auth user) + Convex users record |

**Suppression d'un utilisateur — ce qui se passe :**
```
admin.mutations.deleteUser
    ├── Guard : role ∈ ADMIN_ROLES ? → throw (impossible de supprimer un admin)
    ├── Supprime toutes les sessions Better Auth
    ├── Supprime tous les comptes liés (Google, etc.)
    ├── Supprime l'utilisateur Better Auth
    ├── Supprime notifications, push_subscriptions
    ├── Supprime le users record Convex
    └── Log audit "user_deleted"
```

**Bulk actions** — sélection multiple avec checkboxes :
- Bannir en masse (exclut les admins)
- Débannir en masse
- Supprimer en masse (exclut les admins — confirmation par saisie email individuelle)

> **Important :** La suppression d'un utilisateur est **irréversible** et efface ses données d'authentification. Les commandes et transactions passées sont conservées (données anonymisées via `customer_name: "Client inconnu"`).

### 12.4 Gestion des boutiques — `/admin/stores`

**Cards stats :** Total · Non vérifiées (badge rouge) · Actives · Suspendues

**Actions sur une boutique :**

| Action | Effet |
|--------|-------|
| Vérifier | `stores.is_verified: true` + log + notif vendeur |
| Suspendre (avec raison) | `stores.status: "suspended"` + log + notif vendeur |
| Réactiver | `stores.status: "active"` + log + notif vendeur |

**Bulk actions :**
- Vérifier en masse (ignore les déjà vérifiées)
- Suspendre en masse (avec une raison commune)

> **Dépendance :** Une boutique suspendue rend tous ses produits invisibles sur la marketplace. Les commandes existantes continuent leur cycle normalement.

### 12.5 Commandes — `/admin/orders`

Vue de toutes les commandes de la plateforme. Recherche par numéro de commande, boutique, email client. Filtre par statut. Résumé : nombre, GMV total, commissions totales sur la sélection filtrée.

**Bulk selection (display) :** Sélection de commandes avec affichage du GMV total sélectionné.

### 12.6 Retraits — `/admin/payouts`

Liste des retraits en attente (`status: "pending"`), triés du plus ancien au plus récent (FIFO).

**Pour chaque retrait :**
- Boutique, montant net, méthode, coordonnées de paiement
- Bouton "Approuver" ou "Rejeter" (avec motif)

> **Dépendance :** L'approbation admin déclenche `initializePayoutViaMoneroo` action → appel Moneroo → webhook de retour confirme ou échoue. Si Moneroo échoue, le solde est automatiquement re-crédité.

### 12.7 Stockage — `/admin/storage`

Vue de tous les colis en statut `received` (réceptionnés par l'agent, en attente de validation admin), **et** des retraits physiques en attente.

**Section "Validation des dépôts" :**
- Code PM, boutique, produit, quantité/poids mesurés par l'agent
- Notes de l'agent
- Boutons : Valider (choisir mode paiement) ou Rejeter (avec raison)

**Section "Retraits en attente" :** (apparaît si des retraits sont en cours)
- Boutique, produit, code PM, quantité demandée, raison
- Bouton "Traiter" → dialog : Approuver / Marquer remis / Refuser
- "Marquer remis" décrémente `storage_requests.actual_qty` et `products.warehouse_qty`

> **Dépendance :** La validation par l'admin est le déclencheur de la facture. C'est à ce moment que la tarification est calculée et que `product.quantity` et `product.warehouse_qty` sont mis à jour si le colis est lié à un produit catalogue.

### 12.8 Rapports — `/admin/reports`

Rapport d'activité imprimable. Sélecteur de période (7j / 30j / 90j).

**Contenu :**
1. Totaux plateforme (utilisateurs, boutiques, commandes totales)
2. KPIs de la période (GMV, commissions, revenus nets, conversion, AOV)
3. Répartition des commandes par statut (tableau avec %)
4. Top boutiques par GMV (tableau)
5. Journal d'audit (50 dernières actions)

**Impression :** Bouton "Imprimer / PDF" → `window.print()`. Les filtres et boutons sont masqués à l'impression (`print:hidden`).

> **Pour un rapport PDF propre :** Utiliser Chrome → Imprimer → Enregistrer en PDF. Le rapport utilise la classe `print:hidden` sur tous les éléments interactifs.

### 12.9 Configuration plateforme — `/admin/config`

Permet de modifier les constantes financières sans redéployer le code.

| Clé | Défaut (constants.ts) | Description |
|-----|----------------------|-------------|
| `commission_rate_free` | 500 (5%) | Commission boutiques Free |
| `commission_rate_pro` | 300 (3%) | Commission boutiques Pro |
| `commission_rate_business` | 200 (2%) | Commission boutiques Business |
| `min_payout_amount` | 65 500 | Retrait minimum (centimes) |
| `balance_release_delay_ms` | 172 800 000 | Délai 48h (ms) |
| `order_cancel_window_ms` | 7 200 000 | Fenêtre annulation 2h (ms) |
| `return_window_days` | 14 | Fenêtre retours (jours) |

> **Dépendance :** Les valeurs dans `platform_config` ont priorité sur `constants.ts`. Si une clé n'existe pas dans `platform_config`, le code utilise la constante de `constants.ts` comme fallback.

### 12.10 Catégories — `/admin/categories`

Arbre de catégories à 2 niveaux (racine + sous-catégorie). L'admin (ou marketing) crée, modifie, réordonne.

> **Dépendance :** Sans catégories actives, les vendeurs ne peuvent pas créer de produits (le champ `category_id` est obligatoire). La création de catégories est donc un prérequis au lancement.

### 12.11 Livraison — `/admin/delivery`

Interface à deux onglets :

**Onglet "Lots de livraison" (badge rouge si lots transmis en attente) :**

KPIs : Transmis · Assignés · En cours · Complétés aujourd'hui · Total frais

Tableau des lots avec :
- Numéro lot, boutique, zone, nb commandes, frais, statut
- Badge "Entrepôt" (icône entrepôt, fond teal) pour les lots `is_warehouse_batch: true`
- Actions selon statut : Assigner → En cours → Compléter (ou Annuler)
- Sheet latérale "Détail" avec liste des commandes + total COD

**Transitions gérées par `admin.mutations.updateBatchStatus` :**
```
transmitted → assigned → in_progress → completed
              └──────────────────────────────▶ cancelled (depuis 3 premiers états)
```
Chaque transition est loggée dans `platform_events` (audit trail).

À la complétion d'un lot **entrepôt** :
- `products.warehouse_qty` décrémenté pour chaque produit livré
- `storage_requests.actual_qty` décrémenté en conséquence

**Onglet "Tarifs" :**

Grille tarifaire complète configurée par admin/logistique.

| Type | Nuit | Distance | Base | Par km | Seuil poids | Surcharge/kg |
|------|------|----------|------|--------|------------|-------------|
| standard | non | 0–10 km | 500 FCFA | 50 FCFA/km | 5 kg | 100 FCFA/kg |
| urgent | non | 0–10 km | 1 000 FCFA | 80 FCFA/km | 5 kg | 150 FCFA/kg |
| fragile | non | 0–20 km | 800 FCFA | 60 FCFA/km | 3 kg | 200 FCFA/kg |
| standard | oui | 0–10 km | 700 FCFA | 60 FCFA/km | 5 kg | 100 FCFA/kg |
| ... | ... | ... | ... | ... | ... | ... |

> **Dépendance :** Ces tarifs sont utilisés par `delivery.queries.getRate` au checkout pour calculer les frais affichés au client. Une modification est effective immédiatement pour tous les nouveaux checkouts.

### 12.12 Pays & Devises — `/admin/countries`

Active ou désactive les pays pour la marketplace. Par défaut tous les pays sont actifs sauf override dans `country_config`.

### 12.13 Publicités — `/admin/ads`

L'admin peut créer des réservations publicitaires **gratuites** (`payment_status: "waived"`, `priority: 100`) pour mettre en avant du contenu officiel Pixel-Mart.

---

## 13. Cycles de vie & machines d'état

### 13.1 Commandes — machine d'état stricte

```
pending ────────────────────────────────────────────────▶ cancelled
   │                                                     (client < 2h, ou cron > 2h si non payée)
   │ (webhook payment.success)
   ▼
 paid ──────────────────────────────────────────────────▶ cancelled
   │                                                     (client/vendor < 2h + remboursement auto)
   │ (vendor)
   ▼
processing ────────────────────────────────────────────▶ cancelled
   │                                                     (vendor + remboursement auto)
   │ (vendor + numéro suivi)
   ▼
shipped
   │
   │ (client OU cron +7j)
   ▼
delivered ─────────────────────────────────────────────▶ refunded
   │                                                     (admin/vendor + remboursement Moneroo)
   │ (cron +48h)
   ▼
[solde libéré — store.balance]
```

**Transitions INTERDITES :** `delivered → cancelled` · `shipped → paid` · `refunded → any` · `cancelled → any`

### 13.2 Virements (Payouts)

```
pending → processing → completed
                    → failed (re-crédit automatique store.balance)
```

| Statut | Qui | Quand |
|--------|-----|-------|
| `pending` | Système | À la création de la demande |
| `processing` | Webhook Moneroo | Après `initializePayoutViaMoneroo` |
| `completed` | Webhook `payout.completed` | Moneroo confirme |
| `failed` | Webhook `payout.failed` | Moneroo échoue |

### 13.3 Demandes de stockage

```
pending_drop_off → received → in_stock
                           → rejected
```

| Statut | Qui l'atteint | Comment |
|--------|--------------|---------|
| `pending_drop_off` | Système | Création par vendor |
| `received` | Agent | Scan + mesures |
| `in_stock` | Agent ou Admin | Validation + facture |
| `rejected` | Admin | Avec raison |

### 13.4 Retours produits

```
requested → approved → received → refunded
          → rejected
```

### 13.5 Lots de livraison

```
pending → transmitted → assigned → in_progress → completed
        └─────────────────────────────────────▶ cancelled
```

| Statut | Qui | Action |
|--------|-----|--------|
| `pending` | Vendor | Lot créé |
| `transmitted` | Vendor | Lot soumis à l'admin |
| `assigned` | Admin | Livreur désigné |
| `in_progress` | Admin | Livraison en cours |
| `completed` | Admin | Livraison terminée · Si lot entrepôt : inventaire décrémenté |
| `cancelled` | Vendor / Admin | Annulation (depuis 3 premiers états) |

**Lot entrepôt** (`is_warehouse_batch: true`) : les `items[].storage_code` sont peuplés à la création du lot. À la complétion, `products.warehouse_qty` et `storage_requests.actual_qty` sont décrémentés.

### 13.6 Retraits de stock (storage_withdrawals)

```
pending → approved → processed
        └─────────▶ cancelled
approved ──────────▶ cancelled
```

| Statut | Qui | Action |
|--------|-----|--------|
| `pending` | Vendor | Demande soumise depuis `/vendor/storage` |
| `approved` | Admin | Retrait autorisé, agent prépare |
| `processed` | Admin | Articles remis physiquement · décrémente actual_qty + warehouse_qty |
| `cancelled` | Admin | Retrait refusé |

### 13.8 Réservations publicitaires

```
pending → confirmed → active → completed
        → cancelled
queued  → (libération d'un slot) → pending → ...
```

### 13.9 Avis clients

```
is_published: false (< 24h)
    │
    │ (cron autoPublishReviews, toutes les heures)
    ▼
is_published: true (si non flaggé)
    OR
flagged: true (si signalé) → modération admin → dépublication possible
```

---

## 14. Système de notifications

Chaque événement important déclenche simultanément 3 canaux.

### 14.1 Les 3 canaux

| Canal | Comment | Quand ça arrive |
|-------|---------|-----------------|
| **In-app** | Badge rouge dans la nav, liste `/notifications` | Instantané (Convex reactivity) |
| **Email** | Via Resend, template React Email | Quelques secondes (async) |
| **Push** | Notification navigateur (même fermé) | Quelques secondes (via Service Worker) |

> **Dépendance :** Les canaux email et push sont **non-bloquants**. Si Resend est en panne, la mutation (ex: confirmPayment) réussit quand même. L'email sera perdu mais la transaction est commitée.

### 14.2 Tableau des événements

| Événement | Destinataire | Email | In-app | Push |
|-----------|-------------|:-----:|:------:|:----:|
| Nouvelle commande payée | Vendeur | ✓ | ✓ | ✓ |
| Commande payée (confirmation) | Client | ✓ | ✓ | ✓ |
| Commande en préparation | Client | ✓ | ✓ | ✓ |
| Commande expédiée | Client | ✓ | ✓ | ✓ |
| Commande livrée | Client | ✓ | ✓ | ✓ |
| Commande annulée | Client | ✓ | ✓ | ✓ |
| Stock faible | Vendeur | ✓ | ✓ | ✓ |
| Virement complété | Vendeur | ✓ | ✓ | ✓ |
| Virement échoué | Vendeur | | ✓ | |
| Nouvel avis client | Vendeur | ✓ | ✓ | ✓ |
| Demande de retour | Vendeur + Client | ✓ | ✓ | ✓ |
| Statut retour changé | Vendeur + Client | ✓ | ✓ | ✓ |
| Demande stockage créée | Vendeur | ✓ | ✓ | ✓ |
| Demande stockage créée | Admin (tous) | | ✓ | |
| Stockage réceptionné | Admin + Vendeur | | ✓ | |
| Stockage validé | Vendeur | ✓ | ✓ | ✓ |
| Stockage rejeté | Vendeur | ✓ | ✓ | ✓ |
| Facture stockage créée | Vendeur | ✓ | ✓ | ✓ |
| Dette stockage déduite | Vendeur | ✓ | ✓ | ✓ |
| Boutique vérifiée | Vendeur | | ✓ | ✓ |
| Boutique suspendue | Vendeur | | ✓ | |
| Nouveau retrait à traiter | Admin (tous) | | ✓ | |

### 14.3 Activer les push notifications

1. Aller sur `/vendor/notifications`
2. Cliquer "Activer les notifications push"
3. Autoriser dans le navigateur (popup permission)
4. La subscription est enregistrée côté serveur

> **Dépendance :** Chaque appareil/navigateur a sa propre subscription. Sur mobile Chrome + PC Firefox = 2 subscriptions. Si la subscription expire (navigateur réinstallé, endpoint invalide) → le serveur reçoit un `410 Gone` et supprime automatiquement l'entrée (`removeStale`).

---

## 15. Récapitulatif des routes

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
| `/checkout/payment-callback` | Retour Moneroo |
| `/checkout/confirmation` | Page post-paiement |
| `/orders` | Mes commandes |
| `/orders/[id]` | Détail d'une commande |
| `/orders/[id]/return` | Demande de retour |
| `/notifications` | Centre de notifications |
| `/about` `/privacy` `/terms` `/faq` | Pages statiques |

### Vendeur

| Route | Page |
|-------|------|
| `/vendor/dashboard` | Tableau de bord KPI |
| `/vendor/products` | Catalogue produits |
| `/vendor/products/new` | Créer un produit |
| `/vendor/products/[id]/edit` | Éditer un produit |
| `/vendor/orders` | Liste des commandes |
| `/vendor/orders/[id]` | Détail & traitement |
| `/vendor/orders/returns` | Demandes de retour reçues |
| `/vendor/delivery` | Lots de livraison |
| `/vendor/delivery/[id]` | Détail d'un lot |
| `/vendor/analytics` | Analytics détaillés |
| `/vendor/finance` | Solde & transactions |
| `/vendor/finance/invoices` | Factures |
| `/vendor/finance/payouts` | Demandes de virement |
| `/vendor/storage` | Service stockage |
| `/vendor/billing` | Facturation stockage |
| `/vendor/ads` | Espaces publicitaires |
| `/vendor/ads/payment-callback` | Retour paiement pub |
| `/vendor/reviews` | Avis clients |
| `/vendor/coupons` | Codes promo |
| `/vendor/store/settings` | Paramètres boutique |
| `/vendor/store/theme` | Thème & apparence |
| `/vendor/store/meta` | Meta Pixel & boutique perso |
| `/vendor/notifications` | Centre de notifications + push |
| `/vendor/select-store` | Choisir boutique active (multi-boutiques) |
| `/vendor/settings` | Paramètres du compte |

### Boutique personnalisée

| Route | Page |
|-------|------|
| `/shop/[slug]` | Accueil boutique |
| `/shop/[slug]/products` | Catalogue |
| `/shop/[slug]/products/[slug]` | Fiche produit |
| `/shop/[slug]/cart` | Panier |
| `/shop/[slug]/checkout` | Checkout |
| `/shop/[slug]/checkout/payment-callback` | Retour Moneroo |
| `/shop/[slug]/checkout/confirmation` | Confirmation |

### Agent

| Route | Page |
|-------|------|
| `/agent` | Réception entrepôt (scanner + pipeline) |

### Admin

| Route | Rôles | Page |
|-------|-------|------|
| `/admin/dashboard` | Tous | Analytics + monitoring + audit |
| `/admin/users` | admin | Gestion utilisateurs (bulk actions) |
| `/admin/stores` | admin | Vérification boutiques (bulk actions) |
| `/admin/orders` | admin | Toutes les commandes |
| `/admin/categories` | admin, marketing | Arbre catégories |
| `/admin/payouts` | admin, finance | File de retraits à traiter |
| `/admin/reports` | admin, finance | Rapport d'activité imprimable |
| `/admin/storage` | admin, finance, logistics | Validation stockage |
| `/admin/ads` | admin, finance, marketing | Gestion publicités |
| `/admin/config` | admin, developer | Configuration plateforme |
| `/admin/delivery` | admin, logistics | Tarifs livraison |
| `/admin/countries` | admin, logistics | Pays actifs |

---

*Document maintenu dans `docs/PLATFORM_GUIDE.md` — mettre à jour à chaque nouvelle fonctionnalité majeure.*
