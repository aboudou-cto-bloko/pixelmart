# PIXEL-MART — Documentation Technique

> Marketplace multi-vendeurs pour les marchés africains. Next.js 15 · Convex · TypeScript · shadcn/ui
>
> 🌍 Production : **https://www.pixel-mart-bj.com**

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stack technique](#stack-technique)
3. [Variables d'environnement](#variables-denvironnement)
4. [Structure du dépôt](#structure-du-dépôt)
5. [Schéma de base de données](#schéma-de-base-de-données)
6. [Backend — Fonctions Convex](#backend--fonctions-convex)
7. [Frontend — Pages & Routes](#frontend--pages--routes)
8. [Architecture des composants](#architecture-des-composants)
9. [Règles métier critiques](#règles-métier-critiques)
10. [Machine d'états des commandes](#machine-détats-des-commandes)
11. [Flux de paiement (Moneroo)](#flux-de-paiement-moneroo)
12. [Système de notifications](#système-de-notifications)
13. [Système de publicités](#système-de-publicités)
14. [Module de stockage](#module-de-stockage)
15. [Système d'avis & Q&A](#système-davis--qa)
16. [Retours & Remboursements](#retours--remboursements)
17. [Emails transactionnels](#emails-transactionnels)
18. [Authentification](#authentification)
19. [Cron Jobs](#cron-jobs)
20. [Phases de développement](#phases-de-développement)

---

## Vue d'ensemble

```
┌───────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
│         Next.js 15 (App Router, React 19) — Vercel            │
│                                                               │
│  ┌───────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐  │
│  │Storefront │  │   Vendor     │  │  Agent   │  │ Admin  │  │
│  │  (public) │  │  Dashboard   │  │Dashboard │  │(🔲 WIP)│  │
│  └───────────┘  └──────────────┘  └──────────┘  └────────┘  │
└───────────────────────┬───────────────────────────────────────┘
                        │ Convex Client (WebSocket + HTTP)
┌───────────────────────▼───────────────────────────────────────┐
│                    CONVEX BACKEND                             │
│  Queries (reactive) · Mutations (transactional) · Actions     │
│  HTTP Actions (webhooks) · Cron Jobs · File Storage           │
└───────┬────────────────┬───────────────────┬──────────────────┘
        │                │                   │
   ┌────▼────┐    ┌──────▼──────┐    ┌───────▼──────┐
   │Moneroo  │    │   Resend    │    │  Nominatim   │
   │(Mobile  │    │   (Email)   │    │  (Geocoding) │
   │ Money)  │    └─────────────┘    └──────────────┘
   └─────────┘
```

---

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js (App Router, React 19) | 15.x |
| Backend | Convex (serverless, reactive DB) | ^1.32 |
| Auth | Better Auth via Convex component | 1.4.x |
| UI | shadcn/ui + Tailwind CSS v4 | — |
| Paiements | Moneroo (Mobile Money Afrique de l'Ouest) | — |
| Email | Resend + react-email | — |
| PDF | @react-pdf/renderer | ^4.3 |
| Animations | motion/react (Framer Motion v12) | ^12 |
| Notifications push | Web Push API + VAPID | — |
| Cartes | Leaflet + react-leaflet | ^1.9 / ^5 |
| Éditeur rich text | TipTap | ^3.20 |
| Graphiques | Recharts | 2.15 |
| Tests | Vitest + Playwright | — |
| Package manager | pnpm | — |

---

## Variables d'environnement

```bash
# Convex
CONVEX_DEPLOYMENT=prod:xxx
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://xxx.convex.site

# App
NEXT_PUBLIC_APP_URL=https://www.pixel-mart-bj.com
NEXT_PUBLIC_SITE_URL=https://www.pixel-mart-bj.com
SITE_URL=https://www.pixel-mart-bj.com
NEXT_PUBLIC_APP_NAME=Pixel-Mart

# Moneroo (paiements)
MONEROO_SECRET_KEY=pvk_...
MONEROO_WEBHOOK_SECRET=...

# Resend (emails)
RESEND_API_KEY=re_...

# Web Push (notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BA...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:noreply@pixel-mart-bj.com

# Optionnel — Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

---

## Structure du dépôt

```
pixelmart/
├── convex/                    # Backend Convex
│   ├── schema.ts             # SCHÉMA — source de vérité unique (25+ tables)
│   ├── auth.ts               # Configuration Better Auth
│   ├── http.ts               # Routes HTTP (webhooks uniquement)
│   ├── crons.ts              # Jobs planifiés
│   ├── lib/
│   │   ├── constants.ts      # Taux, délais, frais de stockage
│   │   └── ratelimits.ts     # Règles rate limiting
│   ├── migrations/
│   ├── [domain]/             # queries.ts · mutations.ts · actions.ts · helpers.ts
│   ├── push/                 # Web Push ("use node" — actions uniquement)
│   ├── emails/send.ts
│   └── notifications/        # send.ts · mutations.ts · queries.ts · helpers.ts
├── emails/                    # Templates React Email
│   ├── components/
│   │   ├── Layout.tsx        # Thème email style Apple
│   │   └── CTAButton.tsx
│   └── *.tsx                 # 15 templates transactionnels
├── public/
│   └── sw.js                 # Service Worker (Web Push)
├── src/
│   ├── app/
│   │   ├── (auth)/           # /login · /register · /forgot-password
│   │   ├── (marketing)/      # /landing
│   │   ├── (storefront)/     # Homepage, produits, boutiques, panier...
│   │   ├── (customer)/       # /orders · retours
│   │   ├── (vendor)/         # /vendor/* (24 pages)
│   │   ├── (agent)/          # /agent
│   │   └── (admin)/          # /admin/* (structure en place, pages 🔲 WIP)
│   ├── components/
│   │   ├── ui/               # shadcn/ui — NE PAS MODIFIER
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── organisms/
│   │   ├── templates/
│   │   ├── layout/           # HeaderNav · VendorSidebar · AgentSidebar
│   │   ├── notifications/    # NotificationList · PushNotificationsSettings
│   │   ├── storage/templates/
│   │   ├── agent/templates/
│   │   └── marketing/
│   ├── constants/
│   │   ├── routes.ts         # ROUTES + SHOP_ROUTES
│   │   └── vendor-nav.ts     # Navigation vendeur
│   ├── hooks/                # 10 hooks custom (push, cart, notifications...)
│   ├── lib/
│   │   ├── format.ts         # formatPrice() · formatDate()
│   │   └── utils.ts          # cn()
│   └── providers/
├── docs/
│   ├── ATOMIC_DESIGN_GUIDE.md
│   ├── CODE_STYLE_GUIDE.md
│   ├── CONTRIBUTING.md
│   ├── CONVEX_PATTERNS.md
│   └── ADMIN_DASHBOARD_GUIDE.md  # Spec complète dashboard admin
└── e2e/                       # Tests Playwright
```

---

## Schéma de base de données

### Tables (25+)

| Table | Description |
|-------|-------------|
| `users` | Profils (email, rôle, active_store_id, push_enabled) |
| `stores` | Boutiques (balance, pending_balance, tier, is_verified) |
| `categories` | Catégories 2 niveaux |
| `products` | Catalogue (slug, price/centimes, stock, warehouse_qty) |
| `product_variants` | Variantes SKU |
| `product_specs` | Spécifications clé-valeur |
| `orders` | Commandes (lifecycle complet + storage_codes) |
| `order_events` | Journal immuable des événements |
| `transactions` | Livre de compte immuable (F-01) |
| `reviews` | Avis (achat vérifié, réponse vendeur) |
| `product_questions` | Q&A produit |
| `coupons` | Codes de réduction |
| `messages` | Chat vendeur–client |
| `notifications` | Centre de notifications (dual-channel) |
| `payouts` | Retraits vendeurs |
| `return_requests` | Demandes de retour |
| `ad_spaces` | Emplacements publicitaires |
| `ad_bookings` | Réservations pub (dates, budget) |
| `delivery_batches` | Lots de livraison |
| `storage_requests` | Demandes stockage entrepôt |
| `storage_invoices` | Factures frais stockage |
| `storage_debt` | Dette mensuelle cumulée |
| `delivery_rates` | Grilles tarifaires livraison |
| `push_subscriptions` | Abonnements Web Push |
| `waitlist` | Liste d'attente |

---

## Backend — Fonctions Convex

### Domaines principaux

| Domaine | Queries | Mutations | Actions |
|---------|---------|-----------|---------|
| `users` | `getMe` | `updateProfile`, `switchActiveStore` | — |
| `stores` | `getBySlug`, `getVendorStore` | `updateStore`, `generateUploadUrl` | — |
| `products` | `getBySlug`, `search`, `listByStore` | `create`, `update` | — |
| `orders` | `getById`, `listByStore` | `createOrder`, `updateStatus`, `cancelOrder` | — |
| `payments` | `getOrderForPayment` | `confirmPayment`, `failPayment` | `initializePayment`, `verifyPayment` |
| `payouts` | `list`, `getPayoutEligibility` | `requestPayout` | `initializePayoutViaMoneroo` |
| `notifications` | `unreadCount`, `list` | `markRead` | 15 dispatchers dans `send.ts` |
| `push` | `listMine`, `getStatus` | `subscribe`, `setEnabled` | `sendToUser` (`"use node"`) |
| `ads` | `getActiveAdsForSlot` | `createBooking` | `initiateAdPayment` |
| `storage` | `getByStore`, `getByCode` | `createRequest`, `receiveRequest`, `validateRequest` | `initializeStoragePayment` |
| `dashboard` | `getVendorDashboard` | — | — |

### Règles architecturales

```
mutations  → JAMAIS d'appel API externe, JAMAIS de await import()
queries    → JAMAIS de await import(), JAMAIS d'écriture
actions    → Appels API externes OK, "use node" requis pour Node.js built-ins
httpAction → JAMAIS de ctx.db direct → passer par ctx.runMutation/runQuery
```

> **Important** : `await import(...)` (import dynamique) n'est **pas supporté** dans le runtime edge des mutations et queries Convex. Utiliser des imports statiques en haut du fichier.

---

## Frontend — Pages & Routes

### Authentification (email/mot de passe uniquement)

| Route | Description |
|-------|-------------|
| `/login` | Connexion |
| `/register` | Inscription |
| `/forgot-password` | Réinitialisation |
| `/reset-password` | Nouveau mot de passe |

### Storefront — Public

| Route | Description |
|-------|-------------|
| `/` | Homepage (hero, deals, best-sellers, boutiques...) |
| `/products/[slug]` | Fiche produit (lightbox images, Q&A, avis) |
| `/categories/[slug]` | Catalogue par catégorie |
| `/stores/[slug]` | Boutique vendeur |
| `/cart` | Panier |
| `/checkout` | Tunnel de commande |
| `/checkout/payment-callback` | Retour Moneroo |
| `/notifications` | Centre de notifications |
| `/landing` | Page marketing principale |
| `/about`, `/faq`, `/terms`, `/contact` | Pages institutionnelles |

### /shop/[storeSlug] — Boutique dédiée par vendeur
Tunnel complet isolé : cart → checkout → payment-callback → confirmation.

### Dashboard vendeur (24 routes)

| Route | Description |
|-------|-------------|
| `/vendor/select-store` | Choix boutique active (multi-boutiques) |
| `/vendor/dashboard` | KPIs : revenus, commandes, alertes stock |
| `/vendor/products` | Catalogue + actions bulk |
| `/vendor/products/new` | Créer produit (variantes, specs, images, description rich text) |
| `/vendor/products/[id]/edit` | Modifier produit |
| `/vendor/orders` | Liste commandes filtrables par statut |
| `/vendor/orders/[id]` | Détail + actions (processing, expédié, remboursement) |
| `/vendor/orders/returns` | Demandes de retour clients |
| `/vendor/delivery` | Lots de livraison |
| `/vendor/delivery/[id]` | Détail lot + génération PDF |
| `/vendor/storage` | Demandes de stockage entrepôt |
| `/vendor/billing` | Factures stockage + dette mensuelle |
| `/vendor/finance` | Vue financière globale |
| `/vendor/finance/payouts` | Demandes et historique de retraits |
| `/vendor/finance/invoices` | Historique factures |
| `/vendor/ads` | Réservation espaces publicitaires |
| `/vendor/analytics` | Revenus par produit/période |
| `/vendor/coupons` | Codes de réduction |
| `/vendor/reviews` | Avis clients + réponses vendeur |
| `/vendor/store/settings` | Infos boutique, logo, bannière, contact |
| `/vendor/store/theme` | Couleur primaire + preset de thème |
| `/vendor/store/meta` | Meta Pixel ID + token CAPI |
| `/vendor/settings` | Compte, mot de passe, locale |
| `/vendor/notifications` | Notifications + paramètres push |

### Dashboard agent entrepôt

| Route | Description |
|-------|-------------|
| `/agent` | Réception colis : scanner code `PM-xxx` + entrer mesures |

### Dashboard admin (🔲 en cours)

| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Vue plateforme |
| `/admin/users` | Gestion utilisateurs |
| `/admin/stores` | Vérification boutiques |
| `/admin/categories` | Gestion catégories |
| `/admin/payouts` | Validation retraits |

Voir `docs/ADMIN_DASHBOARD_GUIDE.md` pour les spécifications complètes.

---

## Architecture des composants

Atomic Design strict :

```
ui/          → shadcn/ui (ne pas modifier)
atoms/       → primitives sans logique métier (Badge, PriceTag, StarRating, DiscountBadge)
molecules/   → compositions (ProductCard + lightbox, OrderStatusBadge, CartItem)
organisms/   → sections complètes avec data-fetching (HeroSection, BestSeller, ProductGrid)
templates/   → layouts full-page délégant aux organisms
pages/       → minimaux — passent searchParams/params aux templates
```

---

## Règles métier critiques

### F-01 : Journalisation des transactions
Toute variation de solde **DOIT** créer un enregistrement `transactions` dans **la même mutation**, avant le `db.patch` du solde.

### F-02 : Retrait minimum
655 XOF (65 500 centimes). Les frais sont déduits du montant brut. Le net doit rester > 0.

### F-03 : Libération du solde
Le solde est crédité uniquement quand `order.status === "delivered"` ET `delivered_at` > 48h. Géré par cron.

### F-04 : Calcul des commissions
```typescript
commission_amount = Math.round(total_amount * commission_rate / 10_000)
// Exemple : 1 000 000 centimes × 500 bp / 10 000 = 50 000 centimes (500 XOF)
```

### F-05 : Priorité dette de stockage
Lors d'un retrait, la `storage_debt` est déduite **en premier**, avant le calcul des frais.

### F-06 : Blocage stockage
Un vendeur avec une facture `fee_status: "unpaid"` de plus de 30 jours ne peut pas retirer ses produits physiques.

### Montants XOF ↔ Moneroo

**Règle critique** : XOF n'a pas de sous-unité. En DB, 5000 centimes = 5 000 FCFA (formatPrice ne divise pas). L'envoi à Moneroo et la réception du webhook se font sans conversion pour XOF :

```typescript
centimesToMonerooAmount(5000, "XOF")  // → 5000 (pas de ÷100)
monerooAmountToCentimes(5000, "XOF") // → 5000 (pas de ×100)
centimesToMonerooAmount(2900, "EUR")  // → 29 (÷100)
monerooAmountToCentimes(29, "EUR")   // → 2900 (×100)
```

---

## Machine d'états des commandes

```
PENDING ──(payment.success webhook)──► PAID ──(vendeur)──► PROCESSING
   │                                    │                       │
(< 2h, client ou timeout)         (< 2h, client)         (vendeur expédie)
   │                                    │                       │
CANCELLED ◄─────────────────────────────┘                 SHIPPED
                                                               │
                                                    (7j auto ou confirmation client)
                                                               │
                                                          DELIVERED ──► REFUNDED

TRANSITIONS INTERDITES : delivered→cancelled · refunded→any · cancelled→any
```

---

## Flux de paiement (Moneroo)

```
1. Client → "Payer" → api.payments.moneroo.initializePayment (Convex action)
2. → POST /v1/payments/initialize (Moneroo API)
3. ← checkout_url → redirect client
4. Client paie (MTN MoMo, Orange Money, Wave, Moov, Flooz)
5. Moneroo → POST /webhooks/moneroo (Convex HTTP action)
6. Vérification signature HMAC-SHA256
7. confirmPayment : order → paid + transaction + email + push
8. Client → /checkout/payment-callback (polling statut)
```

---

## Système de notifications

### Architecture triple canal

Chaque événement déclenche un `internalAction` dans `convex/notifications/send.ts` :
1. Notification in-app (table `notifications`, requête réactive)
2. Email via Resend (template React Email)
3. Web Push (si abonnement actif et push activé)

### Types de notifications

| Type | Destinataire | Email | Push |
|------|-------------|-------|------|
| `order_new` | Vendeur | ✅ | ✅ |
| `order_status` | Client | ✅ | ✅ |
| `low_stock` | Vendeur | ✅ | ❌ |
| `payment` | Vendeur | ✅ | ❌ |
| `new_review` | Vendeur | ✅ | ❌ |
| `return_status` | Vendeur + Client | ✅ | ❌ |
| `question` | Vendeur | ❌ | ✅ |
| `question_answered` | Client | ❌ | ✅ |
| `review_replied` | Client | ❌ | ✅ |
| `storage_validated` | Vendeur | ✅ | ❌ |
| `storage_rejected` | Vendeur | ✅ | ❌ |
| `storage_invoice` | Vendeur | ✅ | ❌ |
| `storage_debt_deducted` | Vendeur | ✅ | ❌ |

### Web Push
- Activé par défaut, désactivable dans `/vendor/notifications`
- Service Worker : `public/sw.js`
- `convex/push/actions.ts` : `"use node"` + librairie `web-push` + VAPID

---

## Système de publicités

### Emplacements

| Slot | Emplacement |
|------|-------------|
| `top_banner` | Barre promotionnelle haut de page |
| `hero_main` | Carousel hero homepage |
| `hero_side` | Side cards hero |
| `mid_banner` | Bannière milieu homepage |
| `featured_brand` | Boutiques populaires |
| `product_spotlight` | Mise en avant produit |

### Flux de réservation
Vendeur calcule prix → crée booking → paiement Moneroo (type `ad_payment`) → webhook confirme → affichage via `getActiveAdsForSlot`.

---

## Module de stockage

### Cycle de vie

```
PENDING_DROP_OFF → (agent) → RECEIVED → (admin) → IN_STOCK
                                              → REJECTED
```

### Codes de stockage
Format `PM-{3 chiffres}` ex. `PM-102`.

### Grille tarifaire

| Catégorie | Tarif |
|-----------|-------|
| Standard (< 5 kg, ≤ 50 unités) | 100 XOF/unité |
| Bulk (> 50 unités) | 60 XOF/unité |
| Moyen (5–25 kg) | 5 000 XOF forfait |
| Lourd (> 25 kg) | 5 000 XOF + 250 XOF/kg sup. |

---

## Système d'avis & Q&A

**Avis** : achat vérifié uniquement → note 1–5 + commentaire → réponse vendeur → notification `review_replied` au client.

**Q&A** : client pose une question → notification `question` au vendeur → vendeur répond → notification `question_answered` au client.

---

## Retours & Remboursements

Éligibilité : `order.status === "delivered"` + dans les 7 jours.

```
1. Client crée return_request (raison + photos)
2. Vendeur approuve/rejette
3. Si approuvé : remboursement Moneroo (admin)
4. order.payment_status → "refunded" + stock restauré
```

---

## Emails transactionnels

Expéditeur : `Pixel-Mart <noreply@pixel-mart-bj.com>`
Style : espacement Apple, responsive, couleur primaire brand.

| Template | Déclencheur | Destinataire |
|----------|-------------|-------------|
| `OrderConfirmation` | Paiement confirmé | Client |
| `NewOrder` | Paiement confirmé | Vendeur |
| `OrderStatusUpdate` | → processing | Client |
| `OrderShipped` | Expédié | Client |
| `OrderDelivered` | → delivered | Client |
| `OrderCancelled` | Annulation | Client |
| `LowStockAlert` | Stock < seuil | Vendeur |
| `PayoutCompleted` | Webhook payout | Vendeur |
| `ReturnStatusUpdate` | Changement statut retour | Vendeur + Client |
| `NewReview` | Avis publié | Vendeur |
| `StorageRequestReceived` | Demande créée | Vendeur |
| `StorageValidated` | Admin valide | Vendeur |
| `StorageRejected` | Admin rejette | Vendeur |
| `StorageInvoiceCreated` | Facture générée | Vendeur |
| `StorageDebtDeducted` | Dette déduite | Vendeur |

---

## Authentification

- **Provider** : Better Auth (email/mot de passe — OAuth Google supprimé)
- **Cookie** : `better-auth.session_token` (HTTP-only)
- **Déconnexion** : `authClient.signOut()` + `window.location.href = "/login"` (rechargement pour vider cache Convex)
- **Multi-boutiques** : vendeur avec plusieurs boutiques → `/vendor/select-store` au login

### Rôles RBAC

| Rôle | Espace | Guard |
|------|--------|-------|
| `customer` | `/orders`, `/cart` | `roles=["customer","vendor","admin"]` |
| `vendor` | `/vendor/*` | `roles=["vendor","admin"]` |
| `agent` | `/agent/*` | `roles=["agent","admin"]` |
| `admin` | `/admin/*` | `roles=["admin"]` |

---

## Cron Jobs

| Job | Fréquence | Action |
|-----|-----------|--------|
| Balance release | Toutes les heures | Libère soldes commandes livrées > 48h |
| Auto-delivered | Toutes les heures | Auto-delivered si expédié > 7 jours |
| Low stock check | Quotidien 6h | Alertes stock faible (seuil < 5) |
| Ad rotation | Toutes les heures | Désactive bookings expirés |

---

## Phases de développement

### Phase 0 — Fondations ✅ Complète
- Architecture complète (Convex + Next.js 15 + Better Auth + Moneroo)
- Storefront public (homepage, produits, boutiques, panier, checkout)
- Dashboard vendeur (24 pages)
- Paiements Mobile Money (commandes + retraits)
- Notifications email (15 templates, style Apple)
- Système d'avis et Q&A
- Module de stockage entrepôt complet
- Dashboard agent entrepôt
- Système de livraison par lots + PDF
- Publicités avec tarification dynamique
- Coupons de réduction
- Analytics vendeur
- Thème boutique personnalisable
- Meta Pixel (Facebook CAPI)

### Phase 1 — En cours 🔄
- ✅ Notifications in-app + Web Push (VAPID)
- ✅ Push pour Q&A et réponses aux avis
- ✅ Sélecteur boutique active (multi-boutiques)
- ✅ Correction conversion montants XOF ↔ Moneroo API
- ✅ Suppression Google OAuth
- 🔲 **Dashboard admin** (5 pages — voir `docs/ADMIN_DASHBOARD_GUIDE.md`)
- 🔲 Chat vendeur–client (messaging)
- 🔲 Programmes de fidélité

### Phase 2 — Planifiée
- Recommandations IA produits
- Prix dynamiques ML
- App mobile (React Native)
- Expansion régionale (Togo, Côte d'Ivoire, Sénégal)
