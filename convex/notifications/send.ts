// filepath: convex/notifications/send.ts
"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Resend } from "resend";
import { render } from "@react-email/render";

// ── Seuls les NOUVEAUX templates ──
import LowStockAlert from "../../emails/LowStockAlert";
import PayoutCompleted from "../../emails/PayoutCompleted";
import OrderStatusUpdate from "../../emails/OrderStatusUpdate";

const EMAIL_FROM = "Pixel-Mart <onboarding@resend.dev>";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY non configurée");
  return new Resend(key);
}

// ─── Dispatch générique : crée la notification in-app ────────

/**
 * Crée une notification in-app pour n'importe quel type.
 * L'email est géré séparément — soit par convex/emails/send.ts (existant),
 * soit par les convenience dispatchers ci-dessous (nouveaux templates).
 */
export const createInAppNotification = internalAction({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    channels: v.array(v.string()),
    sentVia: v.array(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link,
      channels: args.channels,
      sentVia: args.sentVia,
      metadata: args.metadata,
    });
  },
});

// ─── Low Stock Alert (email + in-app) ────────────────────────

export const notifyLowStock = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    productTitle: v.string(),
    currentQuantity: v.number(),
    threshold: v.number(),
    storeName: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "low_stock",
      title: "Alerte stock faible",
      body: `${args.productTitle} — ${args.currentQuantity} restant(s)`,
      link: "/vendor/products",
      channels: ["email", "in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        LowStockAlert({
          productTitle: args.productTitle,
          currentQuantity: args.currentQuantity,
          threshold: args.threshold,
          storeName: args.storeName,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `⚠ Stock faible : ${args.productTitle}`,
        html,
      });
    } catch (error) {
      console.error("[Notification] Low stock email failed:", error);
    }
  },
});

// ─── Payout Completed (email + in-app) ──────────────────────

