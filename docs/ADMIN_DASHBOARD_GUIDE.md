# Guide du Dashboard Admin — Pixel-Mart

> Spécification complète des pages et fonctionnalités à implémenter pour le dashboard administrateur.
>
> **Statut** : Structure en place (`src/app/(admin)/`), pages à implémenter.
>
> **Accès** : Rôle `admin` uniquement — `AuthGuard roles={["admin"]}` déjà en place dans le layout.

---

## Vue d'ensemble

Le dashboard admin est la tour de contrôle de toute la plateforme Pixel-Mart. Il donne à l'équipe interne une visibilité complète sur les vendeurs, les utilisateurs, les flux financiers et le contenu.

### URL de base : `/admin`

### Navigation principale suggérée

```
Dashboard
├── Vue d'ensemble        /admin/dashboard
├── Utilisateurs          /admin/users
├── Boutiques             /admin/stores
├── Commandes             /admin/orders
├── Retraits              /admin/payouts
├── Catégories            /admin/categories
├── Publicités            /admin/ads
├── Stockage              /admin/storage
└── Paramètres            /admin/settings
```

---

## Page 1 — Vue d'ensemble (`/admin/dashboard`)

### Objectif
KPIs globaux de la plateforme en temps réel. Point d'entrée unique pour détecter les anomalies.

### Métriques à afficher

#### Ligne 1 — Chiffres clés du jour

| Métrique | Source Convex | Description |
|----------|--------------|-------------|
| Revenus du jour | `orders` where `created_at >= today` AND `payment_status = "paid"` | Somme des `total_amount` |
| Commandes du jour | idem | Count |
| Nouveaux vendeurs | `stores` where `created_at >= today` | Count |
| Nouveaux utilisateurs | `users` where `created_at >= today` | Count |

#### Ligne 2 — Alertes actives

| Alerte | Condition | Action |
|--------|-----------|--------|
| Retraits en attente | `payouts` where `status = "pending"` | Bouton → `/admin/payouts` |
| Boutiques non vérifiées | `stores` where `is_verified = false` | Bouton → `/admin/stores?filter=unverified` |
| Factures stockage impayées | `storage_invoices` where `fee_status = "unpaid"` AND `created_at < 30j` | Count |
| Demandes de stockage reçues | `storage_requests` where `status = "received"` | Bouton → `/admin/storage` |

#### Ligne 3 — Graphiques

- **Revenus 30 derniers jours** : graphique à barres (jour par jour)
- **Répartition des commandes par statut** : pie chart
- **Top 5 boutiques par revenus** : tableau

#### Ligne 4 — Activité récente

- 10 dernières commandes payées (store, montant, statut)
- 5 derniers retraits demandés

### Requêtes Convex à créer

```typescript
// convex/admin/queries.ts
export const getPlatformStats = internalQuery({ ... });
export const getDailyRevenue = internalQuery({ args: { days: v.number() }, ... });
export const getPendingAlerts = internalQuery({ ... });
```

---

## Page 2 — Utilisateurs (`/admin/users`)

### Objectif
Gérer tous les comptes (clients, vendeurs, agents). Suspension, réinitialisation, promotion de rôle.

### Liste principale

| Colonne | Champ |
|---------|-------|
| Nom | `users.name` |
| Email | `users.email` |
| Rôle | `users.role` (badge coloré) |
| Inscrit le | `users.created_at` |
| Statut | actif / suspendu / en attente vérif email |
| Actions | Voir · Suspendre · Changer rôle |

#### Filtres
- Rôle : tous / customer / vendor / agent / admin
- Statut : actif / suspendu
- Recherche : nom ou email (full-text)
- Tri : date inscription (récent), nombre de commandes

### Page détail utilisateur (`/admin/users/[id]`)

**Sections :**

1. **Informations** : nom, email, téléphone, date inscription, vérification email
2. **Boutiques** (si vendeur) : liste des boutiques avec liens
3. **Commandes** (si client) : 10 dernières commandes
4. **Actions** :
   - Suspendre / Réactiver le compte
   - Forcer réinitialisation mot de passe (envoi email)
   - Changer le rôle (`customer` ↔ `vendor`, promouvoir `agent`)
   - Supprimer le compte (soft delete)

### Requêtes Convex à créer

```typescript
// convex/admin/users/queries.ts
export const listUsers = query({ args: { role?, status?, search?, cursor? }, ... });
export const getUserDetail = query({ args: { userId: v.id("users") }, ... });

// convex/admin/users/mutations.ts
export const suspendUser = mutation({ args: { userId, reason }, ... });
export const changeUserRole = mutation({ args: { userId, newRole }, ... });
```

