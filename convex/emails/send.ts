// filepath: convex/emails/send.ts

"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { render } from "@react-email/render";

// Templates
import OrderConfirmation from "../../emails/OrderConfirmation";
import NewOrder from "../../emails/NewOrder";
import OrderShipped from "../../emails/OrderShipped";
import OrderDelivered from "../../emails/OrderDelivered";
import OrderCancelled from "../../emails/OrderCancelled";

const EMAIL_FROM = "Pixel-Mart <dev@aboudouzinsou.site>";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY non configurée");
  return new Resend(key);
}

function getSiteUrl(): string {
  return process.env.SITE_URL ?? "http://localhost:3001";
}

// ─── Helper : formater un montant pour les emails ──────────

function formatAmount(centimes: number, currency: string): string {
  const amount = centimes / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Order Confirmation → Client ────────────────────────────

export const sendOrderConfirmation = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    orderNumber: v.string(),
    orderId: v.string(),
    storeName: v.string(),
    items: v.array(
      v.object({
        title: v.string(),
        quantity: v.number(),
        unit_price: v.number(),
        total_price: v.number(),
      }),
    ),
    subtotal: v.number(),
    discountAmount: v.optional(v.number()),
    shippingAmount: v.number(),
    totalAmount: v.number(),
    currency: v.string(),
    shippingAddress: v.string(),
    paymentMethod: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    const siteUrl = getSiteUrl();

    const html = await render(
      OrderConfirmation({
        customerName: args.customerName,
        orderNumber: args.orderNumber,
        storeName: args.storeName,
        items: args.items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          unit_price: formatAmount(i.unit_price, args.currency),
          total_price: formatAmount(i.total_price, args.currency),
        })),
        subtotal: formatAmount(args.subtotal, args.currency),
        discount: args.discountAmount
          ? formatAmount(args.discountAmount, args.currency)
          : undefined,
        shipping:
          args.shippingAmount > 0
            ? formatAmount(args.shippingAmount, args.currency)
            : "Gratuite",
        total: formatAmount(args.totalAmount, args.currency),
        shippingAddress: args.shippingAddress,
        paymentMethod: args.paymentMethod,
        orderUrl: `${siteUrl}/orders/${args.orderId}`,
      }),
    );

    await resend.emails.send({
      from: EMAIL_FROM,
      to: args.customerEmail,
      subject: `Commande ${args.orderNumber} confirmée — Pixel-Mart`,
      html,
    });
  },
});

// ─── New Order → Vendor ─────────────────────────────────────

export const sendNewOrderNotification = internalAction({
  args: {
    vendorEmail: v.string(),
    vendorName: v.string(),
    orderNumber: v.string(),
    orderId: v.string(),
    customerName: v.string(),
    items: v.array(
      v.object({
        title: v.string(),
        quantity: v.number(),
        total_price: v.number(),
        sku: v.optional(v.string()),
      }),
    ),
    totalAmount: v.number(),
    commissionAmount: v.number(),
    currency: v.string(),
    shippingAddress: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    const siteUrl = getSiteUrl();
    const netRevenue = args.totalAmount - args.commissionAmount;

    const html = await render(
      NewOrder({
        vendorName: args.vendorName,
        orderNumber: args.orderNumber,
        customerName: args.customerName,
        items: args.items.map((i) => ({
          title: i.title,
          quantity: i.quantity,
          total_price: formatAmount(i.total_price, args.currency),
          sku: i.sku,
        })),
        total: formatAmount(args.totalAmount, args.currency),
        commission: formatAmount(args.commissionAmount, args.currency),
        netRevenue: formatAmount(netRevenue, args.currency),
        shippingAddress: args.shippingAddress,
        orderUrl: `${siteUrl}/vendor/orders/${args.orderId}`,
      }),
    );

    await resend.emails.send({
      from: EMAIL_FROM,
      to: args.vendorEmail,
      subject: `Nouvelle commande ${args.orderNumber} — Pixel-Mart`,
      html,
    });
  },
});

// ─── Order Shipped → Client ─────────────────────────────────

export const sendOrderShipped = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    orderNumber: v.string(),
    orderId: v.string(),
    storeName: v.string(),
    trackingNumber: v.optional(v.string()),
    carrier: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    const siteUrl = getSiteUrl();

    const html = await render(
      OrderShipped({
        customerName: args.customerName,
        orderNumber: args.orderNumber,
        storeName: args.storeName,
        trackingNumber: args.trackingNumber,
        carrier: args.carrier,
        orderUrl: `${siteUrl}/orders/${args.orderId}`,
      }),
    );

    await resend.emails.send({
      from: EMAIL_FROM,
      to: args.customerEmail,
      subject: `Votre commande ${args.orderNumber} a été expédiée !`,
      html,
    });
  },
});

// ─── Order Delivered → Client ───────────────────────────────

export const sendOrderDelivered = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    orderNumber: v.string(),
    orderId: v.string(),
    storeName: v.string(),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    const siteUrl = getSiteUrl();

    const html = await render(
      OrderDelivered({
        customerName: args.customerName,
        orderNumber: args.orderNumber,
        storeName: args.storeName,
        orderUrl: `${siteUrl}/orders/${args.orderId}`,
      }),
    );

    await resend.emails.send({
      from: EMAIL_FROM,
      to: args.customerEmail,
      subject: `Votre commande ${args.orderNumber} a été livrée !`,
      html,
    });
  },
});

// ─── Order Cancelled → Client ───────────────────────────────

export const sendOrderCancelled = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    orderNumber: v.string(),
    storeName: v.string(),
    totalAmount: v.number(),
    currency: v.string(),
    reason: v.optional(v.string()),
    wasRefunded: v.boolean(),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    const siteUrl = getSiteUrl();

    const html = await render(
      OrderCancelled({
        customerName: args.customerName,
        orderNumber: args.orderNumber,
        storeName: args.storeName,
        reason: args.reason,
        wasRefunded: args.wasRefunded,
        total: formatAmount(args.totalAmount, args.currency),
        ordersUrl: `${siteUrl}/orders`,
      }),
    );

    await resend.emails.send({
      from: EMAIL_FROM,
      to: args.customerEmail,
      subject: `Commande ${args.orderNumber} annulée — Pixel-Mart`,
      html,
    });
  },
});
