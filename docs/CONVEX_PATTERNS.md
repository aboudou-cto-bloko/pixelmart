# CONVEX PATTERNS — Pixel-Mart

> Guide des patterns Convex utilisés dans ce projet.
> Consulter avant d'écrire toute fonction backend.

---

## 1. Types de fonctions — quand utiliser quoi

| Type | Lecture | Écriture | API externe | Quand l'utiliser |
|------|---------|----------|-------------|-----------------|
| `query` | ✅ | ❌ | ❌ | Lire des données, affiché en temps réel |
| `mutation` | ✅ | ✅ | ❌ | Écrire en base, opérations atomiques |
| `action` | ✅ | ❌ | ✅ | Appels API externes (Moneroo, Resend, etc.) |
| `internalQuery` | ✅ | ❌ | ❌ | Lecture interne (appelée par une action) |
| `internalMutation` | ✅ | ✅ | ❌ | Écriture interne (appelée par une action) |
| `internalAction` | ✅ | ❌ | ✅ | Action interne non exposée au client |

### Règle critique : jamais d'API externe dans une mutation

```typescript
// ❌ INTERDIT — les mutations ne peuvent pas appeler fetch()
export const createOrder = mutation({
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", { ... });
    // 💥 CRASH — fetch() non disponible dans les mutations
    await fetch("https://api.resend.com/emails", { ... });
  },
});

// ✅ Pattern correct : action → internalMutation
export const createOrder = action({
  handler: async (ctx, args) => {
    // 1. Persistance via mutation interne (atomique)
    const orderId = await ctx.runMutation(internal.orders.mutations.insertOrder, args);

    // 2. Effets de bord via API externe (non-atomique, acceptable)
    await ctx.runAction(internal.emails.actions.sendOrderConfirmation, { orderId });
  },
});
```

---

## 2. Structure des fichiers Convex

```
convex/
  [domain]/
    queries.ts      ← fonctions query et internalQuery
    mutations.ts    ← fonctions mutation et internalMutation
    actions.ts      ← fonctions action et internalAction (si API externe)
    helpers.ts      ← fonctions utilitaires internes (non exportées comme handlers)
    types.ts        ← types TypeScript partagés du domaine (si nécessaire)
```

### Convention d'export

```typescript
// queries.ts — export nommé, pas de default
export const getProductsByStore = query({ ... });
export const getProductBySlug = query({ ... });

// internalQuery — préfixe internal dans le nom
export const fetchProductForWebhook = internalQuery({ ... });
```

---

## 3. Validation des arguments — toujours avec v.*

```typescript
import { v } from "convex/values";

// ✅ Tous les args validés
export const createProduct = mutation({
  args: {
    name: v.string(),
    priceInCentimes: v.number(),
    storeId: v.id("stores"),
    status: v.union(v.literal("draft"), v.literal("active")),
    description: v.optional(v.string()),
    images: v.array(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => { ... },
});
```

### Types Convex disponibles

```typescript
v.string()           // string
v.number()           // number (int ou float)
v.boolean()          // boolean
v.null()             // null
v.id("tableName")    // Id<"tableName">
v.array(v.string())  // string[]
v.object({ ... })    // objet typé
v.optional(v.string()) // string | undefined
v.union(v.literal("a"), v.literal("b")) // "a" | "b"
v.any()              // ❌ à éviter — utiliser le type le plus précis possible
```

---

## 4. Authentification dans les handlers

### Pattern standard — vérifier l'identité avant tout

```typescript
// helpers/auth.ts — helper réutilisable
export async function requireAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Authentication required");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .unique();

  if (!user) {
    throw new ConvexError("User not found");
  }

  return user;
}

export async function requireVendorRole(ctx: QueryCtx | MutationCtx) {
  const user = await requireAuthenticatedUser(ctx);
  if (user.role !== "vendor" && user.role !== "admin") {
    throw new ConvexError("Vendor access required");
  }
  return user;
}

export async function requireAdminRole(ctx: QueryCtx | MutationCtx) {
  const user = await requireAuthenticatedUser(ctx);
  if (user.role !== "admin") {
    throw new ConvexError("Admin access required");
  }
  return user;
}
```

```typescript
// Utilisation dans une mutation
export const updateProduct = mutation({
  args: { productId: v.id("products"), ... },
  handler: async (ctx, args) => {
    // 1. Auth en premier — toujours
    const vendor = await requireVendorRole(ctx);

    // 2. Vérifier l'ownership — le vendeur ne peut modifier que SES produits
    const product = await fetchProductOrThrow(ctx, args.productId);
    const store = await fetchStoreOrThrow(ctx, product.storeId);

    if (store.ownerId !== vendor._id) {
      throw new ConvexError("Access denied: not your product");
    }

    // 3. Logique métier
    await ctx.db.patch(args.productId, { ... });
  },
});
```

---

## 5. Index — obligatoire pour toute query filtrée

### Règle : jamais de `.filter()` sans index sur les grandes tables

```typescript
// ❌ Full table scan — O(n), catastrophique en production
const orders = await ctx.db
  .query("orders")
  .filter((q) => q.eq(q.field("storeId"), storeId))
  .collect();

// ✅ Index — O(log n)
const orders = await ctx.db
  .query("orders")
  .withIndex("by_store", (q) => q.eq("storeId", storeId))
  .order("desc")
  .collect();
```

### Définition des index dans le schéma

```typescript
// convex/schema.ts
orders: defineTable({
  storeId: v.id("stores"),
  customerId: v.optional(v.id("users")),
  status: v.string(),
  createdAt: v.number(),
  // ...
})
  .index("by_store", ["storeId"])
  .index("by_store_status", ["storeId", "status"])
  .index("by_customer", ["customerId"])
  .index("by_order_number", ["orderNumber"]),
```