---

## Page 3 — Boutiques (`/admin/stores`)

### Objectif
Vérifier les nouvelles boutiques, gérer les suspensions, superviser les performances.

### Liste principale

| Colonne | Champ |
|---------|-------|
| Boutique | Logo + nom + slug |
| Propriétaire | Lien vers l'utilisateur |
| Statut | `is_verified` (badge) + actif/suspendu |
| Tier | `subscription_tier` (free/basic/premium) |
| Commandes | Count total |
| Revenus | Somme `total_amount` des commandes paid |
| Solde | `stores.balance` |
| Créée le | `stores.created_at` |
| Actions | Vérifier · Suspendre · Voir |

#### Filtres
- Statut vérification : toutes / non vérifiées / vérifiées
- Tier : free / basic / premium
- Recherche : nom, slug

### Page détail boutique (`/admin/stores/[id]`)

**Sections :**

1. **Infos** : nom, description, logo, bannière, contact, adresse retrait
2. **Propriétaire** : lien vers l'utilisateur
3. **Métriques** : commandes total, revenus, note moyenne, nb de produits
4. **Produits** : liste avec statut (actif/inactif)
5. **Transactions** : historique des crédits/débits
6. **Retraits** : historique des payouts
7. **Publicités** : bookings actifs

**Actions :**
- Vérifier la boutique (`is_verified = true`)
- Suspendre / Réactiver
- Modifier le tier d'abonnement
- Voir les factures de stockage

### Requêtes Convex à créer

```typescript
// convex/admin/stores/queries.ts
export const listStores = query({ args: { verified?, tier?, search?, cursor? }, ... });
export const getStoreDetail = query({ args: { storeId: v.id("stores") }, ... });

// convex/admin/stores/mutations.ts
export const verifyStore = mutation({ args: { storeId }, ... });
export const suspendStore = mutation({ args: { storeId, reason }, ... });
export const changeStoreTier = mutation({ args: { storeId, tier }, ... });
```

---

## Page 4 — Retraits (`/admin/payouts`)

### Objectif
Valider et exécuter les demandes de retrait des vendeurs. Point sensible : chaque action déclenche un vrai transfert Mobile Money.

### File d'attente des retraits en attente

**Affichage prioritaire** : tri par date de demande (FIFO), les plus anciens en premier.

| Colonne | Champ |
|---------|-------|
| Boutique | Nom + lien |
| Montant demandé | `payouts.amount` (formatPrice) |
| Frais déduits | `payouts.fee_amount` |
| Net à transférer | `payouts.net_amount` |
| Méthode | MTN / Orange Money / Wave |
| Numéro | `payouts.phone_number` |
| Demandé le | `payouts.created_at` |
| Actions | Approuver · Rejeter |

### Workflow d'approbation

```
1. Admin vérifie les détails (montant, méthode, numéro)
2. Clique "Approuver"
3. Confirmation avec récapitulatif (Dialog de confirmation)
4. → appel `initializePayoutViaMoneroo`
5. Moneroo envoie le virement Mobile Money
6. Webhook `payout.completed` → `confirmPayout`
7. Notification email + in-app au vendeur
```

**Bouton "Rejeter"** : ouvre un Dialog avec champ "Raison du refus" (obligatoire) → `failPayout` → notification vendeur.

### Historique des retraits

Tableau complet avec filtre par statut (pending / completed / failed) et recherche par boutique.

### Requêtes Convex à créer

```typescript
// convex/admin/payouts/queries.ts
export const listPendingPayouts = query({ ... });
export const listAllPayouts = query({ args: { status?, storeId?, cursor? }, ... });

// Les mutations existantes (confirmPayout, failPayout) suffisent
// L'action existante (initializePayoutViaMoneroo) suffit
```

---

## Page 5 — Catégories (`/admin/categories`)

### Objectif
Gérer la taxonomie produits. Hiérarchie 2 niveaux : catégorie parent → sous-catégories.

### Vue arborescente

```
📦 Électronique
   ├── Téléphones
   ├── Ordinateurs
   └── Accessoires
👗 Mode
   ├── Femme
   ├── Homme
   └── Enfants
🏠 Maison
   ...
```

### Actions par catégorie

