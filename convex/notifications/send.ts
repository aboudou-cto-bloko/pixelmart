// filepath: convex/notifications/send.ts
"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { formatAmountText } from "../lib/format";

import LowStockAlert from "../../emails/LowStockAlert";
import PayoutCompleted from "../../emails/PayoutCompleted";
import OrderStatusUpdate from "../../emails/OrderStatusUpdate";
import StorageRequestReceived from "../../emails/StorageRequestReceived";
import StorageValidated from "../../emails/StorageValidated";
import StorageRejected from "../../emails/StorageRejected";
import StorageInvoiceCreated from "../../emails/StorageInvoiceCreated";
import StorageDebtDeducted from "../../emails/StorageDebtDeducted";
import StorageInvoicePaid from "../../emails/StorageInvoicePaid";
import ReturnStatusUpdate from "../../emails/ReturnStatusUpdate";
import NewReview from "../../emails/NewReview";
import VendorOrderCancelled from "../../emails/VendorOrderCancelled";
import VendorOrderDelivered from "../../emails/VendorOrderDelivered";
import VendorDeliveryFailed from "../../emails/VendorDeliveryFailed";
import OrderRefunded from "../../emails/OrderRefunded";
import DemoInvite from "../../emails/DemoInvite";

const EMAIL_FROM = "Pixel-Mart <noreply@pixel-mart-bj.com>";

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

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Alerte stock faible",
      body: `${args.productTitle} — ${args.currentQuantity} restant(s)`,
      url: "/vendor/products",
    });
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
    const formatted = formatAmountText(args.amount, args.currency);

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

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Retrait effectué",
      body: `${formatted} envoyé via ${args.method}`,
      url: "/vendor/finance",
    });
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
      ready_for_delivery: "Prête pour livraison",
      shipped: "Expédiée",
      delivered: "Livrée",
      delivery_failed: "Échec de livraison",
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

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.customerUserId,
      title,
      body: `${args.storeName} — Statut : ${label}`,
      url: "/orders",
    });
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
    const formatted = formatAmountText(args.totalAmount, args.currency);

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

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Nouvelle commande",
      body: `${args.customerName} — ${args.orderNumber} (${formatted})`,
      url: "/vendor/orders",
    });
  },
});

// ─── Payment Failed → Vendor (in-app + push) ─────────────────

export const notifyPaymentFailed = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.optional(v.string()),
    customerName: v.string(),
    orderNumber: v.string(),
    storeName: v.string(),
    totalAmount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const formatted = formatAmountText(args.totalAmount, args.currency);

    // In-app → vendor
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "payment",
      title: "Paiement échoué",
      body: `${args.customerName} — ${args.orderNumber} (${formatted}) — paiement non abouti`,
      link: "/vendor/orders",
      channels: ["in_app", "push", "email"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // Email → vendor
    if (args.vendorEmail) {
      try {
        const resend = getResend();
        await resend.emails.send({
          from: EMAIL_FROM,
          to: args.vendorEmail,
          subject: `Paiement échoué — Commande ${args.orderNumber}`,
          html: `<p>Bonjour,</p><p>Le paiement de la commande <strong>${args.orderNumber}</strong> de ${args.customerName} (${formatted}) n'a pas abouti. La commande a été annulée et le stock restauré.</p><p><a href="${process.env.SITE_URL ?? ""}/vendor/orders">Voir mes commandes</a></p>`,
        });
      } catch (error) {
        console.error("[Notification] PaymentFailed email failed:", error);
      }
    }

    // Push → vendor
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Paiement échoué",
      body: `Commande ${args.orderNumber} de ${args.customerName} — paiement non abouti`,
      url: "/vendor/orders",
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

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.customerUserId,
      title: `Commande ${args.orderNumber} — ${label}`,
      body: `${args.storeName} — Statut : ${label}`,
      url: "/orders",
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
      refunded: `Remboursement de ${formatAmountText(args.refundAmount, args.currency)} traité pour la commande ${args.orderNumber}`,
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
        const resend = getResend();
        const html = await render(
          ReturnStatusUpdate({
            recipientName: args.recipientName,
            orderNumber: args.orderNumber,
            storeName: args.storeName,
            returnStatus: args.returnStatus,
            refundAmount: args.refundAmount,
            currency: args.currency,
            customerName: args.customerName,
            isVendorNotification: args.isVendorNotification,
          }),
        );
        await resend.emails.send({
          from: EMAIL_FROM,
          to: args.recipientEmail,
          subject: `${titleMap[args.returnStatus]} — Commande ${args.orderNumber}`,
          html,
        });
      } catch (error) {
        console.error("Failed to send return status email:", error);
      }
    }

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.recipientUserId,
      title: titleMap[args.returnStatus] ?? "Mise à jour retour",
      body:
        bodyMap[args.returnStatus] ??
        `Retour commande ${args.orderNumber} mis à jour`,
      url: link,
    });
  },
});

