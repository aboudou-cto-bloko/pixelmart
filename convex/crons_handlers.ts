// filepath: convex/crons_handlers.ts

import { internalMutation } from "./_generated/server";
import { promoteQueuedBookings } from "./ads/helpers";
import { recalculateRatings } from "./reviews/helpers";
import { restoreInventory } from "./orders/helpers";
import { api, internal } from "./_generated/api";
import { getBalanceReleaseDelayMs } from "./lib/getConfig";
import { formatAmountText } from "./lib/format";
const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FORTY_EIGHT_HOURS_NOTIF_MS = 48 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

// ─── Balance Release ─────────────────────────────────────────

/**
 * Règle F-03 : Balance credited when order.status = 'delivered'
 * AND delivered_at > 48h.
 *
 * Transfère pending_balance → balance pour les commandes éligibles.
 */
export const releaseBalances = internalMutation({
  args: {},
  handler: async (ctx) => {
    const balanceReleaseDelayMs = await getBalanceReleaseDelayMs(ctx);
    const cutoff = Date.now() - balanceReleaseDelayMs;

    // Chercher toutes les commandes delivered avec delivered_at > 48h
    // qui n'ont pas encore été "released" (pas de transaction credit pour cette commande)
    const deliveredOrders = await ctx.db
      .query("orders")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "delivered"),
          q.eq(q.field("payment_status"), "paid"),
        ),
      )
      .collect();

    const eligibleOrders = deliveredOrders.filter(
      (order) => order.delivered_at && order.delivered_at <= cutoff,
    );

    let releasedCount = 0;

    for (const order of eligibleOrders) {
      // Vérifier qu'on n'a pas déjà release cette commande
      const existingRelease = await ctx.db
        .query("transactions")
        .withIndex("by_order", (q) => q.eq("order_id", order._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "credit"),
            q.eq(
              q.field("description"),
              `Release commande ${order.order_number}`,
            ),
          ),
        )
        .first();

      if (existingRelease) continue;

      const store = await ctx.db.get(order.store_id);
      if (!store) continue;

      const netAmount = order.total_amount - (order.commission_amount ?? 0);

      // Sécurité : ne jamais créditer plus que ce qui est en pending_balance
      // (évite un over-credit si pending_balance a été réduit entre-temps)
      const releasableAmount = Math.min(netAmount, store.pending_balance);
      if (releasableAmount <= 0) continue;

      // F-01 : Transaction de release
      const balanceBefore = store.balance;
      const balanceAfter = balanceBefore + releasableAmount;

      await ctx.db.insert("transactions", {
        store_id: store._id,
        order_id: order._id,
        type: "credit",
        direction: "credit",
        amount: releasableAmount,
        currency: order.currency,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: "completed",
        description: `Release commande ${order.order_number}`,
        processed_at: Date.now(),
      });

      // Transférer : pending_balance → balance
      const newPending = store.pending_balance - releasableAmount;

      await ctx.db.patch(store._id, {
        balance: balanceAfter,
        pending_balance: newPending,
        updated_at: Date.now(),
      });

      releasedCount++;
    }

    return { releasedCount };
  },
});

// ─── Low Stock Alerts ────────────────────────────────────────

/**
 * Vérifie les produits dont le stock est <= low_stock_threshold
 * et envoie une notification au vendeur (email + in-app).
 * Évite les doublons : ne notifie pas si une notif low_stock
 * a été envoyée dans les dernières 24h pour ce produit.
 */