export const notifyPayoutCompleted = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    amount: v.number(),
    currency: v.string(),
    method: v.string(),
    storeName: v.string(),
  },
  handler: async (ctx, args) => {
    const formatted = `${(args.amount / 100).toLocaleString("fr-FR")} ${args.currency === "XOF" ? "FCFA" : args.currency}`;

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "payment",
      title: "Retrait effectué",
      body: `${formatted} envoyé via ${args.method}`,
      link: "/vendor/finance",
      channels: ["email", "in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        PayoutCompleted({
          amount: args.amount,
          currency: args.currency,
          method: args.method,
          storeName: args.storeName,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Retrait effectué — ${args.storeName}`,
        html,
      });
    } catch (error) {
      console.error("[Notification] Payout email failed:", error);
    }
  },
});

// ─── Order Status Update (email + in-app) — statut générique ─

/**
 * Pour les transitions qui N'ONT PAS de template dédié existant.
 * shipped → utilise convex/emails/send.ts sendOrderShipped (existant)
 * delivered → utilise convex/emails/send.ts sendOrderDelivered (existant)
 * cancelled → utilise convex/emails/send.ts sendOrderCancelled (existant)
 *
 * Ce dispatcher est pour : processing (et tout futur statut générique).
 */
export const notifyOrderStatusGeneric = internalAction({
  args: {
    customerUserId: v.id("users"),
    customerEmail: v.string(),
    orderNumber: v.string(),
    storeName: v.string(),
    previousStatus: v.string(),
    newStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const STATUS_LABELS: Record<string, string> = {
      pending: "En attente de paiement",
      paid: "Payée",
      processing: "En préparation",
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée",
      refunded: "Remboursée",
    };

    const label = STATUS_LABELS[args.newStatus] ?? args.newStatus;
    const title = `Commande ${args.orderNumber} — ${label}`;

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.customerUserId,
      type: "order_status",
      title,
      body: `${args.storeName} — Statut : ${label}`,
      link: "/orders",
      channels: ["email", "in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // 2. Email (template générique)
    try {
      const resend = getResend();
      const html = await render(
        OrderStatusUpdate({
          orderNumber: args.orderNumber,
          storeName: args.storeName,
          previousStatus: args.previousStatus,
          newStatus: args.newStatus,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.customerEmail,
        subject: title,
        html,
      });
    } catch (error) {
      console.error("[Notification] Status email failed:", error);
    }
  },
});

// ─── New Order → Vendor (in-app seulement, email via emails/send.ts) ─

export const notifyNewOrderInApp = internalAction({
  args: {
    vendorUserId: v.id("users"),
    orderNumber: v.string(),
    customerName: v.string(),
    totalAmount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const formatted = `${(args.totalAmount / 100).toLocaleString("fr-FR")} ${args.currency === "XOF" ? "FCFA" : args.currency}`;

    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "order_new",
      title: "Nouvelle commande",
      body: `${args.customerName} — ${args.orderNumber} (${formatted})`,
      link: "/vendor/orders",
      channels: ["email", "in_app"],
      sentVia: ["in_app", "email"], // email envoyé par emails/send.ts
      metadata: undefined,
    });
  },
});

// ─── Shipped/Delivered/Cancelled → Client (in-app seulement) ─

/**
 * In-app companion pour les emails déjà envoyés par convex/emails/send.ts.
 * Appelé en parallèle des sendOrderShipped/sendOrderDelivered/sendOrderCancelled.
 */

const ORDER_STATUSES = [
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const notifyOrderStatusInApp = internalAction({
  args: {
    customerUserId: v.id("users"),
    orderNumber: v.string(),
    storeName: v.string(),
    newStatus: v.union(...ORDER_STATUSES.map((s) => v.literal(s))),
  },
  handler: async (ctx, args) => {
    const STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
      shipped: "Expédiée",
      delivered: "Livrée",
      cancelled: "Annulée",
      refunded: "Remboursée",
    };

    const label = STATUS_LABELS[args.newStatus];

    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.customerUserId,
      type: "order_status",
      title: `Commande ${args.orderNumber} — ${label}`,
      body: `${args.storeName} — Statut : ${label}`,
      link: "/orders",
      channels: ["email", "in_app"],
      sentVia: ["in_app", "email"], // email envoyé par emails/send.ts
      metadata: undefined,
    });
  },
});

// ─── Return Status Notification ─────────────────────────────────

/**
 * Envoie une notification de mise à jour de retour (email + in-app).
 * Utilisé pour notifier le client ET le vendeur selon isVendorNotification.
 */

const RETURN_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "received",
  "refunded",
] as const;

export const notifyReturnStatus = internalAction({
  args: {
    recipientUserId: v.id("users"),
    recipientEmail: v.string(),
    recipientName: v.string(),
    orderNumber: v.string(),
    returnStatus: v.union(...RETURN_STATUSES.map((s) => v.literal(s))), // requested | approved | rejected | received | refunded
    storeName: v.string(),
    refundAmount: v.number(),
    currency: v.string(),
    customerName: v.string(),
    isVendorNotification: v.boolean(),
  },
  handler: async (ctx, args) => {
    // 1. In-app notification
    const titleMap: Record<string, string> = {
      requested: args.isVendorNotification
        ? "Nouvelle demande de retour"
        : "Demande de retour enregistrée",
      approved: "Retour approuvé",
      rejected: "Retour refusé",
      received: args.isVendorNotification
        ? "Articles retournés reçus"
        : "Articles reçus — remboursement en cours",
      refunded: "Remboursement effectué",
    };

    const bodyMap: Record<string, string> = {
      requested: args.isVendorNotification
        ? `${args.customerName} a demandé un retour sur la commande ${args.orderNumber}`
        : `Votre demande de retour pour la commande ${args.orderNumber} a été enregistrée`,
      approved: `Le retour pour la commande ${args.orderNumber} a été approuvé`,
      rejected: `Le retour pour la commande ${args.orderNumber} a été refusé`,
      received: args.isVendorNotification
        ? `Articles retournés reçus pour la commande ${args.orderNumber}`
        : `Le vendeur a reçu vos articles — remboursement en cours`,
      refunded: `Remboursement de ${args.refundAmount / 100} ${args.currency} traité pour la commande ${args.orderNumber}`,
    };

    const link = args.isVendorNotification
      ? "/vendor/orders/returns"
      : `/customer/returns`;

    await ctx.runAction(internal.notifications.send.createInAppNotification, {
      userId: args.recipientUserId,
      type: "return_status",
      title: titleMap[args.returnStatus] ?? "Mise à jour retour",
      body:
        bodyMap[args.returnStatus] ??
        `Retour commande ${args.orderNumber} mis à jour`,
      link,
      channels: ["in_app", "email"],
      sentVia: ["in_app", "email"],
      metadata: undefined,
    });

    // 2. Email via Resend
    if (args.recipientEmail) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { default: ReturnStatusUpdate } =
          await import("../../emails/ReturnStatusUpdate");

        await resend.emails.send({
          from:
            process.env.EMAIL_FROM ?? "Pixel-Mart <noreply@pixelmart.store>",
          to: args.recipientEmail,
          subject: `${titleMap[args.returnStatus]} — Commande ${args.orderNumber}`,
          react: ReturnStatusUpdate({
            recipientName: args.recipientName,
            orderNumber: args.orderNumber,
            storeName: args.storeName,
            returnStatus: args.returnStatus,
            refundAmount: args.refundAmount,
            currency: args.currency,
            customerName: args.customerName,
            isVendorNotification: args.isVendorNotification,
          }),
        });
      } catch (error) {
        console.error("Failed to send return status email:", error);
      }
    }
  },
});
