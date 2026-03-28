// filepath: convex/storage/mutations.ts

import { mutation, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import { getVendorStore, requireAgent, requireAdmin } from "../users/helpers";
import { DEFAULT_CURRENCY } from "../lib/constants";
import { computeStorageFee, generateStorageCode } from "./helpers";
import { getEffectiveStorageFees } from "../lib/getConfig";

// ─── Create Request (Vendor) ─────────────────────────────────

export const createRequest = mutation({
  args: {
    product_name: v.string(),
    estimated_qty: v.optional(v.number()),
    product_id: v.optional(v.id("products")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, store } = await getVendorStore(ctx);

    if (args.product_name.trim().length < 2) {
      throw new ConvexError("Le nom du produit est trop court");
    }
    if (args.product_name.length > 200) {
      throw new ConvexError(
        "Le nom du produit est trop long (200 caractères max)",
      );
    }
    if (args.estimated_qty !== undefined && args.estimated_qty < 1) {
      throw new ConvexError("La quantité estimée doit être positive");
    }

    // Vérifier que le product_id appartient bien au store si fourni
    if (args.product_id) {
      const product = await ctx.db.get(args.product_id);
      if (!product || product.store_id !== store._id) {
        throw new ConvexError("Produit introuvable dans votre boutique");
      }
    }

    const storageCode = await generateStorageCode(ctx);
    const now = Date.now();

    const requestId = await ctx.db.insert("storage_requests", {
      store_id: store._id,
      product_id: args.product_id,
      storage_code: storageCode,
      product_name: args.product_name.trim(),
      estimated_qty: args.estimated_qty,
      status: "pending_drop_off",
      notes: args.notes,
      created_at: now,
      updated_at: now,
    });

    // Notifier le vendeur (email + in-app)
    await ctx.scheduler.runAfter(
      0,
      internal.notifications.send.notifyStorageRequestReceived,
      {
        vendorUserId: user._id,
        vendorEmail: user.email,
        vendorName: user.name ?? user.email,
        storageCode,
        productName: args.product_name.trim(),
        estimatedQty: args.estimated_qty,
        storeName: store.name,
      },
    );

    // Notifier les admins — nouvelle demande de dépôt
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.createInAppNotification,
        {
          userId: admin._id,
          type: "storage_received",
          title: "Nouvelle demande de stockage",
          body: `${store.name} a soumis une demande pour "${args.product_name.trim()}" (${storageCode}).`,
          link: "/admin/storage",
          channels: ["in_app"],
          sentVia: ["in_app"],
          metadata: { request_id: requestId, storage_code: storageCode },
        },
      );
    }

    return { requestId, storageCode };
  },
});

// ─── Receive Request (Agent) ──────────────────────────────────

