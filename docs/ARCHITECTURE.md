# Architecture — Pixel-Mart

## Vue d'ensemble

Pixel-Mart est une marketplace multi-vendeurs ciblant les marchés ouest-africains (Bénin / Cotonou). Elle offre une marketplace publique, des boutiques vendeurs indépendantes, un espace d'administration multi-rôles, une interface agent d'entrepôt, et un module de publicités.

```
┌──────────────────────────────────────────────────────────────────┐
│                         NAVIGATEUR CLIENT                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  ┌────────┐ │
│  │  Storefront  │  │   Vendor     │  │  Admin    │  │ Agent  │ │
│  │  (public)    │  │  /vendor/*   │  │  /admin/* │  │/agent  │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘  └───┬────┘ │
│         │                 │                │             │      │
│  Next.js 15 App Router — React 19 — Tailwind CSS v4              │
└─────────┬─────────────────┬────────────────┬─────────────┬──────┘
          │                 │                │             │
          ▼                 ▼                ▼             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      CONVEX (Serverless BaaS)                    │
│                                                                  │
│   Queries (reactive)  ·  Mutations (transactional)               │
│   Actions (external API)  ·  Crons  ·  HTTP routes               │
│                                                                  │
│   Auth component (Better Auth)  ·  Rate limiter                  │
└──────────────────────────────────────────────────────────────────┘
          │                 │                │
          ▼                 ▼                ▼
     ┌─────────┐      ┌──────────┐    ┌──────────┐
     │ Moneroo │      │  Resend  │    │  Meta    │
     │ (paiements│     │ (emails) │    │  CAPI    │
     │ retraits)│      └──────────┘    └──────────┘
     └─────────┘
```

---

## Stack technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Framework | Next.js 15 (App Router) | Routing, SSR/RSC, middleware edge |
| UI | React 19 + shadcn/ui + Tailwind CSS v4 | Composants, design system |
| Base de données | Convex | Réactive, serverless, temps réel |
| Auth | Better Auth via `@convex-dev/better-auth` | Sessions, email/password |
| Paiements | Moneroo | Mobile Money, virements bancaires (XOF) |
| Emails | Resend + react-email | Transactionnel, templates React |
| Push notifications | Web Push API + VAPID | Notifications navigateur |
| PDF | `@react-pdf/renderer` | Bons de livraison |
| Animation | motion/react (Framer Motion v12) | Animations UI |
| Rate limiting | `@convex-dev/ratelimiter` | Protection mutations publiques |
| Package manager | pnpm | Monorepo léger |

---

## Structure des répertoires

```
pixelmart/
├── convex/                     # Backend Convex
│   ├── schema.ts               # Schéma DB (source de vérité absolue)
│   ├── auth.ts                 # Config Better Auth + triggers onCreate/onDelete
│   ├── http.ts                 # Route HTTP POST /webhooks/moneroo
│   ├── crons.ts                # 8 tâches planifiées
│   ├── lib/
│   │   ├── constants.ts        # Taux commissions, frais stockage, délais
│   │   └── ratelimits.ts       # Rules rate limiter
│   ├── [domain]/               # 1 dossier par domaine métier
│   │   ├── queries.ts          # Lecture réactive (jamais d'écriture)
│   │   ├── mutations.ts        # Écriture transactionnelle (jamais d'API externe)
│   │   ├── actions.ts          # Appels API externes (Moneroo, Resend, webpush)
│   │   └── helpers.ts          # Fonctions pures, guards RBAC
│   └── _generated/             # Généré par `npx convex codegen` (ne pas éditer)
│
├── emails/                     # Templates React Email
│   └── *.tsx                   # 1 template par événement métier
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, register, reset password
│   │   ├── (marketing)/        # Landing page, accès preview
│   │   ├── (storefront)/       # Marketplace publique
│   │   ├── (customer)/         # Espace client authentifié
│   │   ├── (vendor)/           # Tableau de bord vendeur
│   │   ├── (admin)/            # Dashboard administrateur
│   │   ├── (agent)/            # Interface agent entrepôt
│   │   └── shop/[storeSlug]/   # Boutiques vendeurs indépendantes
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui (ne pas modifier)
│   │   ├── atoms/              # Primitives sans logique métier
│   │   ├── molecules/          # Compositions d'atoms
│   │   ├── organisms/          # Sections complètes avec data fetching
│   │   ├── templates/          # Layouts complets (reçoivent les données)
│   │   ├── admin/templates/    # Templates dashboard admin
│   │   ├── storage/templates/  # Templates module stockage
│   │   ├── agent/templates/    # Template interface agent
│   │   └── layout/             # Sidebars, nav globaux
│   │
│   ├── constants/              # Routes, nav items
│   ├── hooks/                  # Custom hooks React
│   ├── lib/                    # Utilitaires frontend (format.ts, utils.ts)
│   ├── providers/              # Context providers (Convex, auth)
│   └── middleware.ts           # Edge: gate preview + vérif session
│
└── public/
    └── sw.js                   # Service Worker Web Push
```

