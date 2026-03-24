---
name: ads-system
description: |
  Use when working with advertising features for Pixel-Mart. Triggers on: ad spaces, ad bookings,
  promotions, sponsored content, ad slots, impressions, clicks, ad management, or homepage sections.
  Covers the ad space booking system with priority queue and dynamic pricing.
allowed-tools: [Read, Write, Grep, Glob]
---

# Ad System for Pixel-Mart

## Overview

Pixel-Mart offers paid ad spaces on the homepage:
- **Vendors** can book ad slots for their products/stores
- **Priority queue** determines which ads display
- **Dynamic pricing** based on demand
- **Impression/click tracking** for analytics

## Database Schema

```typescript
// convex/schema.ts

// Available ad slots (templates)
ad_spaces: defineTable({
  name: v.string(),            // "hero_banner", "featured_products"
  slug: v.string(),            // URL-safe identifier
  description: v.string(),
  position: v.string(),        // "homepage_top", "homepage_middle"
  dimensions: v.object({
    width: v.number(),
    height: v.number(),
  }),
  base_price_per_day: v.number(), // centimes
  max_active_ads: v.number(),     // How many ads can show at once
  is_active: v.boolean(),
})
  .index("by_slug", ["slug"])
  .index("by_position", ["position"]),

// Vendor bookings
ad_bookings: defineTable({
  ad_space_id: v.id("ad_spaces"),
  store_id: v.id("stores"),
  product_id: v.optional(v.id("products")), // If promoting specific product
  
  // Content
  title: v.string(),
  description: v.optional(v.string()),
  image_url: v.string(),
  link_url: v.string(),
  
  // Timing
  start_date: v.number(),
  end_date: v.number(),
  
  // Pricing
  total_price: v.number(),      // centimes
  demand_multiplier: v.number(), // 1.0, 1.25, 1.5 based on queue
  
  // Status
  status: v.union(
    v.literal("pending_payment"),
    v.literal("queued"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  priority: v.number(),         // 100=admin, 50=paid, 10=queued
  
  // Payment
  payment_id: v.optional(v.string()),
  paid_at: v.optional(v.number()),
  
  // Tracking
  impressions: v.number(),
  clicks: v.number(),
  
  created_at: v.number(),
})
  .index("by_space_status", ["ad_space_id", "status"])
  .index("by_space_active", ["ad_space_id", "status", "priority"])
  .index("by_store", ["store_id"])
  .index("by_dates", ["start_date", "end_date"]),
```

## Priority System

```typescript
// Priority levels
const AD_PRIORITIES = {
  ADMIN_OVERRIDE: 100,  // Admin-placed ads (always show)
  VENDOR_PAID: 50,      // Paid and active
  QUEUED: 10,           // In queue, waiting for slot
} as const;

// Ads are sorted by priority DESC, then by paid_at ASC (first paid = first served)
```

## Ad Space Slots

| Slot | Position | Max Active | Base Price/Day |
|------|----------|------------|----------------|
| Hero Banner | homepage_top | 1 | 5,000 XOF |
| Featured Products | homepage_featured | 4 | 2,000 XOF |
| Category Spotlight | homepage_categories | 3 | 1,500 XOF |
| Sidebar Ad | homepage_sidebar | 2 | 1,000 XOF |
| Mid-page Banner | homepage_middle | 1 | 3,000 XOF |

## Dynamic Pricing

Price increases based on queue depth:

```typescript
// convex/ads/helpers.ts

export function calculateDemandMultiplier(queuedCount: number): number {
  if (queuedCount >= 10) return 1.5;  // 50% premium
  if (queuedCount >= 5) return 1.25;  // 25% premium
  return 1.0;                          // Base price
}

export function calculateAdPrice(
  basePricePerDay: number,
  days: number,
  demandMultiplier: number
): number {
  return Math.round(basePricePerDay * days * demandMultiplier);
}
```

## Booking Flow

