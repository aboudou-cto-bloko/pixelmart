// filepath: convex/ads/actions.ts

import { action } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { api } from "../_generated/api";
import { centimesToMonerooAmount } from "../payments/helpers";

const MONEROO_API_URL = "https://api.moneroo.io/v1";

async function initializeMonerooPayment({
  booking,
  user,
  appUrl,
}: {
  booking: {
    _id: string;
    total_price: number;
    currency?: string;
    slot_id: string;
    store_id?: string;
  };
  user: { email: string; name: string };
  appUrl: string;
}) {
  const [firstName, ...lastNameParts] = user.name.split(" ");
  const lastName = lastNameParts.join(" ") || ".";

  const response = await fetch(`${MONEROO_API_URL}/payments/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MONEROO_SECRET_KEY}`,
      Accept: "application/json",
    },
    body: JSON.stringify({
      amount: centimesToMonerooAmount(
        booking.total_price,
        booking.currency ?? "XOF",
      ),
      currency: booking.currency ?? "XOF",
      description: `Publicité Pixel-Mart: ${booking.slot_id}`,
      customer: {
        email: user.email,
        first_name: firstName,
        last_name: lastName,
      },
      return_url: `${appUrl}/vendor/ads/payment-callback?bookingId=${booking._id}&paymentStatus=success`,
      metadata: {
        type: "ad_payment",
        booking_id: booking._id,
        store_id: booking.store_id ?? "",
        slot_id: booking.slot_id,
      },
    }),
  });

  if (!response.ok) {
    throw new ConvexError("Erreur lors de l'initialisation du paiement");
  }

  const data = await response.json();
  return data.data as { id: string; checkout_url: string };
}

export const initiateAdPayment = action({
  args: { booking_id: v.id("ad_bookings") },
  handler: async (
    ctx,
    { booking_id },
  ): Promise<{ checkout_url: string; payment_id: string }> => {
    // ✅ Les actions n'ont PAS ctx.db — on passe par runQuery
    const booking = await ctx.runQuery(api.ads.queries.getBookingById, {
      booking_id,
    });

    if (!booking) throw new ConvexError("Réservation introuvable");
    if (booking.status !== "pending") {
      throw new ConvexError(
        "Cette réservation n'est pas en attente de paiement",
      );
    }
    if (booking.total_price <= 0) throw new ConvexError("Montant invalide");

    const user = await ctx.runQuery(api.users.queries.getMe, {});
    if (!user) throw new ConvexError("Utilisateur introuvable");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.pixel-mart-bj.com";

    const paymentData = await initializeMonerooPayment({
      booking: {
        _id: booking._id,
        total_price: booking.total_price,
        currency: booking.currency,
        slot_id: booking.slot_id,
        store_id: booking.store_id,
      },
      user,
      appUrl,
    });

    await ctx.runMutation(api.ads.mutations.setPaymentReference, {
      booking_id,
      reference: paymentData.id,
    });

    return {
      checkout_url: paymentData.checkout_url,
      payment_id: paymentData.id,
    };
  },
});
