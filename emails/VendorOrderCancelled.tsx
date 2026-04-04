// filepath: emails/VendorOrderCancelled.tsx

import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface VendorOrderCancelledProps {
  vendorName: string;
  orderNumber: string;
  customerName: string;
  total: string;
  reason?: string;
  orderUrl: string;
}

export default function VendorOrderCancelled({
  vendorName = "Vendeur",
  orderNumber = "PM-000001",
  customerName = "Client",
  total = "5 000 XOF",
  reason,
  orderUrl = "https://pixelmart.com/vendor/orders/123",
}: VendorOrderCancelledProps) {
  return (
    <Layout preview={`Commande ${orderNumber} annulée — Pixel-Mart`}>
      <Text style={styles.heading}>Commande annulée</Text>

      <Text style={styles.paragraph}>Bonjour {vendorName},</Text>

      <Text style={styles.paragraph}>
        La commande <strong>{orderNumber}</strong> de{" "}
        <strong>{customerName}</strong> d&apos;un montant de{" "}
        <strong>{total}</strong> a été annulée.
      </Text>

      {reason && (
        <Section style={styles.infoBox}>
          <Text style={styles.detailLabel}>Raison</Text>
          <Text style={styles.detailValue}>{reason}</Text>
        </Section>
      )}

      <Text style={styles.paragraph}>
        Le stock des articles concernés a été automatiquement restauré.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={orderUrl}>Voir mes commandes</CTAButton>
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
};