```
1. Vendor selects ad space + dates
2. System calculates price with demand multiplier
3. Vendor confirms → status: "pending_payment"
4. Vendor pays via Moneroo → status: "queued"
5. Cron job activates ads when slots available → status: "active"
6. End date reached → status: "completed"
```

## Create Booking Mutation

```typescript
// convex/ads/mutations.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createBooking = mutation({
  args: {
    adSpaceId: v.id("ad_spaces"),
    productId: v.optional(v.id("products")),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    linkUrl: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get user's store
    const store = await ctx.db
      .query("stores")
      .withIndex("by_owner", (q) => q.eq("owner_id", identity.subject))
      .first();
    if (!store) throw new Error("No store found");

    // Get ad space
    const adSpace = await ctx.db.get(args.adSpaceId);
    if (!adSpace || !adSpace.is_active) throw new Error("Ad space not available");

    // Calculate days
    const days = Math.ceil((args.endDate - args.startDate) / (24 * 60 * 60 * 1000));
    if (days < 1) throw new Error("Minimum booking is 1 day");

    // Get queue depth for demand multiplier
    const queuedAds = await ctx.db
      .query("ad_bookings")
      .withIndex("by_space_status", (q) => 
        q.eq("ad_space_id", args.adSpaceId).eq("status", "queued")
      )
      .collect();

    const demandMultiplier = calculateDemandMultiplier(queuedAds.length);
    const totalPrice = calculateAdPrice(adSpace.base_price_per_day, days, demandMultiplier);

    // Create booking
    const bookingId = await ctx.db.insert("ad_bookings", {
      ad_space_id: args.adSpaceId,
      store_id: store._id,
      product_id: args.productId,
      title: args.title,
      description: args.description,
      image_url: args.imageUrl,
      link_url: args.linkUrl,
      start_date: args.startDate,
      end_date: args.endDate,
      total_price: totalPrice,
      demand_multiplier: demandMultiplier,
      status: "pending_payment",
      priority: AD_PRIORITIES.QUEUED,
      impressions: 0,
      clicks: 0,
      created_at: Date.now(),
    });

    return { bookingId, totalPrice, demandMultiplier };
  },
});
```

## Payment Confirmation (Internal Mutation)

```typescript
// convex/ads/mutations.ts
import { internalMutation } from "../_generated/server";

export const confirmAdPayment = internalMutation({
  args: {
    bookingId: v.id("ad_bookings"),
    paymentId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "pending_payment") return; // Idempotent

    await ctx.db.patch(args.bookingId, {
      status: "queued",
      priority: AD_PRIORITIES.VENDOR_PAID,
      payment_id: args.paymentId,
      paid_at: Date.now(),
    });

    // Create transaction record
    const store = await ctx.db.get(booking.store_id);
    await ctx.db.insert("transactions", {
      store_id: booking.store_id,
      type: "ad_payment",
      amount: -args.amount, // Debit (payment out)
      balance_before: store!.balance,
      balance_after: store!.balance, // External payment, no balance change
      reference_id: args.bookingId,
      created_at: Date.now(),
    });
  },
});
```

## Ad Lifecycle Cron Job

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 15 minutes
crons.interval(
  "process_ad_lifecycle",
  { minutes: 15 },
  internal.ads.lifecycle.processAdLifecycle
);

export default crons;
```

```typescript
// convex/ads/lifecycle.ts
import { internalMutation } from "../_generated/server";

