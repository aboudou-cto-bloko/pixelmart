// filepath: convex/payments/mutations.ts

import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import {
  assertValidTransition,
  OrderItemInput,
  restoreInventory,
} from "../orders/helpers";

/**
 * Stocke la référence de paiement Moneroo dans la commande.
 * Appelée après l'initialisation du paiement.
 */
export const setPaymentReference = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentReference: v.string(),
    paymentMethod: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      payment_reference: args.paymentReference,
      payment_method: args.paymentMethod,
      updated_at: Date.now(),
    });
  },
});

/**
 * Confirme un paiement réussi.
 *
 * 1. Order : pending → paid
 * 2. payment_status : pending → paid
 * 3. Rule F-01 : crée une transaction "sale" (credit store)
 * 4. Rule F-01 : crée une transaction "fee" (commission Pixel-Mart)
 * 5. Crédite le pending_balance du store (libéré après 48h)
 *
 * IDEMPOTENT : si déjà paid, ne fait rien.
 */
export const confirmPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    paymentReference: v.string(),
    amountPaid: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");

    // Idempotence : si déjà payée, skip
    if (order.payment_status === "paid") {
      return { alreadyProcessed: true };
    }

    // Valider le montant reçu (protection contre les webhooks falsifiés)
    if (args.amountPaid < order.total_amount) {
      throw new Error(
        `Montant reçu insuffisant pour la commande ${order.order_number} : ` +
          `${args.amountPaid} centimes reçus, ${order.total_amount} attendus`,
      );
    }

    // Valider la transition
    assertValidTransition(order.status, "paid");

    // 1. Mettre à jour la commande
    await ctx.db.patch(args.orderId, {
      status: "paid",
      payment_status: "paid",
      payment_reference: args.paymentReference,
      updated_at: Date.now(),
    });

    // 2. Récupérer le store
    const store = await ctx.db.get(order.store_id);
    if (!store) throw new Error("Boutique introuvable");

    // 3. Montant net = total - commission
    const commissionAmount = order.commission_amount ?? 0;
    const netAmount = order.total_amount - commissionAmount;

    // 4. F-01 : Transaction "sale" — crédit pour le vendeur
    const balanceBefore = store.pending_balance;
    const balanceAfter = balanceBefore + netAmount;

    const isDemoStore = store.is_demo === true;

    await ctx.db.insert("transactions", {
      store_id: store._id,
      order_id: args.orderId,
      type: "sale",
      direction: "credit",
      amount: netAmount,
      currency: order.currency,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: "completed",
      reference: args.paymentReference,
      description: `Vente commande ${order.order_number}`,
      processed_at: Date.now(),
      is_demo: isDemoStore ? true : undefined,
    });

    // 5. F-01 : Transaction "fee" — commission Pixel-Mart
    if (commissionAmount > 0) {
      await ctx.db.insert("transactions", {
        store_id: store._id,
        order_id: args.orderId,
        type: "fee",
        direction: "debit",
        amount: commissionAmount,
        currency: order.currency,
        balance_before: balanceAfter,
        balance_after: balanceAfter, // Le fee est déjà déduit du net
        status: "completed",
        reference: args.paymentReference,
        description: `Commission Pixel-Mart commande ${order.order_number}`,
        processed_at: Date.now(),
        is_demo: isDemoStore ? true : undefined,
      });
    }

    // 5b. Affiliation : créer un enregistrement de commission si la boutique a un parrain
    if (store.affiliate_link_id && store.affiliate_commission_rate_bp) {
      const affiliateLink = await ctx.db.get(store.affiliate_link_id);
      if (affiliateLink && affiliateLink.is_active) {
        const orderSubtotal = order.subtotal - order.discount_amount;
        const affiliateCommissionAmount = Math.round(
          (orderSubtotal * store.affiliate_commission_rate_bp) / 10_000,
        );
        if (affiliateCommissionAmount > 0) {
          await ctx.scheduler.runAfter(
            0,
            internal.affiliate.mutations.createCommissionRecord,
            {
              affiliate_link_id: store.affiliate_link_id,
              referrer_store_id: affiliateLink.referrer_store_id,
              referlee_store_id: store._id,
              order_id: args.orderId,
              order_subtotal: orderSubtotal,
              commission_rate_bp: store.affiliate_commission_rate_bp,
              commission_amount: affiliateCommissionAmount,
              currency: order.currency,
            },
          );
        }
      }
    }

    // 6. Créditer le pending_balance (libéré après 48h par cron)
    await ctx.db.patch(store._id, {
      pending_balance: balanceAfter,
      total_orders: store.total_orders + 1,
      updated_at: Date.now(),
    });

    // ── Emails + In-app ──
    const customer = await ctx.db.get(order.customer_id);

    // In-app + push au client
    if (customer) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.createInAppNotification,
        {
          userId: customer._id,
          type: "order_status",
          title: `Commande ${order.order_number} confirmée`,
          body: `Votre paiement a été confirmé. ${store.name} prépare votre commande.`,
          link: `/orders`,
          channels: ["in_app", "push"],
          sentVia: ["in_app"],
          metadata: undefined,
        },
      );
      await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
        userId: customer._id,
        title: `Commande ${order.order_number} confirmée`,
        body: `${store.name} prépare votre commande.`,
        url: "/orders",
      });
    }

    // Email confirmation au client
    if (customer?.email) {
      const shippingAddr = order.shipping_address;
      const addrStr = `${shippingAddr.full_name}, ${shippingAddr.line1}, ${shippingAddr.city}, ${shippingAddr.country}`;

      await ctx.scheduler.runAfter(
        0,
        internal.emails.send.sendOrderConfirmation,
        {
          customerEmail: customer.email,
          customerName: customer.name ?? "Client",
          orderNumber: order.order_number,
          orderId: args.orderId,
          storeName: store.name,
          items: order.items.map((i) => ({
            title: i.title,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.total_price,
          })),
          subtotal: order.subtotal,
          discountAmount:
            order.discount_amount > 0 ? order.discount_amount : undefined,
          shippingAmount: order.shipping_amount,
          totalAmount: order.total_amount,
          currency: order.currency,
          shippingAddress: addrStr,
          paymentMethod: order.payment_method ?? "mobile_money",
        },
      );
    }

    // Email "nouvelle commande" au vendeur
    const vendor = await ctx.db.get(store.owner_id);
    if (vendor?.email) {
      await ctx.scheduler.runAfter(
        0,
        internal.emails.send.sendNewOrderNotification,
        {
          vendorEmail: vendor.email,
          vendorName: vendor.name ?? "Vendeur",
          orderNumber: order.order_number,
          orderId: args.orderId,
          customerName: customer?.name ?? "Client",
          items: order.items.map((i) => ({
            title: i.title,
            quantity: i.quantity,
            total_price: i.total_price,
            sku: i.sku,
          })),
          totalAmount: order.total_amount,
          commissionAmount: commissionAmount,
          currency: order.currency,
          shippingAddress: `${order.shipping_address.full_name}, ${order.shipping_address.line1}, ${order.shipping_address.city}`,
        },
      );

      // In-app vendeur
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.notifyNewOrderInApp,
        {
          vendorUserId: vendor._id,
          orderNumber: order.order_number,
          customerName: customer?.name ?? "Client",
          totalAmount: order.total_amount,
          currency: order.currency,
        },
      );
    }

    return { success: true };
  },
});