export const checkLowStock = internalMutation({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Tous les produits actifs qui track l'inventaire
    const products = await ctx.db
      .query("products")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("track_inventory"), true),
        ),
      )
      .collect();

    let alertCount = 0;

    for (const product of products) {
      const threshold = product.low_stock_threshold ?? 5;

      if (product.quantity > threshold) continue;

      // Éviter les doublons : vérifier les notifs récentes
      const store = await ctx.db.get(product.store_id);
      if (!store) continue;

      const vendor = await ctx.db.get(store.owner_id);
      if (!vendor) continue;

      // Chercher si une notif low_stock a été envoyée récemment pour ce produit
      const recentNotif = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("user_id", vendor._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "low_stock"),
            q.gte(q.field("_creationTime"), twentyFourHoursAgo),
          ),
        )
        .collect();

      // Vérifier que la notif concerne bien CE produit (via le body)
      const alreadyNotified = recentNotif.some((n) =>
        n.body.includes(product.title),
      );

      if (alreadyNotified) continue;

      // Notifier
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.notifyLowStock,
        {
          vendorUserId: vendor._id,
          vendorEmail: vendor.email,
          productTitle: product.title,
          currentQuantity: product.quantity,
          threshold,
          storeName: store.name,
        },
      );

      alertCount++;
    }

    return { alertCount };
  },
});

// ─── Stale Payout Check ──────────────────────────────────────

/**
 * Vérifie les payouts "processing" depuis > 72h.
 * Appelle Moneroo verify pour obtenir le statut réel.
 */
export const checkStalePayouts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - SEVENTY_TWO_HOURS_MS;

    const stalePayouts = await ctx.db
      .query("payouts")
      .withIndex("by_status_only", (q) => q.eq("status", "processing"))
      .collect();

    const overdue = stalePayouts.filter((p) => p.requested_at <= cutoff);

    let checkedCount = 0;

    for (const payout of overdue) {
      if (!payout.reference) {
        // Pas de référence Moneroo → fail directement
        await ctx.scheduler.runAfter(0, internal.payouts.mutations.failPayout, {
          payoutId: payout._id,
          reason: "Timeout: pas de référence Moneroo après 72h",
        });
      } else {
        // Vérifier via Moneroo API
        await ctx.scheduler.runAfter(0, internal.payouts.actions.verifyPayout, {
          payoutId: payout._id,
          monerooPayoutId: payout.reference,
        });
      }

      checkedCount++;
    }

    return { checkedCount };
  },
});

/**
 * Auto-publier les avis non-flagged après 24h
 */
export const autoPublishReviews = internalMutation({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Récupérer les avis non publiés, non flagged, créés il y a > 24h
    const pendingReviews = await ctx.db
      .query("reviews")
      .filter((q) =>
        q.and(
          q.eq(q.field("is_published"), false),
          q.eq(q.field("flagged"), false),
          q.lt(q.field("_creationTime"), twentyFourHoursAgo),
        ),
      )
      .collect();

    for (const review of pendingReviews) {
      await ctx.db.patch(review._id, { is_published: true });
      await recalculateRatings(ctx, review.product_id, review.store_id);

      // Notifier le vendor que l'avis est maintenant publié
      const store = await ctx.db.get(review.store_id);
      const product = await ctx.db.get(review.product_id);
      if (store && product) {
        const vendor = await ctx.db.get(store.owner_id);
        if (vendor) {
          await ctx.scheduler.runAfter(
            0,
            internal.notifications.send.notifyNewReview,
            {
              vendorUserId: vendor._id,
              vendorEmail: vendor.email,
              vendorName: store.name,
              customerName: "Un client",
              productTitle: product.title,
              rating: review.rating,
              reviewTitle: review.title ?? "",
            },
          );
        }
      }
    }
  },
});

// ─── Expire Pending Orders (toutes les 30min) ────────────────

/**
 * Annule les commandes en statut "pending" avec payment_mode "online"
 * créées il y a plus de 2 heures. Restaure le stock pour chaque article.
 */