export const processAdLifecycle = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Expire completed ads
    const expiredAds = await ctx.db
      .query("ad_bookings")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.lt(q.field("end_date"), now)
        )
      )
      .collect();

    for (const ad of expiredAds) {
      await ctx.db.patch(ad._id, { status: "completed" });
    }

    // 2. Activate queued ads where slots are available
    const adSpaces = await ctx.db.query("ad_spaces").collect();

    for (const space of adSpaces) {
      // Count current active ads
      const activeAds = await ctx.db
        .query("ad_bookings")
        .withIndex("by_space_active", (q) =>
          q.eq("ad_space_id", space._id).eq("status", "active")
        )
        .collect();

      const availableSlots = space.max_active_ads - activeAds.length;

      if (availableSlots > 0) {
        // Get queued ads ready to start (sorted by priority, then paid_at)
        const queuedAds = await ctx.db
          .query("ad_bookings")
          .withIndex("by_space_status", (q) =>
            q.eq("ad_space_id", space._id).eq("status", "queued")
          )
          .filter((q) => q.lte(q.field("start_date"), now))
          .collect();

        // Sort by priority DESC, paid_at ASC
        queuedAds.sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return (a.paid_at ?? 0) - (b.paid_at ?? 0);
        });

        // Activate top N
        for (let i = 0; i < Math.min(availableSlots, queuedAds.length); i++) {
          await ctx.db.patch(queuedAds[i]._id, { status: "active" });
        }
      }
    }
  },
});
```

## Fetching Active Ads

```typescript
// convex/ads/queries.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getActiveAdsForSpace = query({
  args: { spaceSlug: v.string() },
  handler: async (ctx, args) => {
    const space = await ctx.db
      .query("ad_spaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.spaceSlug))
      .first();

    if (!space) return [];

    const ads = await ctx.db
      .query("ad_bookings")
      .withIndex("by_space_active", (q) =>
        q.eq("ad_space_id", space._id).eq("status", "active")
      )
      .collect();

    // Sort by priority DESC
    return ads.sort((a, b) => b.priority - a.priority);
  },
});
```

## Tracking Impressions & Clicks

```typescript
// convex/ads/mutations.ts
export const trackImpression = mutation({
  args: { bookingId: v.id("ad_bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.status !== "active") return;

    await ctx.db.patch(args.bookingId, {
      impressions: booking.impressions + 1,
    });
  },
});

export const trackClick = mutation({
  args: { bookingId: v.id("ad_bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.status !== "active") return;

    await ctx.db.patch(args.bookingId, {
      clicks: booking.clicks + 1,
    });
  },
});
```

## Ad Slot Wrapper Component

```tsx
// src/components/organisms/AdSlotWrapper.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect } from "react";
import Link from "next/link";

interface AdSlotWrapperProps {
  spaceSlug: string;
  fallback: React.ReactNode;
  className?: string;
}

export function AdSlotWrapper({ spaceSlug, fallback, className }: AdSlotWrapperProps) {
  const ads = useQuery(api.ads.queries.getActiveAdsForSpace, { spaceSlug });
  const trackImpression = useMutation(api.ads.mutations.trackImpression);
  const trackClick = useMutation(api.ads.mutations.trackClick);

  const ad = ads?.[0]; // Show highest priority ad

  // Track impression on mount
  useEffect(() => {
    if (ad) {
      trackImpression({ bookingId: ad._id });
    }
  }, [ad?._id]);

  if (!ad) {
    return <>{fallback}</>;
  }

  const handleClick = () => {
    trackClick({ bookingId: ad._id });
  };

  return (
    <Link
      href={ad.link_url}
      onClick={handleClick}
      className={className}
    >
      <div className="relative">
        <img
          src={ad.image_url}
          alt={ad.title}
          className="w-full h-full object-cover rounded-lg"
        />
        <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          Sponsorisé
        </span>
      </div>
    </Link>
  );
}
```

## Admin Override (Priority 100)

```typescript
// convex/ads/mutations.ts
export const createAdminBooking = mutation({
  args: {
    // ... same as createBooking
  },
  handler: async (ctx, args) => {
    // Check admin role
    const identity = await ctx.auth.getUserIdentity();
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerk_id"), identity?.subject))
      .first();
    
    if (user?.role !== "admin") throw new Error("Admin only");

    // Create with admin priority (skips queue, immediately active)
    return await ctx.db.insert("ad_bookings", {
      // ... fields
      status: "active", // Immediately active
      priority: AD_PRIORITIES.ADMIN_OVERRIDE,
      total_price: 0, // Admin bookings are free
      demand_multiplier: 1,
    });
  },
});
```