export const receiveRequest = mutation({
  args: {
    storage_code: v.string(),
    measurement_type: v.union(v.literal("units"), v.literal("weight")),
    actual_qty: v.optional(v.number()),
    actual_weight_kg: v.optional(v.number()),
    agent_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await requireAgent(ctx);

    // Valider les mesures
    if (args.measurement_type === "units") {
      if (args.actual_qty === undefined || args.actual_qty < 1) {
        throw new ConvexError("La quantité doit être un entier positif");
      }
    } else {
      if (args.actual_weight_kg === undefined || args.actual_weight_kg <= 0) {
        throw new ConvexError("Le poids doit être positif");
      }
    }

    const request = await ctx.db
      .query("storage_requests")
      .withIndex("by_code", (q) =>
        q.eq("storage_code", args.storage_code.toUpperCase()),
      )
      .unique();

    if (!request) {
      throw new ConvexError(`Code introuvable : ${args.storage_code}`);
    }
    if (request.status !== "pending_drop_off") {
      throw new ConvexError(
        `Ce colis est déjà en statut "${request.status}" — impossible de le réceptionner à nouveau`,
      );
    }

    const now = Date.now();

    await ctx.db.patch(request._id, {
      status: "received",
      measurement_type: args.measurement_type,
      actual_qty: args.actual_qty,
      actual_weight_kg: args.actual_weight_kg,
      agent_id: agent._id,
      agent_notes: args.agent_notes,
      received_at: now,
      updated_at: now,
    });

    // Notifier l'admin (in-app seulement)
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    for (const admin of admins) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.send.createInAppNotification,
        {
          userId: admin._id,
          type: "storage_received",
          title: "Colis réceptionné",
          body: `${request.storage_code} — "${request.product_name}" réceptionné par ${agent.name}`,
          link: "/admin/storage",
          channels: ["in_app"],
          sentVia: ["in_app"],
          metadata: {
            request_id: request._id,
            storage_code: request.storage_code,
          },
        },
      );
    }

    // Notifier le vendeur (in-app) que son colis a été réceptionné
    const storeForVendor = await ctx.db.get(request.store_id);
    if (storeForVendor) {
      const vendorUser = await ctx.db.get(storeForVendor.owner_id);
      if (vendorUser) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.createInAppNotification,
          {
            userId: vendorUser._id,
            type: "storage_received",
            title: "Colis réceptionné en entrepôt",
            body: `Votre colis ${request.storage_code} — "${request.product_name}" a bien été réceptionné. Une validation suivra sous peu.`,
            link: "/vendor/storage",
            channels: ["in_app"],
            sentVia: ["in_app"],
            metadata: {
              request_id: request._id,
              storage_code: request.storage_code,
            },
          },
        );
      }
    }

    return { success: true };
  },
});

// ─── Validate Request (Admin or Agent) ──────────────────────

