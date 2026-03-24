---
name: moneroo-integration
description: |
  Use when working with Moneroo payments for Pixel-Mart. Triggers on: payments, Mobile Money,
  MTN, Orange Money, Wave, Flooz, webhooks, payment processing, or checkout flow.
  Covers Moneroo API integration for West African mobile payments.
allowed-tools: [Read, Write, Grep, Glob]
---

# Moneroo Integration for Pixel-Mart

## Overview

Moneroo handles Mobile Money payments across West Africa:
- **MTN Mobile Money** (Benin, Côte d'Ivoire, Ghana, Cameroon)
- **Orange Money** (Benin, Côte d'Ivoire, Senegal, Mali)
- **Wave** (Senegal, Côte d'Ivoire)
- **Flooz** (Togo, Benin)

## Configuration

```bash
# .env.local
MONEROO_SECRET_KEY=sk_live_xxx        # Server-side only
MONEROO_WEBHOOK_SECRET=whsec_xxx      # Webhook signature
NEXT_PUBLIC_MONEROO_PUBLIC_KEY=pk_live_xxx  # Client-side
```

## Payment Flow

```
1. Customer selects Mobile Money
2. Frontend calls Convex action → initiate payment
3. Convex action calls Moneroo API → get payment URL
4. Customer redirected to Moneroo → enters phone, confirms
5. Moneroo sends webhook → payment.success
6. Webhook handler → update order status to "paid"
```

## Initiating Payment (Convex Action)

```typescript
// convex/payments/moneroo.ts
import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

const MONEROO_API_URL = "https://api.moneroo.io/v1";

export const initiatePayment = action({
  args: {
    orderId: v.id("orders"),
    amount: v.number(), // centimes
    customerEmail: v.string(),
    customerPhone: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Get order to verify
    const order = await ctx.runQuery(internal.orders.queries.getOrderInternal, {
      orderId: args.orderId,
    });

    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("Order already processed");

    // Convert centimes to XOF (Moneroo expects whole currency units)
    const amountXOF = Math.round(args.amount / 100);

    const response = await fetch(`${MONEROO_API_URL}/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MONEROO_SECRET_KEY}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        amount: amountXOF,
        currency: "XOF",
        description: args.description,
        customer: {
          email: args.customerEmail,
          phone: args.customerPhone,
        },
        metadata: {
          order_id: args.orderId,
          type: "order_payment",
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${args.orderId}/confirmation`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/moneroo`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Moneroo error: ${error.message}`);
    }

    const data = await response.json();

    // Save payment reference
    await ctx.runMutation(internal.orders.mutations.setPaymentReference, {
      orderId: args.orderId,
      paymentReference: data.data.id,
      paymentProvider: "moneroo",
    });

    return {
      paymentUrl: data.data.checkout_url,
      paymentId: data.data.id,
    };
  },
});
```

## Ad Payment (Separate Flow)

```typescript
// convex/payments/moneroo.ts
export const initiateAdPayment = action({
  args: {
    bookingId: v.id("ad_bookings"),
    amount: v.number(),
    customerEmail: v.string(),
    customerPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const amountXOF = Math.round(args.amount / 100);

    const response = await fetch(`${MONEROO_API_URL}/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MONEROO_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amountXOF,
        currency: "XOF",
        description: "Réservation espace publicitaire Pixel-Mart",
        customer: {
          email: args.customerEmail,
          phone: args.customerPhone,
        },
        metadata: {
          booking_id: args.bookingId,
          type: "ad_payment", // Different type for routing
        },
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/ads/bookings/${args.bookingId}`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/moneroo`,
      }),
    });

    const data = await response.json();
    return { paymentUrl: data.data.checkout_url };
  },
});
```

## Webhook Handler (HTTP Action)

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "crypto";

const http = httpRouter();

http.route({
  path: "/webhooks/moneroo",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("x-moneroo-signature");

    // 2. Verify signature
    if (!verifyMonerooSignature(body, signature)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const data = payload.data;

    // 3. Route by payment type
    const paymentType = data.metadata?.type;

    try {
      if (event === "payment.success") {
        if (paymentType === "order_payment") {
          await ctx.runMutation(internal.payments.webhooks.confirmOrderPayment, {
            orderId: data.metadata.order_id,
            paymentId: data.id,
            amount: data.amount * 100, // Convert back to centimes
          });
        } else if (paymentType === "ad_payment") {
          await ctx.runMutation(internal.ads.mutations.confirmAdPayment, {
            bookingId: data.metadata.booking_id,
            paymentId: data.id,
            amount: data.amount * 100,
          });
        }
      } else if (event === "payment.failed") {
        if (paymentType === "order_payment") {
          await ctx.runMutation(internal.payments.webhooks.failOrderPayment, {
            orderId: data.metadata.order_id,
            reason: data.failure_reason,
          });
        } else if (paymentType === "ad_payment") {
          await ctx.runMutation(internal.ads.mutations.failAdPayment, {
            bookingId: data.metadata.booking_id,
            reason: data.failure_reason,
          });
        }
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return new Response("Processing error", { status: 500 });
    }
  }),
});

function verifyMonerooSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.MONEROO_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export default http;
```