// ─── Storage: Request Received (email + in-app) → Vendor ─────────────────

export const notifyStorageRequestReceived = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),
    storageCode: v.string(),
    productName: v.string(),
    estimatedQty: v.optional(v.number()),
    storeName: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "storage_received",
      title: "Demande de stockage créée",
      body: `Code : ${args.storageCode} — Écrivez ce code sur votre colis "${args.productName}"`,
      link: "/vendor/storage",
      channels: ["email", "in_app"],
      sentVia: ["in_app"],
      metadata: { storage_code: args.storageCode },
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        StorageRequestReceived({
          vendorName: args.vendorName,
          storageCode: args.storageCode,
          productName: args.productName,
          estimatedQty: args.estimatedQty,
          storeName: args.storeName,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Demande de stockage créée — Code : ${args.storageCode}`,
        html,
      });
    } catch (error) {
      console.error(
        "[Notification] StorageRequestReceived email failed:",
        error,
      );
    }

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Demande de stockage créée",
      body: `Code : ${args.storageCode} — Écrivez ce code sur votre colis`,
      url: "/vendor/storage",
    });
  },
});

// ─── Storage: Validated (email + in-app) → Vendor ────────────────────────

export const notifyStorageValidated = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),
    storageCode: v.string(),
    productName: v.string(),
    storageFee: v.number(),
    currency: v.string(),
    paymentMethod: v.union(
      v.literal("immediate"),
      v.literal("auto_debit"),
      v.literal("deferred"),
    ),
    actualQty: v.optional(v.number()),
    actualWeightKg: v.optional(v.number()),
    measurementType: v.optional(
      v.union(v.literal("units"), v.literal("weight")),
    ),
  },
  handler: async (ctx, args) => {
    const fmtFee = formatAmountText(args.storageFee, args.currency);

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "storage_validated",
      title: "Produit mis en stock",
      body: `${args.storageCode} — "${args.productName}" est maintenant en stock. Frais : ${fmtFee}.`,
      link: "/vendor/storage",
      channels: ["email", "in_app"],
      sentVia: ["in_app"],
      metadata: { storage_code: args.storageCode },
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        StorageValidated({
          vendorName: args.vendorName,
          storageCode: args.storageCode,
          productName: args.productName,
          storageFee: args.storageFee,
          currency: args.currency,
          paymentMethod: args.paymentMethod,
          actualQty: args.actualQty,
          actualWeightKg: args.actualWeightKg,
          measurementType: args.measurementType,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `${args.storageCode} en stock — Frais : ${fmtFee}`,
        html,
      });
    } catch (error) {
      console.error("[Notification] StorageValidated email failed:", error);
    }

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Produit mis en stock",
      body: `${args.storageCode} — "${args.productName}" est maintenant en stock. Frais : ${fmtFee}.`,
      url: "/vendor/storage",
    });
  },
});

// ─── Storage: Rejected (email + in-app) → Vendor ─────────────────────────

export const notifyStorageRejected = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),
    storageCode: v.string(),
    productName: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "storage_rejected",
      title: "Demande de stockage rejetée",
      body: `${args.storageCode} — "${args.productName}" a été rejeté`,
      link: "/vendor/storage",
      channels: ["email", "in_app"],
      sentVia: ["in_app"],
      metadata: { storage_code: args.storageCode },
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        StorageRejected({
          vendorName: args.vendorName,
          storageCode: args.storageCode,
          productName: args.productName,
          reason: args.reason,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Demande de stockage ${args.storageCode} rejetée`,
        html,
      });
    } catch (error) {
      console.error("[Notification] StorageRejected email failed:", error);
    }

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Demande de stockage rejetée",
      body: `${args.storageCode} — "${args.productName}" a été rejeté`,
      url: "/vendor/storage",
    });
  },
});

// ─── Storage: Invoice Created (email + in-app) → Vendor ──────────────────

