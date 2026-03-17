# CODE STYLE GUIDE — Pixel-Mart

> Conventions techniques non-négociables.
> ESLint et TypeScript strict enforcement en garantissent une grande partie automatiquement.
> Ce guide couvre le reste.

---

## 1. TypeScript

### Mode strict — toujours

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Interdictions absolues

```typescript
// ❌ any — utiliser unknown + type guard
const data: any = fetchSomething();

// ✅
const data: unknown = fetchSomething();
if (typeof data === "string") { /* ... */ }

// ❌ non-null assertion sans guard préalable
const name = user!.name;

// ✅ guard explicite
if (!user) throw new Error("User not found");
const name = user.name;

// ❌ type assertion sans justification
const store = response as Store;

// ✅ validation à la frontière (Zod ou type guard)
const store = StoreSchema.parse(response);
```

### Imports de types

```typescript
// ❌ import normal pour des types uniquement
import { Doc, Id } from "../_generated/dataModel";

// ✅ import type — optimise le bundle, évite les dépendances circulaires
import type { Doc, Id } from "../_generated/dataModel";
```

### Nommage

```typescript
// Composants React → PascalCase
export function ProductCard() {}
export function VendorDashboardTemplate() {}

// Hooks → camelCase avec préfixe use
export function useCart() {}
export function useVendorStore() {}

// Fonctions Convex → camelCase
export const getProductsByStore = query(...)
export const createOrder = mutation(...)

// Tables Convex → snake_case
// orders, product_variants, ad_bookings

// Constantes → UPPER_SNAKE_CASE
export const MAX_IMAGES_PER_PRODUCT = 8;
export const COMMISSION_RATE_FREE_PLAN = 500; // basis points

// Variables et paramètres → camelCase
const orderStatus = "pending";
const storeId: Id<"stores"> = args.storeId;

// Variables booléennes → préfixe is/has/can/should
const isLoading = true;
const hasActiveSubscription = false;
const canPublishProduct = true;
```

---

## 2. Fonctions — principes Clean Code

### Une fonction = une responsabilité

```typescript
// ❌ Trop de responsabilités
async function processOrder(orderId: Id<"orders">) {
  const order = await ctx.db.get(orderId);
  // validation...
  // calcul commission...
  // mise à jour balance...
  // envoi email...
  // notification push...
}

// ✅ Chaque étape est une fonction nommée
async function processOrder(ctx: MutationCtx, orderId: Id<"orders">) {
  const order = await fetchOrderOrThrow(ctx, orderId);
  validateOrderCanBeProcessed(order);
  await creditVendorBalance(ctx, order);
  await scheduleOrderConfirmationEmail(ctx, order);
}
```

### Taille maximale : 20 lignes

Si une fonction dépasse 20 lignes, extraire. Sans exception.

### Arguments : maximum 3

```typescript
// ❌ Trop d'arguments — ordre ambigu, appel difficile à lire
function createProduct(name, price, storeId, categoryId, description, status) {}

// ✅ Objet argument — auto-documenté, extensible
interface CreateProductInput {
  name: string;
  priceInCentimes: number;
  storeId: Id<"stores">;
  categoryId: Id<"categories">;
  description?: string;
  status: "draft" | "active";
}

function createProduct(input: CreateProductInput) {}
```

### Pas d'effets de bord cachés

```typescript
// ❌ La fonction "vérifie" mais modifie aussi la session
function checkUserAuthenticated(ctx: QueryCtx): boolean {
  const user = getCurrentUser(ctx);
  session.lastCheck = Date.now(); // effet de bord caché !
  return user !== null;
}

// ✅ Séparation des responsabilités
function isUserAuthenticated(ctx: QueryCtx): boolean {
  return getCurrentUser(ctx) !== null;
}
```

---

## 3. Nommage — intention révélée

### Éviter les abréviations opaques

```typescript
// ❌
const amt = 5000;
const usr = getCurrentUser(ctx);
const prod = await ctx.db.get(productId);

// ✅
const amountInCentimes = 5000;
const currentUser = getCurrentUser(ctx);
const product = await ctx.db.get(productId);
```

### Nommer ce qu'on fait, pas comment