export const expirePendingOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Seuil bas : détecte les paiements échoués dès 15 min (webhook Moneroo perdu)
    const fifteenMinCutoff = now - FIFTEEN_MIN_MS;
    // Seuil haut : annulation définitive si aucun paiement initié après 2h
    const twoHourCutoff = now - TWO_HOURS_MS;

    // Récupère toutes les commandes pending online de plus de 15 min
    const pendingOrders = await ctx.db
      .query("orders")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("payment_mode"), "online"),
          q.lte(q.field("_creationTime"), fifteenMinCutoff),
        ),
      )
      .collect();

    let cancelledCount = 0;
    let verifyingCount = 0;

    for (const order of pendingOrders) {
      // Si la commande a une référence Moneroo : vérifier le statut réel
      // quelle que soit l'ancienneté (détection rapide des échecs dès 15 min).
      if (order.payment_reference) {
        await ctx.scheduler.runAfter(0, api.payments.moneroo.verifyPayment, {
          orderId: order._id,
        });
        verifyingCount++;
        continue;
      }

      // Sans référence : l'utilisateur n'a pas initié le paiement.
      // On attend 2h avant d'annuler (laisser le temps de revenir finaliser).
      if (order._creationTime > twoHourCutoff) continue;

      // Pas de référence → annuler directement (l'utilisateur n'a jamais initié le paiement)
      const now = Date.now();

      await ctx.db.patch(order._id, {
        status: "cancelled",
        updated_at: now,
      });

      await restoreInventory(ctx, order.items);

      // Notifier le client (email + in-app + push)
      const customer = await ctx.db.get(order.customer_id);
      const storeForExpiry = await ctx.db.get(order.store_id);
      if (customer) {
        // In-app + push
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.createInAppNotification,
          {
            userId: customer._id,
            type: "order_status",
            title: `Commande ${order.order_number} expirée`,
            body: `Votre commande a expiré car le paiement n'a pas été finalisé dans les délais impartis.`,
            link: `/orders`,
            channels: ["in_app", "push"],
            sentVia: ["in_app"],
            metadata: undefined,
          },
        );
        await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
          userId: customer._id,
          title: `Commande ${order.order_number} expirée`,
          body: "Votre commande a expiré — le paiement n'a pas été finalisé.",
          url: "/orders",
        });
        // Email (réutilise le template OrderCancelled)
        if (customer.email && storeForExpiry) {
          await ctx.scheduler.runAfter(
            0,
            internal.emails.send.sendOrderCancelled,
            {
              customerEmail: customer.email,
              customerName: customer.name ?? "Client",
              orderNumber: order.order_number,
              storeName: storeForExpiry.name,
              totalAmount: order.total_amount,
              currency: order.currency,
              reason:
                "Commande expirée — paiement non finalisé dans les délais",
              wasRefunded: false,
            },
          );
        }
      }

      // Notifier le vendeur (in-app + push — pas d'email pour les expirations auto)
      if (storeForExpiry) {
        const vendorExpiry = await ctx.db.get(storeForExpiry.owner_id);
        if (vendorExpiry) {
          await ctx.scheduler.runAfter(
            0,
            internal.notifications.send.createInAppNotification,
            {
              userId: vendorExpiry._id,
              type: "order_status",
              title: `Commande ${order.order_number} expirée`,
              body: `La commande ${order.order_number} a expiré — paiement non finalisé.`,
              link: "/vendor/orders",
              channels: ["in_app", "push"],
              sentVia: ["in_app"],
              metadata: undefined,
            },
          );
          await ctx.scheduler.runAfter(0, internal.push.actions.sendToUser, {
            userId: vendorExpiry._id,
            title: `Commande ${order.order_number} expirée`,
            body: "Paiement non finalisé — stock restauré.",
            url: "/vendor/orders",
          });
        }
      }

      cancelledCount++;
    }

    return { cancelledCount, verifyingCount };
  },
});

// ─── Expire Stale Storage Requests (toutes les 6h) ───────────

/**
 * Auto-rejette les demandes de stockage en statut "pending_drop_off"
 * créées il y a plus de 30 jours.
 */