export const notifyStorageInvoiceCreated = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),
    storageCode: v.string(),
    productName: v.string(),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.union(
      v.literal("immediate"),
      v.literal("auto_debit"),
      v.literal("deferred"),
    ),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fmtAmt = formatAmountText(args.amount, args.currency);

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "storage_invoice",
      title: "Facture de stockage",
      body: `${args.storageCode} — Montant : ${fmtAmt}`,
      link: "/vendor/billing",
      channels: ["email", "in_app"],
      sentVia: ["in_app"],
      metadata: { storage_code: args.storageCode },
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        StorageInvoiceCreated({
          vendorName: args.vendorName,
          storageCode: args.storageCode,
          productName: args.productName,
          amount: args.amount,
          currency: args.currency,
          paymentMethod: args.paymentMethod,
          dueDate: args.dueDate,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Facture de stockage — ${fmtAmt}`,
        html,
      });
    } catch (error) {
      console.error(
        "[Notification] StorageInvoiceCreated email failed:",
        error,
      );
    }

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Facture de stockage",
      body: `${args.storageCode} — Montant : ${fmtAmt}`,
      url: "/vendor/billing",
    });
  },
});

// ─── Storage: Invoice Paid (in-app + push + email) → Vendor ──────────────

export const notifyStorageInvoicePaid = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),
    amount: v.number(),
    currency: v.string(),
    storageCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fmtAmt = formatAmountText(args.amount, args.currency);

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "storage_invoice",
      title: "Facture de stockage réglée",
      body: `Votre facture de ${fmtAmt} a été confirmée`,
      link: "/vendor/billing",
      channels: ["in_app", "push", "email"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        StorageInvoicePaid({
          vendorName: args.vendorName,
          amount: args.amount,
          currency: args.currency,
          storageCode: args.storageCode,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Facture de stockage réglée — ${fmtAmt}`,
        html,
      });
    } catch (error) {
      console.error("[Notification] StorageInvoicePaid email failed:", error);
    }

    // 3. Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Facture de stockage réglée",
      body: `Votre facture de ${fmtAmt} a été confirmée`,
      url: "/vendor/billing",
    });
  },
});

// ─── Storage: Debt Deducted (email + in-app) → Vendor ────────────────────

