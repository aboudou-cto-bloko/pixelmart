---
name: convex-patterns
description: |
  Use when writing Convex backend code for Pixel-Mart. Triggers on: creating queries, mutations, actions, 
  working with convex/ directory, database operations, webhooks, cron jobs, or any backend logic.
  Provides Convex-specific patterns, constraints, and best practices for this project.
allowed-tools: [Read, Write, Grep, Glob, Bash]
---

# Convex Patterns for Pixel-Mart

## Core Constraints

### 1. Function Types

```typescript
// QUERY - Read-only, reactive, cached automatically
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

// MUTATION - Write to DB, transactional, atomic
export const createProduct = mutation({
  args: { name: v.string(), price: v.number() },
  handler: async (ctx, args) => {
    // Can read and write to ctx.db
    return await ctx.db.insert("products", args);
  },
});

// ACTION - External API calls, NOT transactional
export const processPayment = action({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    // Call external APIs here
    const result = await fetch("https://api.moneroo.io/...");
    // Then call mutation to save result
    await ctx.runMutation(internal.orders.mutations.updatePaymentStatus, {
      orderId: args.orderId,
      status: "paid",
    });
  },
});
```

### 2. NEVER Call External APIs in Mutations

```typescript
// ❌ WRONG - External API in mutation
export const badMutation = mutation({
  handler: async (ctx, args) => {
    await fetch("https://api.external.com"); // FORBIDDEN
  },
});

// ✅ CORRECT - Action calls mutation
export const processExternal = action({
  handler: async (ctx, args) => {
    const result = await fetch("https://api.external.com");
    await ctx.runMutation(internal.myModule.mutations.saveResult, { result });
  },
});
```

### 3. HTTP Actions Constraint

```typescript
// ❌ WRONG - Direct ctx.db in httpAction
export const webhook = httpAction(async (ctx, request) => {
  await ctx.db.insert("logs", { data: "test" }); // FORBIDDEN
});

// ✅ CORRECT - Call internal mutation
export const webhook = httpAction(async (ctx, request) => {
  const body = await request.json();
  await ctx.runMutation(internal.webhooks.mutations.processWebhook, { body });
  return new Response("OK", { status: 200 });
});
```

### 4. Internal vs Public Functions

```typescript
import { internalMutation, internalQuery, internalAction } from "./_generated/server";

// Internal - only callable from other Convex functions
export const updateBalance = internalMutation({...});

// Public - callable from frontend
export const getBalance = query({...});
```

## Domain Structure

Each domain folder follows this pattern:

```
convex/[domain]/
├── queries.ts       # Public read operations
├── mutations.ts     # Public write operations
├── helpers.ts       # Shared utilities, validators
└── internal.ts      # Internal functions (optional)
```

## Financial Operations Pattern

Always create transaction record with balance changes:

```typescript
export const adjustBalance = mutation({
  args: { storeId: v.id("stores"), amount: v.number(), type: v.string() },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Store not found");

    const newBalance = store.balance + args.amount;

    // 1. Update balance
    await ctx.db.patch(args.storeId, { balance: newBalance });

    // 2. ALWAYS create transaction record in same mutation
    await ctx.db.insert("transactions", {
      store_id: args.storeId,
      type: args.type,
      amount: args.amount,
      balance_before: store.balance,
      balance_after: newBalance,
      created_at: Date.now(),
    });
  },
});
```

## Type Safety Pattern

Derive types from schema, never redefine:

```typescript
// ❌ WRONG - Local type definition
type OrderStatus = "pending" | "paid" | "processing";

// ✅ CORRECT - Derive from Convex Doc
import { Doc } from "./_generated/dataModel";
type OrderStatus = Doc<"orders">["status"];
```

## Indexes

Always define indexes for query performance:

```typescript
// schema.ts
orders: defineTable({
  store_id: v.id("stores"),
  status: v.string(),
  created_at: v.number(),
})
  .index("by_store", ["store_id"])
  .index("by_store_status", ["store_id", "status"])
  .index("by_created", ["created_at"]),
```

Use indexes in queries:

```typescript
// ✅ Uses index
const orders = await ctx.db
  .query("orders")
  .withIndex("by_store_status", (q) => 
    q.eq("store_id", storeId).eq("status", "pending")
  )
  .collect();
```

## Validation Pattern

```typescript
import { v } from "convex/values";

export const createProduct = mutation({
  args: {
    name: v.string(),
    price: v.number(), // centimes
    description: v.optional(v.string()),
    category_id: v.id("categories"),
    variants: v.optional(v.array(v.object({
      name: v.string(),
      price_adjustment: v.number(),
      stock: v.number(),
    }))),
  },
  handler: async (ctx, args) => {
    // Additional validation
    if (args.price < 0) throw new Error("Price must be positive");
    if (args.name.length < 3) throw new Error("Name too short");
    // ...
  },
});
```

## Cron Jobs

Define in `convex/crons.ts`:

```typescript
import { cronJobs } from "convex/server";

const crons = cronJobs();

// Run every hour
crons.interval("release_balances", { hours: 1 }, internal.transactions.mutations.releaseEligibleBalances);

// Run daily at midnight UTC
crons.daily("cleanup_expired", { hourUTC: 0 }, internal.ads.mutations.cleanupExpiredAds);

export default crons;
```