```typescript
// ❌ Décrit le mécanisme
const filteredByStatusAndDate = orders.filter(o =>
  o.status === "pending" && o.createdAt > cutoff
);

// ✅ Décrit l'intention
const overdueOrders = orders.filter(o =>
  o.status === "pending" && o.createdAt > cutoff
);
```

### Constantes financières — toujours en centimes, toujours nommées

```typescript
// ❌ Nombre magique
if (balance < 100) throw new Error("Insufficient balance");

// ✅ Constante nommée
const MINIMUM_PAYOUT_AMOUNT_XOF = 100; // 1 XOF en centimes
if (balance < MINIMUM_PAYOUT_AMOUNT_XOF) {
  throw new Error("Balance below minimum payout threshold");
}
```

---

## 4. Gestion d'erreurs

### Toujours des exceptions, jamais des return codes

```typescript
// ❌
function getStore(ctx: QueryCtx, storeId: Id<"stores">) {
  const store = ctx.db.get(storeId);
  if (!store) return null; // le caller peut oublier de vérifier
  return store;
}

// ✅ Throw avec contexte
async function fetchStoreOrThrow(ctx: QueryCtx, storeId: Id<"stores">) {
  const store = await ctx.db.get(storeId);
  if (!store) {
    throw new ConvexError(`Store not found: ${storeId}`);
  }
  return store;
}
```

### Convex errors — toujours ConvexError pour les erreurs métier

```typescript
import { ConvexError } from "convex/values";

// ✅ Erreur métier avec message utilisateur
throw new ConvexError("Insufficient balance to process payout");

// ✅ Erreur avec données structurées
throw new ConvexError({
  code: "INSUFFICIENT_BALANCE",
  message: "Balance insuffisante",
  required: minimumAmount,
  current: currentBalance,
});
```

### Never return null — retourner undefined ou une valeur vide

```typescript
// ❌ null = ambiguïté — erreur ou absence ?
function getActivePromotion(): Promotion | null {}

// ✅ undefined = absence explicite
function getActivePromotion(): Promotion | undefined {}

// ✅ Tableau vide = absence de résultats
function getVendorOrders(): Order[] {}
```

---

## 5. Commentaires

### Quand commenter : le POURQUOI, jamais le QUOI

```typescript
// ❌ Commente ce que le code dit déjà
// Vérifie si le statut est "pending"
if (order.status === "pending") { ... }

// ✅ Explique une décision non-évidente
// Les commissions sont calculées en basis points (non en %)
// pour éviter les erreurs d'arrondi sur les petits montants XOF.
// Ex: 500 basis points = 5.00% = commission * 500 / 10000
const commissionAmount = totalAmount * commissionRateBps / 10_000;
```

### Jamais de code commenté

```typescript
// ❌ Code mort — git se souvient mieux que les commentaires
// const oldPrice = product.price * 0.9;
// if (oldPrice < minimumPrice) { ... }
const discountedPrice = applyVendorDiscount(product.price);
```

### TODOs — avec issue trackée ou pas du tout

```typescript
// ❌ TODO sans contexte
// TODO: fix this later

// ✅ TODO avec issue et responsable
// TODO(#142): migrer vers Moneroo v2 webhook signature — voir issue GitHub
```

---

## 6. Architecture des fichiers

### Structure par domaine

```
convex/
  products/
    queries.ts      # lecture seule, réactif
    mutations.ts    # écritures atomiques
    helpers.ts      # fonctions partagées (non exposées)
  orders/
    queries.ts
    mutations.ts
    events.ts       # handlers d'événements (webhooks, crons)

src/
  components/
    products/
      atoms/        # PriceTag, StockBadge, ProductImage
      molecules/    # ProductCard, ProductFilters
      organisms/    # ProductGrid, ProductForm
      templates/    # ProductListTemplate, ProductDetailTemplate
  app/
    (vendor)/vendor/products/
      page.tsx      # Server Component — fetch + layout
      loading.tsx   # Skeleton Suspense
      error.tsx     # Error boundary
```

### Un fichier = une responsabilité

```typescript
// ❌ Tout dans un fichier
// convex/products.ts avec queries, mutations, helpers, types

// ✅ Séparation claire
// convex/products/queries.ts
// convex/products/mutations.ts
// convex/products/helpers.ts
```

### Export nommé uniquement (sauf pages Next.js)