/**
 * Marque un paiement comme échoué.
 * Restaure le stock (la commande avait décrémenté le stock à la création).
 */
export const failPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");

    // Idempotence
    if (order.payment_status === "failed") {
      return { alreadyProcessed: true };
    }

    // Ne pas toucher une commande déjà payée
    if (order.payment_status === "paid") {
      return { alreadyProcessed: true };
    }

    await ctx.db.patch(args.orderId, {
      status: "cancelled",
      payment_status: "failed",
      updated_at: Date.now(),
    });

    // Restaurer le stock
    await restoreInventory(ctx, order.items);

    // Notifier le client
    const customer = await ctx.db.get(order.customer_id);

    // Récupérer la boutique et le vendeur
    const store = await ctx.db.get(order.store_id);

    if (customer) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.createInAppNotification,
        {
          userId: customer._id,
          type: "order_status",
          title: `Paiement échoué — Commande ${order.order_number}`,
          body: "Votre paiement n'a pas pu être traité. La commande a été annulée.",
          link: "/orders",
          channels: ["in_app", "push", "email"],
          sentVia: ["in_app"],
          metadata: undefined,
        },
      );
      await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
        userId: customer._id,
        title: `Paiement échoué — Commande ${order.order_number}`,
        body: "Votre paiement n'a pas pu être traité. La commande a été annulée.",
        url: "/orders",
      });

      // Hydrater les slugs produit pour les liens de relance dans l'email
      const siteUrl = process.env.SITE_URL ?? "https://www.pixel-mart-bj.com";
      const isVendorShop = order.source === "vendor_shop";
      const storeSlug = store?.slug ?? "";

      const itemsWithUrls = await Promise.all(
        order.items.map(async (item) => {
          const product = await ctx.db.get(item.product_id);
          const slug = product?.slug ?? "";
          const productUrl = isVendorShop
            ? `${siteUrl}/shop/${storeSlug}/products/${slug}`
            : `${siteUrl}/products/${slug}`;
          return { title: item.title, quantity: item.quantity, productUrl };
        }),
      );

      const retryUrl = isVendorShop ? `${siteUrl}/shop/${storeSlug}` : siteUrl;

      // Email ciblé avec liens vers les produits pour repasser commande
      await ctx.scheduler.runAfter(0, internal.emails.send.sendPaymentFailed, {
        customerEmail: customer.email,
        customerName: customer.name ?? "Client",
        orderNumber: order.order_number,
        storeName: store?.name ?? "",
        totalAmount: order.total_amount,
        currency: order.currency,
        items: itemsWithUrls,
        retryUrl,
      });
    }

    // Notifier le vendeur
    if (store) {
      const vendor = await ctx.db.get(store.owner_id);
      if (vendor) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyPaymentFailed,
          {
            vendorUserId: vendor._id,
            vendorEmail: vendor.email,
            customerName: customer?.name ?? "Client",
            orderNumber: order.order_number,
            storeName: store.name,
            totalAmount: order.total_amount,
            currency: order.currency,
          },
        );
      }
    }

    return { success: true };
  },
});