export const expireStaleStorageRequests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - THIRTY_DAYS_MS;

    const staleRequests = await ctx.db
      .query("storage_requests")
      .withIndex("by_status", (q) => q.eq("status", "pending_drop_off"))
      .filter((q) => q.lte(q.field("created_at"), cutoff))
      .collect();

    let rejectedCount = 0;

    for (const request of staleRequests) {
      const now = Date.now();

      await ctx.db.patch(request._id, {
        status: "rejected",
        rejection_reason:
          "Délai de dépôt dépassé (30 jours). Demande automatiquement annulée.",
        validated_at: now,
        updated_at: now,
      });

      // Notifier le vendeur (in-app uniquement)
      const store = await ctx.db.get(request.store_id);
      if (store) {
        const vendor = await ctx.db.get(store.owner_id);
        if (vendor) {
          await ctx.db.insert("notifications", {
            user_id: vendor._id,
            type: "storage_rejected",
            title: "Demande de stockage annulée",
            body: `Votre demande ${request.storage_code} — "${request.product_name}" a été automatiquement annulée (délai de dépôt de 30 jours dépassé).`,
            link: "/vendor/storage",
            is_read: false,
            channels: ["in_app"],
            sent_via: ["in_app"],
            metadata: {
              request_id: request._id,
              storage_code: request.storage_code,
            },
          });
        }
      }

      rejectedCount++;
    }

    return { rejectedCount };
  },
});

// ─── Notify Overdue Storage Debts (toutes les 24h) ───────────

/**
 * Notifie les vendeurs dont la facture de stockage est impayée
 * depuis plus de 30 jours. Évite les doublons si une notification
 * a déjà été envoyée dans les dernières 48h pour cette facture.
 */
export const notifyOverdueStorageDebts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - THIRTY_DAYS_MS;
    const recentNotifCutoff = Date.now() - FORTY_EIGHT_HOURS_NOTIF_MS;

    // Chercher toutes les factures impayées créées il y a > 30 jours
    const overdueInvoices = await ctx.db
      .query("storage_invoices")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "unpaid"),
          q.lte(q.field("created_at"), cutoff),
        ),
      )
      .collect();

    let notifiedCount = 0;

    for (const invoice of overdueInvoices) {
      const store = await ctx.db.get(invoice.store_id);
      if (!store) continue;

      const vendor = await ctx.db.get(store.owner_id);
      if (!vendor) continue;

      // Vérifier si une notification a déjà été envoyée dans les 48h pour cette facture
      const recentNotifs = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("user_id", vendor._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "storage_invoice"),
            q.gte(q.field("_creationTime"), recentNotifCutoff),
          ),
        )
        .collect();

      const alreadyNotified = recentNotifs.some(
        (n) =>
          n.metadata !== undefined &&
          typeof n.metadata === "object" &&
          n.metadata !== null &&
          "invoice_id" in n.metadata &&
          n.metadata.invoice_id === invoice._id,
      );

      if (alreadyNotified) continue;

      await ctx.db.insert("notifications", {
        user_id: vendor._id,
        type: "storage_invoice",
        title: "Facture de stockage en retard",
        body: `Votre facture de stockage de ${formatAmountText(invoice.amount, invoice.currency)} est impayée depuis plus de 30 jours. Réglez-la depuis votre espace facturation.`,
        link: "/vendor/billing",
        is_read: false,
        channels: ["in_app"],
        sent_via: ["in_app"],
        metadata: {
          invoice_id: invoice._id,
        },
      });

      notifiedCount++;
    }

    return { notifiedCount };
  },
});

/**
 * Activer les bookings confirmés dont starts_at est passé.
 * Compléter les bookings actifs dont ends_at est passé.
 * Promouvoir les bookings en queue quand des slots se libèrent.
 */
export const processAdBookings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. Activer les bookings confirmés dont la période a commencé
    const toActivate = await ctx.db
      .query("ad_bookings")
      .withIndex("by_status", (q) => q.eq("status", "confirmed"))
      .filter((q) => q.lte(q.field("starts_at"), now))
      .collect();

    for (const booking of toActivate) {
      await ctx.db.patch(booking._id, {
        status: "active",
        updated_at: now,
      });
    }

    // 2. Compléter les bookings actifs dont la période est terminée
    const toComplete = await ctx.db
      .query("ad_bookings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("ends_at"), now))
      .collect();

    const slotsFreed = new Set<string>();
    for (const booking of toComplete) {
      await ctx.db.patch(booking._id, {
        status: "completed",
        updated_at: now,
      });
      slotsFreed.add(booking.slot_id);
    }

    // 3. Promouvoir les bookings en queue pour les slots libérés
    for (const slotId of slotsFreed) {
      await promoteQueuedBookings(ctx, slotId);
    }
  },
});