export const validateRequest = mutation({
  args: {
    request_id: v.id("storage_requests"),
    payment_method: v.optional(
      v.union(
        v.literal("immediate"),
        v.literal("auto_debit"),
        v.literal("deferred"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Allow both admins and agents to validate storage requests
    const validator = await requireAgent(ctx);

    const request = await ctx.db.get(args.request_id);
    if (!request) throw new ConvexError("Demande introuvable");
    if (request.status !== "received") {
      throw new ConvexError(
        "Seules les demandes réceptionnées peuvent être validées",
      );
    }

    if (!request.measurement_type) {
      throw new ConvexError("Aucune mesure enregistrée pour cette demande");
    }

    const measureValue =
      request.measurement_type === "units"
        ? (request.actual_qty ?? 0)
        : (request.actual_weight_kg ?? 0);

    const storageFees = await getEffectiveStorageFees(ctx);
    const storageFee = computeStorageFee(
      request.measurement_type,
      measureValue,
      storageFees,
    );
    const now = Date.now();
    const paymentMethod = args.payment_method ?? "deferred";

    // Créer la facture
    const invoiceId = await ctx.db.insert("storage_invoices", {
      store_id: request.store_id,
      request_id: request._id,
      amount: storageFee,
      currency: DEFAULT_CURRENCY,
      status: "unpaid",
      payment_method: paymentMethod,
      created_at: now,
      updated_at: now,
    });

    // Si paiement différé → ajouter à la dette mensuelle
    if (paymentMethod === "deferred" && storageFee > 0) {
      const period = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const existingDebt = await ctx.db
        .query("storage_debt")
        .withIndex("by_store_period", (q) =>
          q.eq("store_id", request.store_id).eq("period", period),
        )
        .unique();

      if (existingDebt) {
        await ctx.db.patch(existingDebt._id, {
          amount: existingDebt.amount + storageFee,
          invoice_ids: [...existingDebt.invoice_ids, invoiceId],
          updated_at: now,
        });
      } else {
        await ctx.db.insert("storage_debt", {
          store_id: request.store_id,
          amount: storageFee,
          currency: DEFAULT_CURRENCY,
          period,
          invoice_ids: [invoiceId],
          created_at: now,
          updated_at: now,
        });
      }
    }

    // Activer le stock : mettre à jour la demande
    await ctx.db.patch(request._id, {
      status: "in_stock",
      storage_fee: storageFee,
      invoice_id: invoiceId,
      admin_id: validator._id,
      validated_at: now,
      updated_at: now,
    });

    // Si le produit est lié → incrémenter le stock total et le stock entrepôt
    if (request.product_id && request.actual_qty) {
      const product = await ctx.db.get(request.product_id);
      if (product) {
        await ctx.db.patch(request.product_id, {
          quantity: product.quantity + request.actual_qty,
          warehouse_qty: (product.warehouse_qty ?? 0) + request.actual_qty,
          status: "active",
          updated_at: now,
        });
      }
    }

    // Notifier le vendeur (email + in-app)
    const storeForNotif = await ctx.db.get(request.store_id);
    if (storeForNotif) {
      const vendorForNotif = await ctx.db.get(storeForNotif.owner_id);
      if (vendorForNotif) {
        // Notification: stockage validé
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyStorageValidated,
          {
            vendorUserId: vendorForNotif._id,
            vendorEmail: vendorForNotif.email,
            vendorName: vendorForNotif.name ?? vendorForNotif.email,
            storageCode: request.storage_code,
            productName: request.product_name,
            storageFee,
            currency: DEFAULT_CURRENCY,
            paymentMethod,
            actualQty: request.actual_qty,
            actualWeightKg: request.actual_weight_kg,
            measurementType: request.measurement_type,
          },
        );

        // Notification: facture créée
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyStorageInvoiceCreated,
          {
            vendorUserId: vendorForNotif._id,
            vendorEmail: vendorForNotif.email,
            vendorName: vendorForNotif.name ?? vendorForNotif.email,
            storageCode: request.storage_code,
            productName: request.product_name,
            amount: storageFee,
            currency: DEFAULT_CURRENCY,
            paymentMethod,
          },
        );
      }
    }

    return { invoiceId, storageFee };
  },
});

// ─── Reject Request (Admin) ──────────────────────────────────

export const rejectRequest = mutation({
  args: {
    request_id: v.id("storage_requests"),
    rejection_reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);

    if (args.rejection_reason.trim().length < 5) {
      throw new ConvexError("La raison du rejet est trop courte");
    }

    const request = await ctx.db.get(args.request_id);
    if (!request) throw new ConvexError("Demande introuvable");
    if (request.status !== "received") {
      throw new ConvexError(
        "Seules les demandes réceptionnées peuvent être rejetées",
      );
    }

    const now = Date.now();

    await ctx.db.patch(request._id, {
      status: "rejected",
      rejection_reason: args.rejection_reason.trim(),
      admin_id: admin._id,
      validated_at: now,
      updated_at: now,
    });

    // Notifier le vendeur (email + in-app)
    const storeForReject = await ctx.db.get(request.store_id);
    if (storeForReject) {
      const vendorForReject = await ctx.db.get(storeForReject.owner_id);
      if (vendorForReject) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyStorageRejected,
          {
            vendorUserId: vendorForReject._id,
            vendorEmail: vendorForReject.email,
            vendorName: vendorForReject.name ?? vendorForReject.email,
            storageCode: request.storage_code,
            productName: request.product_name,
            reason: args.rejection_reason.trim(),
          },
        );
      }
    }

    return { success: true };
  },
});

// ─── Pay Invoice Immediately (Vendor) ────────────────────────

export const payInvoice = mutation({
  args: {
    invoice_id: v.id("storage_invoices"),
  },
  handler: async (ctx, args) => {
    const { store } = await getVendorStore(ctx);

    const invoice = await ctx.db.get(args.invoice_id);
    if (!invoice) throw new ConvexError("Facture introuvable");
    if (invoice.store_id !== store._id) {
      throw new ConvexError("Cette facture ne vous appartient pas");
    }
    if (invoice.status !== "unpaid") {
      throw new ConvexError("Cette facture a déjà été réglée");
    }

    // Marquer comme en attente de paiement Moneroo
    await ctx.db.patch(invoice._id, {
      payment_method: "immediate",
      updated_at: Date.now(),
    });

    // Lancer le paiement Moneroo en arrière-plan
    await ctx.scheduler.runAfter(
      0,
      internal.storage.actions.initializeStoragePayment,
      {
        invoiceId: invoice._id,
        storeId: store._id,
        amount: invoice.amount,
        currency: invoice.currency,
      },
    );

    return { invoiceId: invoice._id, amount: invoice.amount };
  },
});

