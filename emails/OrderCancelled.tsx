// filepath: emails/OrderCancelled.tsx

import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface OrderCancelledProps {
  customerName: string;
  orderNumber: string;
  storeName: string;
  reason?: string;
  wasRefunded: boolean;
  total: string;
  ordersUrl: string;
}

export default function OrderCancelled({
  customerName = "Client",
  orderNumber = "PM-000001",
  storeName = "Ma Boutique",
  reason,
  wasRefunded = false,
  total = "5 000 XOF",
  ordersUrl = "https://pixelmart.com/orders",
}: OrderCancelledProps) {
  return (
    <Layout preview={`Commande ${orderNumber} annulée — Pixel-Mart`}>
      <Text style={styles.heading}>Commande annulée</Text>

      <Text style={styles.paragraph}>Bonjour {customerName},</Text>

      <Text style={styles.paragraph}>
        Votre commande <strong>{orderNumber}</strong> de{" "}
        <strong>{storeName}</strong> d&apos;un montant de{" "}
        <strong>{total}</strong> a été annulée.
      </Text>

      {reason && (
        <Section style={styles.infoBox}>
          <Text style={styles.detailLabel}>Raison</Text>
          <Text style={styles.detailValue}>{reason}</Text>
        </Section>
      )}

      {wasRefunded && (
        <Section style={styles.refundBox}>
          <Text style={styles.refundText}>
            💰 Un remboursement de <strong>{total}</strong> a été initié. Il
            sera crédité sur votre moyen de paiement d&apos;origine sous 3 à 7
            jours ouvrables.
          </Text>
        </Section>
      )}

      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={ordersUrl}>Voir mes commandes</CTAButton>
      </Section>
    </Layout>
  );
}

const styles = {
  heading: {
    fontFamily: emailTheme.fonts.heading,
    fontSize: "24px",
    fontWeight: "700" as const,
    color: emailTheme.colors.foreground,
    textAlign: "center" as const,
    margin: "0 0 24px 0",
  },
  paragraph: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "15px",
    color: emailTheme.colors.foreground,
    lineHeight: "1.6",
    margin: "0 0 12px 0",
  },
  infoBox: {
    backgroundColor: emailTheme.colors.background,
    borderRadius: emailTheme.borderRadius,
    padding: "16px",
    marginTop: "16px",
  },
  detailLabel: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "11px",
    color: emailTheme.colors.muted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 2px 0",
  },
  detailValue: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "14px",
    color: emailTheme.colors.foreground,
    margin: "0",
  },
  refundBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: emailTheme.borderRadius,
    padding: "16px",
    marginTop: "16px",
    border: "1px solid #bbf7d0",
  },
  refundText: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "14px",
    color: "#15803d",
    margin: "0",
    lineHeight: "1.6",
  },
};
