---
name: business-rules
description: |
  Use when working on financial logic, order processing, payments, commissions, or any business 
  rule enforcement in Pixel-Mart. Triggers on: orders, payments, transactions, payouts, 
  commissions, balance operations, or status transitions. Contains critical rules that must 
  be enforced server-side.
allowed-tools: [Read, Write, Grep, Glob]
---

# Pixel-Mart Business Rules

## Currency & Monetary Values

### Rule M-01: Centimes Storage
All monetary values stored in **centimes** (1 XOF = 100 centimes):

```typescript
// ❌ WRONG
const price = 1500; // Ambiguous

// ✅ CORRECT
const priceInCentimes = 150000; // 1,500 XOF
```

### Rule M-02: Display Formatting
Frontend always divides by 100 for display:

```typescript
function formatXOF(centimes: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(centimes / 100);
}
// formatXOF(150000) → "1 500 XOF"
```

---

## Financial Rules

### Rule F-01: Transaction Logging (CRITICAL)
Every balance change MUST create a transaction record **in the same mutation**:

```typescript
export const creditBalance = mutation({
  handler: async (ctx, { storeId, amount, orderId }) => {
    const store = await ctx.db.get(storeId);
    const newBalance = store.balance + amount;

    // Step 1: Update balance
    await ctx.db.patch(storeId, { balance: newBalance });

    // Step 2: Create transaction (SAME MUTATION)
    await ctx.db.insert("transactions", {
      store_id: storeId,
      order_id: orderId,
      type: "order_payment",
      amount,
      balance_before: store.balance,
      balance_after: newBalance,
      created_at: Date.now(),
    });
  },
});
```

### Rule F-02: Minimum Payout
- Minimum payout: **655 XOF** (65500 centimes)
- Fees deducted from requested amount
- Payout fee: 1% (minimum 100 XOF)

```typescript
const MIN_PAYOUT_CENTIMES = 65500; // 655 XOF

function validatePayout(amount: number) {
  if (amount < MIN_PAYOUT_CENTIMES) {
    throw new Error(`Montant minimum: ${MIN_PAYOUT_CENTIMES / 100} XOF`);
  }
}

function calculatePayoutFee(amount: number): number {
  const percentFee = Math.floor(amount * 0.01); // 1%
  const minFee = 10000; // 100 XOF
  return Math.max(percentFee, minFee);
}
```

### Rule F-03: Balance Release
Vendor balance credited only when:
1. `order.status === "delivered"`
2. `order.delivered_at + 48 hours < now`

```typescript
// crons.ts - Run hourly
async function releaseEligibleBalances(ctx) {
  const threshold = Date.now() - 48 * 60 * 60 * 1000; // 48h ago
  
  const eligibleOrders = await ctx.db
    .query("orders")
    .withIndex("by_release_status", (q) => 
      q.eq("balance_released", false)
       .eq("status", "delivered")
    )
    .filter((q) => q.lt(q.field("delivered_at"), threshold))
    .collect();

  for (const order of eligibleOrders) {
    await ctx.runMutation(internal.transactions.releaseOrderBalance, {
      orderId: order._id,
    });
  }
}
```

### Rule F-04: Commission Calculation
Commission stored as **basis points** (100 = 1%):

```typescript
// Commission rates by plan
const COMMISSION_RATES = {
  free: 500,      // 5%
  pro: 300,       // 3%
  business: 200,  // 2%
} as const;

function calculateCommission(totalAmount: number, rate: number): number {
  return Math.floor(totalAmount * rate / 10000);
}

// Example: 10,000 XOF order, 5% commission
// = 1000000 centimes × 500 / 10000 = 50000 centimes = 500 XOF
```

---

## Order Status Machine

### Valid Transitions

```
PENDING ─────┬─────→ PAID ──────→ PROCESSING ──────→ SHIPPED ──────→ DELIVERED
             │         │              │
             │         ↓              ↓
             └──→ CANCELLED ←────────┘
                       │
                       ↓
                   (terminal)

PAID / DELIVERED ──────→ REFUNDED (terminal)
```

### Transition Rules

