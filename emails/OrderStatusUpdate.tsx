// filepath: emails/OrderStatusUpdate.tsx

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente de paiement",
  paid: "Payée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

interface OrderStatusUpdateProps {
  orderNumber: string;
  storeName: string;
  previousStatus: string;
  newStatus: string;
}

export function OrderStatusUpdate({
  orderNumber,
  storeName,
  previousStatus,
  newStatus,
}: OrderStatusUpdateProps) {
  const label = STATUS_LABELS[newStatus] ?? newStatus;

  return (
    <Layout preview={`Commande ${orderNumber} — ${label}`}>
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Commande mise à jour
      </Text>

      <Text
        style={{
          fontFamily: emailTheme.fonts.body,
          fontSize: "15px",
          color: emailTheme.colors.foreground,
          lineHeight: "1.6",
          margin: "0 0 16px 0",
        }}
      >
        Votre commande <strong>{orderNumber}</strong> chez{" "}
        <strong>{storeName}</strong> est passée au statut :
      </Text>

      <Section
        style={{
          textAlign: "center" as const,
          backgroundColor: emailTheme.colors.background,
          borderRadius: "8px",
          padding: "16px",
          margin: "0 0 24px 0",
        }}
      >
        <Text
          style={{
            fontFamily: emailTheme.fonts.heading,
            fontSize: "18px",
            fontWeight: "700",
            color: emailTheme.colors.primary,
            margin: "0",
          }}
        >
          {label}
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href="https://pixelmart.io/orders">
          Voir ma commande
        </CTAButton>
      </Section>
    </Layout>
  );
}

OrderStatusUpdate.PreviewProps = {
  orderNumber: "PM-2026-0042",
  storeName: "Mode Dakar",
  previousStatus: "paid",
  newStatus: "processing",
} satisfies OrderStatusUpdateProps;

export default OrderStatusUpdate;