## Order Payment Webhook Handler

```typescript
// convex/payments/webhooks.ts
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const confirmOrderPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") {
      // Idempotency: already processed
      return;
    }

    // 1. Update order status
    await ctx.db.patch(args.orderId, {
      status: "paid",
      paid_at: Date.now(),
      payment_id: args.paymentId,
    });

    // 2. Create transaction record
    await ctx.db.insert("transactions", {
      store_id: order.store_id,
      order_id: args.orderId,
      type: "order_payment",
      amount: args.amount,
      status: "pending_release", // Released after 48h
      balance_before: 0, // Not credited yet
      balance_after: 0,
      created_at: Date.now(),
    });

    // 3. Trigger notification (via scheduler)
    await ctx.scheduler.runAfter(0, internal.notifications.send.orderPaid, {
      orderId: args.orderId,
    });
  },
});

export const failOrderPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order || order.status !== "pending") return;

    await ctx.db.patch(args.orderId, {
      status: "payment_failed",
      payment_failure_reason: args.reason,
    });
  },
});
```

## Frontend Payment Button

```tsx
// src/components/checkout/MonerooPayment.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MonerooPaymentProps {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerPhone: string;
}

export function MonerooPayment({
  orderId,
  amount,
  customerEmail,
  customerPhone,
}: MonerooPaymentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const initiatePayment = useMutation(api.payments.moneroo.initiatePayment);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const { paymentUrl } = await initiatePayment({
        orderId,
        amount,
        customerEmail,
        customerPhone,
        description: `Commande Pixel-Mart #${orderId.slice(-8)}`,
      });

      // Redirect to Moneroo checkout
      window.location.href = paymentUrl;
    } catch (error) {
      console.error("Payment error:", error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirection...
        </>
      ) : (
        "Payer avec Mobile Money"
      )}
    </Button>
  );
}
```

## Testing Payments

Moneroo provides test credentials:

```bash
# Test mode
MONEROO_SECRET_KEY=sk_test_xxx

# Test phone numbers
# Success: 22990000001
# Failed: 22990000002
# Pending: 22990000003
```

## Error Handling

```typescript
// Common Moneroo errors
const MONEROO_ERRORS = {
  INSUFFICIENT_BALANCE: "Solde insuffisant",
  INVALID_PHONE: "Numéro de téléphone invalide",
  TRANSACTION_FAILED: "Transaction échouée, veuillez réessayer",
  TIMEOUT: "Délai d'attente dépassé",
  CANCELLED: "Paiement annulé par l'utilisateur",
};

function getMonerooErrorMessage(code: string): string {
  return MONEROO_ERRORS[code] || "Une erreur est survenue";
}
```

## Supported Payment Methods

| Method | Countries | Currency |
|--------|-----------|----------|
| MTN Mobile Money | BJ, CI, GH, CM | XOF, GHS, XAF |
| Orange Money | BJ, CI, SN, ML | XOF |
| Wave | SN, CI | XOF |
| Flooz | TG, BJ | XOF |

## Idempotency

Always check order status before processing webhooks to handle duplicate deliveries:

```typescript
if (order.status !== "pending") {
  // Already processed, return success without re-processing
  return;
}
```