export const notifyStorageDebtDeducted = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),
    deductedAmount: v.number(),
    currency: v.string(),
    grossPayout: v.number(),
    netPayout: v.number(),
    period: v.string(),
  },
  handler: async (ctx, args) => {
    const fmtAmt = formatAmountText(args.deductedAmount, args.currency);

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "storage_debt_deducted",
      title: "Dette de stockage déduite",
      body: `${fmtAmt} déduit de votre retrait (${args.period})`,
      link: "/vendor/billing",
      channels: ["email", "in_app"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        StorageDebtDeducted({
          vendorName: args.vendorName,
          deductedAmount: args.deductedAmount,
          currency: args.currency,
          grossPayout: args.grossPayout,
          netPayout: args.netPayout,
          period: args.period,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Dette de stockage déduite — ${fmtAmt}`,
        html,
      });
    } catch (error) {
      console.error("[Notification] StorageDebtDeducted email failed:", error);
    }

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Dette de stockage déduite",
      body: `${fmtAmt} déduit de votre retrait (${args.period})`,
      url: "/vendor/billing",
    });
  },
});

// ─── New Review Notification (email + in-app) ──────────────────────────────

export const notifyNewReview = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),

    customerName: v.string(),
    productTitle: v.string(),
    rating: v.number(),
    reviewTitle: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. In-app notification
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "new_review",
      title: `Nouvel avis ${args.rating}★ sur ${args.productTitle}`,
      body: `${args.customerName} a donné ${args.rating}/5 étoiles`,
      link: "/vendor/reviews",
      channels: ["email", "in_app"],
      sentVia: ["in_app"],
      metadata: {
        rating: args.rating,
        reviewTitle: args.reviewTitle,
        productTitle: args.productTitle,
        customerName: args.customerName,
      },
    });

    // 2. Email notification
    try {
      const resend = getResend();
      const html = await render(
        NewReview({
          vendorName: args.vendorName,
          customerName: args.customerName,
          productTitle: args.productTitle,
          rating: args.rating,
          reviewTitle: args.reviewTitle,
          dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/vendor/reviews`,
        }),
      );

      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Nouvel avis sur ${args.productTitle}`,
        html,
      });
    } catch (error) {
      console.error("[Notification] Review email failed:", error);
    }

    // Push notification
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: `Nouvel avis ${args.rating}★ sur ${args.productTitle}`,
      body: `${args.customerName} a donné ${args.rating}/5 étoiles`,
      url: "/vendor/reviews",
    });
  },
});

export const notifyNewQuestion = internalAction({
  args: {
    vendorUserId: v.id("users"),
    productTitle: v.string(),
    customerName: v.string(),
    body: v.string(),
    productSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const notifBody = `${args.customerName} a posé une question sur "${args.productTitle}" : "${args.body.slice(0, 80)}${args.body.length > 80 ? "…" : ""}"`;

    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "question",
      title: "Nouvelle question sur un produit",
      body: notifBody,
      link: `/vendor/products`,
      channels: ["in_app", "push"],
      sentVia: ["in_app"],
    });

    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: "Nouvelle question sur un produit",
      body: notifBody,
      url: "/vendor/products",
    });
  },
});

export const notifyQuestionAnswered = internalAction({
  args: {
    customerUserId: v.id("users"),
    productTitle: v.string(),
    vendorName: v.string(),
    answer: v.string(),
    productSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const notifBody = `${args.vendorName} a répondu à votre question sur "${args.productTitle}" : "${args.answer.slice(0, 80)}${args.answer.length > 80 ? "…" : ""}"`;

    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.customerUserId,
      type: "question_answered",
      title: "Votre question a reçu une réponse",
      body: notifBody,
      link: `/products/${args.productSlug}`,
      channels: ["in_app", "push"],
      sentVia: ["in_app"],
    });

    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.customerUserId,
      title: "Votre question a reçu une réponse",
      body: notifBody,
      url: `/products/${args.productSlug}`,
    });
  },
});

export const notifyReviewReplied = internalAction({
  args: {
    customerUserId: v.id("users"),
    productTitle: v.string(),
    vendorName: v.string(),
    reply: v.string(),
    productSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const notifBody = `${args.vendorName} a répondu à votre avis sur "${args.productTitle}" : "${args.reply.slice(0, 80)}${args.reply.length > 80 ? "…" : ""}"`;

    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.customerUserId,
      type: "review_replied",
      title: "Le vendeur a répondu à votre avis",
      body: notifBody,
      link: `/products/${args.productSlug}`,
      channels: ["in_app", "push"],
      sentVia: ["in_app"],
    });

    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.customerUserId,
      title: "Le vendeur a répondu à votre avis",
      body: notifBody,
      url: `/products/${args.productSlug}`,
    });
  },
});

// ─── Vendor: Order Cancelled (email + in-app + push) ────────────────────────

export const notifyVendorOrderCancelled = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),
    orderNumber: v.string(),
    orderId: v.string(),
    customerName: v.string(),
    totalAmount: v.number(),
    currency: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const formatted = formatAmountText(args.totalAmount, args.currency);
    const siteUrl = process.env.SITE_URL ?? "https://www.pixel-mart-bj.com";

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "order_status",
      title: `Commande ${args.orderNumber} annulée`,
      body: `${args.customerName} — ${args.orderNumber} (${formatted}) annulée`,
      link: "/vendor/orders",
      channels: ["email", "in_app", "push"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        VendorOrderCancelled({
          vendorName: args.vendorName,
          orderNumber: args.orderNumber,
          customerName: args.customerName,
          total: formatted,
          reason: args.reason,
          orderUrl: `${siteUrl}/vendor/orders`,
        }),
      );
      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Commande ${args.orderNumber} annulée — Pixel-Mart`,
        html,
      });
    } catch (error) {
      console.error("[Notification] VendorOrderCancelled email failed:", error);
    }

    // 3. Push
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: `Commande ${args.orderNumber} annulée`,
      body: `${args.customerName} — ${formatted}`,
      url: "/vendor/orders",
    });
  },
});

// ─── Vendor: Delivery Confirmed (email + in-app + push) ─────────────────────