// ─── Confirm Storage Payment (Internal — webhook) ────────────

export const confirmStoragePayment = internalMutation({
  args: {
    invoiceId: v.id("storage_invoices"),
    externalRef: v.string(),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Facture introuvable");

    // Idempotence
    if (invoice.status === "paid") return { alreadyProcessed: true };

    const now = Date.now();

    await ctx.db.patch(args.invoiceId, {
      status: "paid",
      payment_reference: args.externalRef,
      paid_at: now,
      updated_at: now,
    });

    // Notifier le vendeur (in-app)
    const storeForPay = await ctx.db.get(invoice.store_id);
    if (storeForPay) {
      const vendorForPay = await ctx.db.get(storeForPay.owner_id);
      if (vendorForPay) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.notifyStorageInvoicePaid,
          {
            vendorUserId: vendorForPay._id,
            amount: invoice.amount,
            currency: invoice.currency,
          },
        );
      }
    }

    return { success: true };
  },
});

// ─── Fail Storage Payment (Internal — webhook) ───────────────

export const failStoragePayment = internalMutation({
  args: {
    invoiceId: v.id("storage_invoices"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Facture introuvable");

    if (invoice.status === "paid") return { alreadyProcessed: true };

    // Remettre en "unpaid" — le vendeur pourra réessayer
    await ctx.db.patch(args.invoiceId, {
      status: "unpaid",
      payment_method: undefined,
      updated_at: Date.now(),
    });

    const store = await ctx.db.get(invoice.store_id);
    if (store) {
      const vendor = await ctx.db.get(store.owner_id);
      if (vendor) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.send.createInAppNotification,
          {
            userId: vendor._id,
            type: "storage_invoice",
            title: "Paiement de facture échoué",
            body: `Le paiement de votre facture de stockage a échoué. Réessayez depuis /vendor/billing.`,
            link: "/vendor/billing",
            channels: ["in_app"],
            sentVia: ["in_app"],
            metadata: { invoice_id: args.invoiceId },
          },
        );
      }
    }

    return { success: true };
  },
});

// ─── Update Invoice Payment Reference (Internal — from action) ──

export const updateInvoicePaymentRef = internalMutation({
  args: {
    invoiceId: v.id("storage_invoices"),
    paymentReference: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.invoiceId, {
      payment_reference: args.paymentReference,
      updated_at: Date.now(),
    });
  },
});

// ─── Settle Debt from Payout (Internal) ──────────────────────

/**
 * Déduit la dette de stockage d'un retrait (règle F-05).
 * Appelé par payouts/mutations.ts avant de débiter le solde.
 * Retourne le montant déduit.
 */
export const settleDebtFromPayout = internalMutation({
  args: {
    storeId: v.id("stores"),
    payoutId: v.id("payouts"),
  },
  handler: async (ctx, args) => {
    const unsettledDebts = await ctx.db
      .query("storage_debt")
      .withIndex("by_unsettled", (q) =>
        q.eq("store_id", args.storeId).eq("settled_at", undefined),
      )
      .collect();

    if (unsettledDebts.length === 0) return { deductedAmount: 0 };

    const now = Date.now();
    let totalDeducted = 0;

    for (const debt of unsettledDebts) {
      // Marquer la dette comme réglée
      await ctx.db.patch(debt._id, {
        settled_at: now,
        payout_id: args.payoutId,
        updated_at: now,
      });

      // Marquer chaque facture liée comme déduite
      for (const invoiceId of debt.invoice_ids) {
        const invoice = await ctx.db.get(invoiceId);
        if (invoice && invoice.status === "unpaid") {
          await ctx.db.patch(invoiceId, {
            status: "deducted_from_payout",
            paid_at: now,
            updated_at: now,
          });
        }
      }

      totalDeducted += debt.amount;
    }

    return { deductedAmount: totalDeducted };
  },
});