// ─── Wishlist Reminders (toutes les 24h) ─────────────────────

/**
 * Envoie un email de relance aux utilisateurs dont des articles en wishlist
 * ont été ajoutés il y a 7-8 jours. La fenêtre glissante de 24h garantit
 * qu'un même article ne déclenche qu'un seul email de relance.
 */
export const sendWishlistReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysCutoff = now - SEVEN_DAYS_MS;
    const eightDaysCutoff = now - EIGHT_DAYS_MS;

    // Articles ajoutés entre il y a 7 et 8 jours (fenêtre 24h)
    const staleItems = await ctx.db
      .query("wishlists")
      .withIndex("by_added_at", (q) =>
        q.gte("added_at", eightDaysCutoff).lte("added_at", sevenDaysCutoff),
      )
      .collect();

    if (staleItems.length === 0) return { sent: 0 };

    // Regrouper par utilisateur
    const byUser = new Map<string, typeof staleItems>();
    for (const item of staleItems) {
      const key = item.user_id;
      const existing = byUser.get(key) ?? [];
      existing.push(item);
      byUser.set(key, existing);
    }

    const siteUrl = process.env.SITE_URL ?? "https://www.pixel-mart-bj.com";
    let sent = 0;

    for (const [userId, wishlistItems] of byUser) {
      const user = await ctx.db.get(
        userId as (typeof wishlistItems)[0]["user_id"],
      );
      if (!user?.email) continue;

      // Hydrater les produits + leur store pour générer le bon lien
      // (shop vendeur si vendor_shop_enabled, marketplace sinon)
      const hydratedItems = (
        await Promise.all(
          wishlistItems.map(async (wi) => {
            const product = await ctx.db.get(wi.product_id);
            if (!product || product.status !== "active") return null;

            const store = await ctx.db.get(product.store_id);
            const productUrl =
              store?.vendor_shop_enabled && store.slug
                ? `${siteUrl}/shop/${store.slug}/products/${product.slug}`
                : `${siteUrl}/products/${product.slug}`;

            return {
              title: product.title,
              price: product.price,
              currency: store?.currency ?? "XOF",
              productUrl,
              shopUrl:
                store?.vendor_shop_enabled && store.slug
                  ? `${siteUrl}/shop/${store.slug}`
                  : siteUrl,
            };
          }),
        )
      ).filter((item): item is NonNullable<typeof item> => item !== null);

      if (hydratedItems.length === 0) continue;

      // Formatter les prix côté serveur (XOF : pas de ÷100)
      const NO_SUBUNIT = ["XOF", "XAF", "GNF", "CDF"];
      const itemsForEmail = hydratedItems.map((item) => ({
        title: item.title,
        price: new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: item.currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(
          NO_SUBUNIT.includes(item.currency) ? item.price : item.price / 100,
        ),
        productUrl: item.productUrl,
      }));

      // CTA principal : boutique du premier article, ou marketplace par défaut
      const ctaUrl = hydratedItems[0].shopUrl;

      await ctx.scheduler.runAfter(
        sent * 200, // étaler les envois (200ms entre chaque) pour ne pas dépasser les limites Resend
        internal.emails.send.sendWishlistReminder,
        {
          customerEmail: user.email,
          customerName: user.name ?? "Client",
          items: itemsForEmail,
          shopUrl: ctaUrl,
        },
      );

      sent++;
    }

    return { sent };
  },
});

// ─── Expire Affiliate Links ───────────────────────────────────
// Désactive les liens affiliés dont expires_at est dans le passé

export const expireAffiliateLinks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const activeLinks = await ctx.db
      .query("affiliate_links")
      .withIndex("by_active", (q) => q.eq("is_active", true))
      .collect();

    let expired = 0;
    for (const link of activeLinks) {
      if (link.expires_at !== undefined && link.expires_at < now) {
        await ctx.db.patch(link._id, { is_active: false, updated_at: now });
        expired++;
      }
    }
    return { expired };
  },
});