| From | To | Actor | Conditions |
|------|-----|-------|------------|
| pending | paid | webhook | Payment confirmed |
| pending | cancelled | customer | Within 2 hours |
| paid | processing | vendor | Manual confirmation |
| paid | cancelled | customer | Within 2 hours, triggers refund |
| processing | shipped | vendor | Tracking number required |
| processing | cancelled | vendor | Triggers refund |
| shipped | delivered | customer/auto | Auto after 7 days |
| paid/delivered | refunded | admin/vendor | Creates refund transaction |

### Implementation

```typescript
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "cancelled", "refunded"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [], // Terminal
  refunded: [],  // Terminal
};

function validateTransition(from: string, to: string): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    newStatus: v.string(),
  },
  handler: async (ctx, { orderId, newStatus }) => {
    const order = await ctx.db.get(orderId);
    
    if (!validateTransition(order.status, newStatus)) {
      throw new Error(
        `Invalid transition: ${order.status} → ${newStatus}`
      );
    }

    // Additional checks per transition...
    if (newStatus === "shipped") {
      // Require tracking number
    }
    if (newStatus === "cancelled" && order.status === "paid") {
      // Trigger refund
    }

    await ctx.db.patch(orderId, { 
      status: newStatus,
      [`${newStatus}_at`]: Date.now(),
    });
  },
});
```

---

## Ad Booking Rules

### Priority Queue

```typescript
const AD_PRIORITIES = {
  admin_override: 100,  // Admin-placed ads
  vendor_paid: 50,      // Vendor-booked, paid
  queued: 10,           // In queue, not yet active
} as const;
```

### Lifecycle

1. **Booking**: Vendor requests slot → status: `pending_payment`
2. **Payment**: Moneroo webhook → status: `queued`
3. **Activation**: Cron job checks slot availability → status: `active`
4. **Expiration**: End date reached → status: `completed`

### Pricing

```typescript
// Base price per day by slot type
const BASE_PRICES = {
  hero_banner: 500000,      // 5,000 XOF/day
  featured_products: 200000, // 2,000 XOF/day
  sidebar_ad: 100000,        // 1,000 XOF/day
};

// Demand multiplier: price increases with demand
function calculateDemandMultiplier(queuedCount: number): number {
  if (queuedCount >= 10) return 1.5;
  if (queuedCount >= 5) return 1.25;
  return 1.0;
}
```

---

## Delivery Rules

### Distance Calculation

```typescript
// Haversine formula
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### Delivery Fee Tiers

```typescript
function calculateDeliveryFee(distanceKm: number): number {
  // All values in centimes
  if (distanceKm <= 3) return 50000;   // 500 XOF
  if (distanceKm <= 7) return 100000;  // 1,000 XOF
  if (distanceKm <= 15) return 150000; // 1,500 XOF
  if (distanceKm <= 25) return 250000; // 2,500 XOF
  return 350000; // 3,500 XOF for 25+ km
}
```

---

## Review Rules

### Eligibility
User can review a product only if:
1. Has purchased the product
2. Order status is `delivered`
3. Has not already reviewed this product

```typescript
async function canReview(ctx, userId: string, productId: string): Promise<boolean> {
  // Check for delivered order with this product
  const order = await ctx.db
    .query("orders")
    .withIndex("by_user_status", (q) => 
      q.eq("user_id", userId).eq("status", "delivered")
    )
    .filter((q) => 
      q.eq(q.field("items"), /* contains productId */)
    )
    .first();

  if (!order) return false;

  // Check for existing review
  const existingReview = await ctx.db
    .query("reviews")
    .withIndex("by_user_product", (q) => 
      q.eq("user_id", userId).eq("product_id", productId)
    )
    .first();

  return !existingReview;
}
```

### Auto-Publish
Reviews auto-publish after 24 hours if not flagged:

```typescript
// crons.ts
crons.interval("publish_reviews", { hours: 1 }, async (ctx) => {
  const threshold = Date.now() - 24 * 60 * 60 * 1000;
  
  const pendingReviews = await ctx.db
    .query("reviews")
    .withIndex("by_status", (q) => q.eq("status", "pending"))
    .filter((q) => q.lt(q.field("created_at"), threshold))
    .collect();

  for (const review of pendingReviews) {
    await ctx.db.patch(review._id, { status: "published" });
  }
});
```