### Index composites — order matters

```typescript
// Index ["storeId", "status"] permet :
.withIndex("by_store_status", (q) =>
  q.eq("storeId", storeId).eq("status", "pending")
)

// Mais PAS :
.withIndex("by_store_status", (q) =>
  q.eq("status", "pending") // ❌ le premier champ doit être utilisé
)
```

---

## 6. Règles financières — non-négociables

### F-01 : Toute modification de balance = transaction dans la même mutation

```typescript
// ✅ Balance + Transaction dans la même mutation (atomique)
export const creditVendorBalance = internalMutation({
  args: {
    storeId: v.id("stores"),
    amountInCentimes: v.number(),
    orderId: v.id("orders"),
  },
  handler: async (ctx, { storeId, amountInCentimes, orderId }) => {
    const store = await fetchStoreOrThrow(ctx, storeId);
    const newBalance = store.balance + amountInCentimes;

    // Mise à jour balance ET création transaction dans la même mutation
    await ctx.db.patch(storeId, { balance: newBalance });

    await ctx.db.insert("transactions", {
      storeId,
      type: "order_credit",
      amount: amountInCentimes,
      balanceBefore: store.balance,
      balanceAfter: newBalance,
      orderId,
      createdAt: Date.now(),
    });
  },
});
```

### Transactions immuables — jamais d'UPDATE

```typescript
// ❌ INTERDIT — les transactions ne se modifient jamais
await ctx.db.patch(transactionId, { amount: correctedAmount });

// ✅ Créer une transaction de correction (reversal)
await ctx.db.insert("transactions", {
  type: "correction",
  amount: -originalAmount, // montant négatif = reversal
  originalTransactionId: transactionId,
  reason: "Payment webhook duplicate",
  createdAt: Date.now(),
});
```

### F-04 : Calcul de commission

```typescript
// Toujours en basis points, jamais en pourcentage flottant
function calculateCommission(
  totalAmountInCentimes: number,
  commissionRateBps: number // 500 = 5%, 300 = 3%, 200 = 2%
): number {
  return Math.round(totalAmountInCentimes * commissionRateBps / 10_000);
}
```

---

## 7. Mutations de statut — machine d'états stricte

```typescript
// convex/orders/helpers.ts
const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending:    ["paid", "cancelled"],
  paid:       ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled"],
  shipped:    ["delivered"],
  delivered:  ["refunded"],
  cancelled:  [], // état final
  refunded:   [], // état final
};

export function validateOrderStatusTransition(
  currentStatus: string,
  newStatus: string
): void {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(newStatus)) {
    throw new ConvexError(
      `Invalid status transition: ${currentStatus} → ${newStatus}`
    );
  }
}
```

---

## 8. Pagination — obligatoire sur les grandes listes

```typescript
// ❌ .collect() sur une table potentiellement grande
const allProducts = await ctx.db.query("products").collect();

// ✅ Pagination avec cursor
export const getProductsByStore = query({
  args: {
    storeId: v.id("stores"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { storeId, paginationOpts }) => {
    return await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .order("desc")
      .paginate(paginationOpts);
  },
});
```

### Côté client avec usePaginatedQuery

```typescript
const { results, status, loadMore } = usePaginatedQuery(
  api.products.queries.getProductsByStore,
  { storeId },
  { initialNumItems: 20 }
);
```

---

## 9. Scheduled functions (crons)

```typescript
// convex/crons.ts — enregistrement des crons
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Cron pour le lifecycle des ad bookings
crons.interval(
  "ad-booking-lifecycle",
  { minutes: 15 },
  internal.ads.handlers.processAdBookingLifecycle
);

// Nettoyage des paniers abandonnés — tous les jours à 2h UTC
crons.daily(
  "cleanup-abandoned-carts",
  { hourUTC: 2, minuteUTC: 0 },
  internal.orders.handlers.cleanupAbandonedCarts
);

export default crons;
```

---

## 10. Actions HTTP (webhooks)

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { handleMonerooWebhook } from "./payments/webhooks";

const http = httpRouter();

http.route({
  path: "/webhooks/moneroo",
  method: "POST",
  handler: handleMonerooWebhook,
});

export default http;
```

```typescript
// convex/payments/webhooks.ts
export const handleMonerooWebhook = httpAction(async (ctx, request) => {
  // 1. Vérifier la signature AVANT tout traitement
  const signature = request.headers.get("Moneroo-Signature");
  if (!verifyMonerooSignature(await request.text(), signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  // 2. Parser le payload
  const payload = await request.json();

  // 3. Déléguer à une internalMutation (atomique)
  await ctx.runMutation(internal.payments.mutations.processWebhookEvent, {
    event: payload,
  });

  return new Response("OK", { status: 200 });
});
```

---

## 11. Variables d'environnement

```typescript
// Dans une action — accès direct
const monerooApiKey = process.env.MONEROO_API_KEY;
if (!monerooApiKey) {
  throw new Error("MONEROO_API_KEY environment variable is not set");
}

// Côté client — uniquement les variables NEXT_PUBLIC_*
// src/lib/config.ts
export const config = {
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Pixel-Mart",
};
```

### Variables requises en production

```bash
# Backend Convex (via: npx convex env set KEY value)
BETTER_AUTH_SECRET
SITE_URL
MONEROO_API_KEY
RESEND_API_KEY

# Frontend Next.js (.env.local)
NEXT_PUBLIC_CONVEX_URL
NEXT_PUBLIC_CONVEX_SITE_URL
NEXT_PUBLIC_APP_URL
```

---

*Voir aussi : `CONTRIBUTING.md` (workflow git), `CODE_STYLE_GUIDE.md` (conventions TypeScript), `ATOMIC_DESIGN_GUIDE.md` (composants UI)*