/**
 * Marque une commande comme remboursée après traitement Moneroo.
 * Appelée depuis requestRefund action.
 */
export const markRefunded = internalMutation({
  args: {
    orderId: v.id("orders"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Commande introuvable");

    // Idempotence
    if (order.payment_status === "refunded") return { alreadyProcessed: true };

    await ctx.db.patch(args.orderId, {
      payment_status: "refunded",
      updated_at: Date.now(),
    });

    // F-01 : débit de la pending_balance du store si le montant est encore en attente
    const store = await ctx.db.get(order.store_id);
    if (store) {
      const netAmount = order.total_amount - (order.commission_amount ?? 0);
      const deductFromPending = Math.min(netAmount, store.pending_balance);

      if (deductFromPending > 0) {
        await ctx.db.insert("transactions", {
          store_id: store._id,
          order_id: order._id,
          type: "refund",
          direction: "debit",
          amount: deductFromPending,
          currency: order.currency,
          balance_before: store.pending_balance,
          balance_after: store.pending_balance - deductFromPending,
          status: "completed",
          description: `Remboursement commande ${order.order_number}${args.reason ? ` — ${args.reason}` : ""}`,
          processed_at: Date.now(),
        });

        await ctx.db.patch(store._id, {
          pending_balance: store.pending_balance - deductFromPending,
          updated_at: Date.now(),
        });
      }
    }

    // Notifier le client du remboursement (email + in-app + push)
    const customer = await ctx.db.get(order.customer_id);
    if (customer) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.notifyOrderRefunded,
        {
          customerUserId: customer._id,
          customerEmail: customer.email,
          customerName: customer.name ?? "Client",
          orderNumber: order.order_number,
          storeName: store?.name ?? "Boutique",
          totalAmount: order.total_amount,
          currency: order.currency,
        },
      );
    }

    return { success: true };
  },
});

/**
 * Déduplication des webhooks Moneroo.
 *
 * Vérifie si un event_id a déjà été traité.
 * Si oui, retourne { alreadyProcessed: true } sans rien faire.
 * Si non, l'enregistre et retourne { alreadyProcessed: false }.
 *
 * Atomique : la vérification et l'insertion sont dans la même mutation Convex.
 */
export const markWebhookEventProcessed = internalMutation({
  args: { event_id: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhook_events")
      .withIndex("by_event_id", (q) => q.eq("event_id", args.event_id))
      .unique();

    if (existing) return { alreadyProcessed: true };

    await ctx.db.insert("webhook_events", {
      event_id: args.event_id,
      processed_at: Date.now(),
    });

    return { alreadyProcessed: false };
  },
});