- **Créer** : nom, slug (auto-généré), icône, catégorie parent (optionnel)
- **Modifier** : nom, icône, ordre d'affichage, statut actif/inactif
- **Supprimer** : uniquement si aucun produit associé (vérification avant suppression)
- **Réordonner** : drag-and-drop ou flèches haut/bas

### Formulaire de création/édition

| Champ | Type | Requis |
|-------|------|--------|
| Nom | Texte | ✅ |
| Slug | Texte (auto depuis nom) | ✅ |
| Catégorie parent | Select (optionnel) | ❌ |
| Icône | Emoji ou upload SVG | ❌ |
| Ordre | Nombre | ❌ |
| Actif | Toggle | ✅ |

### Requêtes Convex à créer

```typescript
// Les mutations existantes (create, update, remove) dans convex/categories/mutations.ts
// suffisent — les exposer en public (actuellement peut-être admin-only)
```

---

## Page 6 — Commandes (`/admin/orders`) — Optionnelle Phase 1

### Objectif
Vue globale de toutes les commandes de la plateforme (toutes boutiques confondues).

### Cas d'usage admin
- Rechercher une commande spécifique par numéro
- Forcer un changement de statut en cas de litige
- Déclencher un remboursement manuel
- Voir les commandes bloquées (ex : payées mais non traitées depuis > 48h)

---

## Page 7 — Stockage (`/admin/storage`) — Intégration existante

### Objectif
Valider les demandes de stockage reçues par les agents.

### Workflow

```
1. Agent scanne PM-xxx et entre les mesures → statut RECEIVED
2. Admin voit la demande dans la liste
3. Admin valide → calcul automatique des frais → génération facture → IN_STOCK
   OU admin rejette avec motif → REJECTED + notification vendeur
```

### Vue admin

- Liste des demandes avec `status = "received"` (en attente de validation)
- Détail : code PM, dimensions, poids, photos, vendeur
- Actions : Valider (avec frais calculés) | Rejeter (avec motif)

> Les mutations `validateRequest` et `rejectRequest` existent déjà dans `convex/storage/mutations.ts`.

---

## Implémentation technique

### Structure de fichiers à créer

```
src/app/(admin)/admin/
├── layout.tsx              # Déjà en place (AuthGuard admin)
├── dashboard/
│   └── page.tsx
├── users/
│   ├── page.tsx
│   └── [id]/page.tsx
├── stores/
│   ├── page.tsx
│   └── [id]/page.tsx
├── payouts/
│   └── page.tsx
├── categories/
│   └── page.tsx
├── orders/
│   └── page.tsx            # Optionnel Phase 1
└── storage/
    └── page.tsx

src/components/admin/
├── AdminSidebar.tsx
├── PlatformKPIs.tsx
├── UserTable.tsx
├── StoreTable.tsx
├── PayoutQueue.tsx
├── CategoryTree.tsx
└── StorageValidationTable.tsx

convex/admin/
├── queries.ts              # Stats plateforme, listes globales
└── users/
    ├── queries.ts
    └── mutations.ts
```

### Sidebar admin (`AdminSidebar.tsx`)

S'inspirer de `VendorSidebar.tsx`. Utiliser les mêmes composants shadcn/ui (`Sidebar`, `SidebarMenu`, etc.).

### Pattern de page admin

```tsx
// src/app/(admin)/admin/dashboard/page.tsx
"use client";
export default function AdminDashboardPage() {
  const stats = useQuery(api.admin.queries.getPlatformStats);
  return <AdminDashboardTemplate stats={stats} />;
}
```

### Considérations de sécurité

- Toutes les mutations admin **doivent** vérifier `ctx.auth` + rôle `admin` en Convex
- Les actions sensibles (retrait, suspension) ont un Dialog de confirmation obligatoire
- Logger toutes les actions admin dans `order_events` ou une table `admin_actions` dédiée
- Rate limiting sur les mutations de suspension/suppression

---

## Priorité d'implémentation

| Priorité | Page | Raison |
|----------|------|--------|
| 🔴 P0 | `/admin/payouts` | Blocage financier : les vendeurs ne peuvent pas être payés |
| 🔴 P0 | `/admin/stores` (vérification) | Blocage : nouvelles boutiques bloquées sans vérification |
| 🟠 P1 | `/admin/dashboard` | Visibilité plateforme |
| 🟠 P1 | `/admin/storage` (validation) | Lié au module stockage déjà actif |
| 🟡 P2 | `/admin/categories` | CRUD catégories |
| 🟡 P2 | `/admin/users` | Gestion utilisateurs |
| 🟢 P3 | `/admin/orders` | Nice-to-have |