---

## Domaines Convex

| Domaine | Fichiers | Responsabilité |
|---------|----------|----------------|
| `users` | queries, mutations, helpers | Profils, RBAC, guards |
| `orders` | queries, mutations | Cycle de vie des commandes, stock |
| `payments` | webhooks, mutations, helpers, actions | Moneroo, confirmations, refunds |
| `payouts` | queries, mutations, actions | Retraits vendeurs vers Mobile Money |
| `products` | queries, mutations | Catalogue produits, variantes, specs |
| `stores` | queries, mutations | Boutiques, thèmes, settings |
| `storage` | queries, mutations | Module entrepôt Pixel-Mart |
| `notifications` | send, mutations, queries, helpers | Dispatch dual-channel in-app + email |
| `push` | actions, mutations, queries | Web Push notifications |
| `emails` | send | Envoi via Resend (actions "use node") |
| `reviews` | queries, mutations | Avis produits (achat vérifié) |
| `returns` | queries, mutations | Demandes de retour/remboursement |
| `coupons` | queries, mutations | Codes promo vendeurs |
| `delivery` | queries, mutations | Lots de livraison groupée (standard + entrepôt `is_warehouse_batch`) |
| `ads` | queries, mutations, actions | Espaces publicitaires, réservations |
| `analytics` | queries | KPIs vendeur (GMV, conversion, AOV) |
| `admin` | queries, mutations | Supervision plateforme, audit |
| `messages` | queries, mutations | Messagerie store ↔ client |
| `categories` | queries, mutations | Arbre catégories produits |
| `meta` | mutations, actions | Meta CAPI (Conversions API) |
| `seed` | data, mutations | Données de test (dev uniquement) |

---

## Rôles et espaces d'accès (RBAC)

| Rôle | Espace | Guard backend | Accès |
|------|--------|--------------|-------|
| `customer` | `/`, `/orders`, `/cart`, `/checkout` | `requireAppUser` | Marketplace, commandes |
| `vendor` | `/vendor/*`, `/shop/[slug]` | `requireVendor` | Dashboard vendeur complet |
| `agent` | `/agent` | `requireAgent` | Réception entrepôt uniquement |
| `admin` | `/admin/*` + tous les espaces | `requireSuperAdmin` | Supervision totale |
| `finance` | `/admin/dashboard`, `/admin/payouts`, `/admin/reports` | `requireAdmin` | Finances, rapports |
| `logistics` | `/admin/delivery`, `/admin/countries`, `/admin/storage` | `requireAdmin` | Logistique, entrepôt |
| `developer` | `/admin/config` | `requireAdmin` | Configuration technique |
| `marketing` | `/admin/categories`, `/admin/ads` | `requireAdmin` | Contenu, publicités |

**Double couche de protection** :
1. **Edge** : `src/middleware.ts` vérifie la présence du cookie `better-auth.session_token`
2. **Client** : `AuthGuard` composant vérifie `user.role ∈ allowedRoles[]`
3. **Backend** : chaque mutation/query appelle le helper guard approprié (throw si non autorisé)

---

## Gestion de la monnaie

Toute valeur monétaire est stockée en **centimes** (entiers). Pour le XOF (Franc CFA), il n'y pas de sous-unité : `1 centime = 1 FCFA`.

```
Stockage DB        → centimes (integer)
Affichage          → formatPrice(centimes, "XOF")   // XOF: pas de division
                   → formatPrice(centimes, "EUR")   // EUR: ÷ 100
API Moneroo envoi  → centimesToMonerooAmount()       // XOF: identity
API Moneroo reçu   → monerooAmountToCentimes()       // XOF: identity
Commission         → Math.round(total × rate / 10_000)
```

Devises sans sous-unité (pas de division par 100) : `XOF`, `XAF`, `GNF`, `CDF`.

---

## Règles invariantes (F-01 à F-06)