```typescript
// ❌ Export default dans les composants partagés
export default function ProductCard() {}

// ✅ Export nommé — navigable, refactorable
export function ProductCard() {}

// Exception: pages Next.js (obligation du framework)
export default function ProductsPage() {}
```

---

## 7. React / Next.js

### Server Components par défaut

```typescript
// ✅ Pas de "use client" — Server Component par défaut
// src/app/(vendor)/vendor/products/page.tsx
export default async function ProductsPage() {
  // Fetch direct côté serveur — pas de useEffect, pas de loading state
  return <ProductListTemplate />;
}

// ✅ "use client" seulement si nécessaire
// src/components/products/organisms/ProductForm.tsx
"use client";
// → besoin de useState, useEffect, handlers d'événements
```

### Quand utiliser "use client"

| Besoin | Client | Server |
|--------|--------|--------|
| Interactivité (onClick, onChange) | ✅ | |
| Hooks React (useState, useEffect) | ✅ | |
| Accès au browser (localStorage, window) | ✅ | |
| Fetch de données initiales | | ✅ |
| Accès aux variables d'env serveur | | ✅ |
| Layouts statiques | | ✅ |

### Loading et error states — obligatoires

```
src/app/(vendor)/vendor/products/
  page.tsx        ← contenu
  loading.tsx     ← skeleton affiché pendant le chargement (Suspense)
  error.tsx       ← boundary erreur avec reset
```

```typescript
// loading.tsx
export default function ProductsLoading() {
  return <ProductListSkeleton />;
}

// error.tsx
"use client";
export default function ProductsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorState message={error.message} onRetry={reset} />;
}
```

---

## 8. Tailwind CSS

### Utility-first — jamais de CSS custom

```typescript
// ❌ CSS custom
// styles.module.css
.productCard {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 16px;
}

// ✅ Tailwind uniquement
<div className="bg-slate-900 rounded-lg p-4">
```

### Exceptions CSS custom acceptées

Les seules exceptions autorisées :
1. Animations complexes non couvertes par Tailwind
2. CSS variables pour le système de thèmes vendeurs (`StoreThemeProvider`)
3. Overrides de composants tiers (documentés avec un commentaire)

### Tri des classes — automatique via Prettier

Le plugin `prettier-plugin-tailwindcss` trie les classes automatiquement au commit.
Ne pas trier manuellement.

### Mobile-first toujours

```typescript
// ❌ Desktop-first
<div className="grid-cols-4 sm:grid-cols-2 xs:grid-cols-1">

// ✅ Mobile-first
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

---

## 9. Montants et monnaie

### Règle absolue : centimes, jamais de float

```typescript
// ❌ Float — erreurs d'arrondi garanties
const price = 29.99; // en euros ou XOF ?
const commission = price * 0.05;

// ✅ Entiers en centimes
const priceInCentimes = 2999; // 29,99 XOF
const commissionInCentimes = Math.round(priceInCentimes * COMMISSION_RATE_BPS / 10_000);
```

### Affichage — toujours via formatPrice()

```typescript
import { formatPrice } from "@/lib/utils";

// ✅
<span>{formatPrice(product.priceInCentimes, "XOF")}</span>
// → "29 999 FCFA"
```

### Calcul des commissions — basis points

```typescript
// F-04: commission_amount = total_amount × commission_rate / 10000
// commission_rate est en basis points (500 = 5%)
const commissionAmount = Math.round(
  totalAmountInCentimes * commissionRateBps / 10_000
);
```

---

## 10. Checklist avant chaque PR

Avant d'ouvrir une PR, vérifier manuellement :

```bash
# 1. Tout passe
pnpm validate

# 2. Aucun import mort
# (no-unused-vars en warn — mais les nettoyer quand même)

# 3. Aucun console.log de debug
grep -r "console.log" src/ convex/ --include="*.ts" --include="*.tsx"

# 4. Aucun TODO sans issue
grep -r "TODO" src/ convex/ --include="*.ts" --include="*.tsx"

# 5. Aucune donnée sensible
grep -rE "(api_key|secret|password|token)" src/ --include="*.ts"
```

---

*Voir aussi : `CONTRIBUTING.md` (workflow git), `CONVEX_PATTERNS.md` (patterns backend), `ATOMIC_DESIGN_GUIDE.md` (composants UI)*