export const notifyVendorDeliveryConfirmed = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),
    orderNumber: v.string(),
    orderId: v.string(),
    customerName: v.string(),
    confirmedBy: v.union(v.literal("customer"), v.literal("auto")),
  },
  handler: async (ctx, args) => {
    const siteUrl = process.env.SITE_URL ?? "https://www.pixel-mart-bj.com";
    const byLabel =
      args.confirmedBy === "customer"
        ? `confirmée par ${args.customerName}`
        : "confirmée automatiquement";

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "order_status",
      title: `Commande ${args.orderNumber} livrée`,
      body: `Livraison ${byLabel}`,
      link: `/vendor/orders/${args.orderId}`,
      channels: ["email", "in_app", "push"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        VendorOrderDelivered({
          vendorName: args.vendorName,
          orderNumber: args.orderNumber,
          customerName: args.customerName,
          confirmedBy: args.confirmedBy,
          orderUrl: `${siteUrl}/vendor/orders/${args.orderId}`,
        }),
      );
      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Commande ${args.orderNumber} livrée — Pixel-Mart`,
        html,
      });
    } catch (error) {
      console.error("[Notification] VendorOrderDelivered email failed:", error);
    }

    // 3. Push
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: `Commande ${args.orderNumber} livrée`,
      body: `Livraison ${byLabel}`,
      url: `/vendor/orders/${args.orderId}`,
    });
  },
});

// ─── Vendor: Delivery Failed (email + in-app + push) ────────────────────────

export const notifyVendorDeliveryFailed = internalAction({
  args: {
    vendorUserId: v.id("users"),
    vendorEmail: v.string(),
    vendorName: v.string(),
    orderNumber: v.string(),
    orderId: v.string(),
    customerName: v.string(),
  },
  handler: async (ctx, args) => {
    const siteUrl = process.env.SITE_URL ?? "https://www.pixel-mart-bj.com";

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.vendorUserId,
      type: "order_status",
      title: `Échec de livraison — ${args.orderNumber}`,
      body: `La livraison pour ${args.customerName} a échoué. Replanifiez ou annulez.`,
      link: `/vendor/orders/${args.orderId}`,
      channels: ["email", "in_app", "push"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        VendorDeliveryFailed({
          vendorName: args.vendorName,
          orderNumber: args.orderNumber,
          customerName: args.customerName,
          orderUrl: `${siteUrl}/vendor/orders/${args.orderId}`,
        }),
      );
      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.vendorEmail,
        subject: `Échec de livraison — Commande ${args.orderNumber}`,
        html,
      });
    } catch (error) {
      console.error("[Notification] VendorDeliveryFailed email failed:", error);
    }

    // 3. Push
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.vendorUserId,
      title: `Échec de livraison — ${args.orderNumber}`,
      body: `Contactez ${args.customerName} pour replanifier.`,
      url: `/vendor/orders/${args.orderId}`,
    });
  },
});

// ─── Client: Order Refunded (email + in-app + push) ─────────────────────────

export const notifyOrderRefunded = internalAction({
  args: {
    customerUserId: v.id("users"),
    customerEmail: v.string(),
    customerName: v.string(),
    orderNumber: v.string(),
    storeName: v.string(),
    totalAmount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const formatted = formatAmountText(args.totalAmount, args.currency);
    const siteUrl = process.env.SITE_URL ?? "https://www.pixel-mart-bj.com";

    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      userId: args.customerUserId,
      type: "order_status",
      title: `Remboursement — ${args.orderNumber}`,
      body: `${formatted} remboursé pour la commande ${args.orderNumber}`,
      link: "/orders",
      channels: ["email", "in_app", "push"],
      sentVia: ["in_app"],
      metadata: undefined,
    });

    // 2. Email
    try {
      const resend = getResend();
      const html = await render(
        OrderRefunded({
          customerName: args.customerName,
          orderNumber: args.orderNumber,
          storeName: args.storeName,
          total: formatted,
          ordersUrl: `${siteUrl}/orders`,
        }),
      );
      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.customerEmail,
        subject: `Remboursement commande ${args.orderNumber} — Pixel-Mart`,
        html,
      });
    } catch (error) {
      console.error("[Notification] OrderRefunded email failed:", error);
    }

    // 3. Push
    await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
      userId: args.customerUserId,
      title: `Remboursement — ${args.orderNumber}`,
      body: `${formatted} remboursé`,
      url: "/orders",
    });
  },
});

// ─── Demo invite email ────────────────────────────────────────
export const notifyDemoInvite = internalAction({
  args: {
    email: v.string(),
    token: v.string(),
    inviterName: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const resend = getResend();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://pixel-mart-bj.com";
    const demoUrl = `${appUrl}/demo?token=${args.token}`;
    try {
      const html = await render(
        DemoInvite({ inviterName: args.inviterName, demoUrl, note: args.note }),
      );
      await resend.emails.send({
        from: EMAIL_FROM,
        to: args.email,
        subject: "Votre accès démo Pixel-Mart",
        html,
      });
    } catch (error) {
      console.error("[Notification] DemoInvite email failed:", error);
    }
  },
});