| Règle | Description | Où appliquée |
|-------|-------------|--------------|
| **F-01** | Toute modification de `balance`/`pending_balance` DOIT créer une `transactions` dans la même mutation | `payments/mutations`, `payouts/mutations`, `returns/mutations` |
| **F-02** | Retrait minimum : 65 500 centimes (655 XOF) | `payouts/mutations.requestPayout` |
| **F-03** | `pending_balance → balance` uniquement après `delivered_at + 48h` | `crons.releaseBalances` |
| **F-04** | Commission = `total_amount × commission_rate / 10_000` | `orders/mutations.createOrder`, `payments/mutations.confirmPayment` |
| **F-05** | `storage_debt` déduit en priorité avant calcul des frais de retrait | `payouts/mutations.requestPayout` |
| **F-06** | Retrait bloqué si facture stockage impayée > 30 jours | `payouts/mutations.requestPayout`, `crons.notifyOverdueStorageDebts` |

---

## Tâches planifiées (crons.ts)

| Cron | Fréquence | Action |
|------|-----------|--------|
| `releaseBalances` | Toutes les heures | `pending_balance → balance` pour les orders delivered > 48h (F-03) |
| `checkLowStock` | Toutes les 4h | Alerte vendeur si `quantity ≤ low_stock_threshold` |
| `checkStalePayouts` | Toutes les 12h | Relance payouts "processing" > 72h |
| `autoPublishReviews` | Toutes les heures | Publie les avis non-flaggés > 24h, recalcule `avg_rating` |
| `processAdBookings` | Toutes les 15min | `confirmed + starts_at ≤ now → active`, `active + ends_at < now → completed` |
| `expirePendingOrders` | Toutes les 30min | Orders "pending" (online) > 2h → "cancelled", restaure stock |
| `expireStaleStorageRequests` | Toutes les 6h | Storage requests "pending_drop_off" > 30j → "rejected" |
| `notifyOverdueStorageDebts` | Toutes les 24h | Alerte factures stockage impayées > 30j |
| `autoConfirmDelivery` | Toutes les 12h | Orders shipped > 7j sans confirmation → delivered |

---

## Webhook Moneroo (`/webhooks/moneroo`)

Point d'entrée unique pour tous les événements de paiement. **La signature HMAC-SHA256 est vérifiée en premier, avant tout traitement.**

| `event.type` | Destination |
|---|---|
| `payment.success` | `payments/mutations.confirmPayment` + `meta/mutations.trackPurchase` |
| `payment.failed` | `payments/mutations.failPayment` |
| `ad_payment.success` | `ads/mutations.confirmAdPayment` |
| `ad_payment.failed` | `ads/mutations.failAdPayment` |
| `payout.completed` | `payouts/mutations.confirmPayout` |
| `payout.failed` | `payouts/mutations.failPayout` |
| `storage_payment.success` | `storage/mutations.confirmStoragePayment` |
| `storage_payment.failed` | `storage/mutations.failStoragePayment` |

---

## Patterns de communication inter-modules

| Mécanisme | Usage | Comportement |
|-----------|-------|-------------|
| `ctx.scheduler.runAfter(0, internal.X, args)` | Envoi notifications/emails depuis mutations | Non-bloquant — la mutation est commitée même si l'action échoue |
| `ctx.runMutation(internal.X, args)` | Depuis httpActions (webhooks) | Exécution synchrone depuis l'action |
| `ctx.runAction(internal.X, args)` | Depuis actions (chaînage) | Action-to-action |
| `ctx.runQuery(internal.X, args)` | Depuis actions (lecture) | Ex: `push` lit les subscriptions |
| `cronJobs().interval(...)` | Tâches périodiques | Appelle internalMutations/Actions |

**Règle absolue** : les mutations ne font JAMAIS d'appels API externes. Elles utilisent `ctx.scheduler.runAfter` pour planifier une action qui fera l'appel.

---

## Contraintes runtime

| Contrainte | Règle |
|---|---|
| `"use node"` | Obligatoire pour `push/actions.ts`, `notifications/send.ts`, `emails/send.ts` — utilisent `web-push`, `resend`, `@react-email/render` |
| `await import(...)` | **Interdit** dans mutations/queries — runtime edge ne supporte pas les imports dynamiques |
| `ctx.db` | **Interdit** dans httpActions — passer par `ctx.runMutation`/`ctx.runQuery` |
| API externes | **Interdites** dans mutations — uniquement dans actions |
| Node.js built-ins | **Interdits** sans `"use node"` (crypto, https, net...) |
