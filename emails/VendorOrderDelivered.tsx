// filepath: emails/VendorOrderDelivered.tsx

import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface VendorOrderDeliveredProps {
  vendorName: string;
  orderNumber: string;
  customerName: string;
  confirmedBy: "customer" | "auto";
  orderUrl: string;
}

export default function VendorOrderDelivered({
  vendorName = "Vendeur",
  orderNumber = "PM-000001",
  customerName = "Client",
  confirmedBy = "customer",
  orderUrl = "https://pixelmart.com/vendor/orders/123",
}: VendorOrderDeliveredProps) {
  const confirmedByLabel =
    confirmedBy === "customer"
      ? `${customerName} a confirmé la réception`
      : "La livraison a été confirmée automatiquement après 7 jours";

  return (
    <Layout preview={`Commande ${orderNumber} livrée — Pixel-Mart`}>
      <Text style={styles.heading}>Livraison confirmée !</Text>

      <Text style={styles.paragraph}>Bonjour {vendorName},</Text>

      <Text style={styles.paragraph}>
        La commande <strong>{orderNumber}</strong> est marquée comme livrée.{" "}
        {confirmedByLabel}.
      </Text>

      <Section style={styles.infoBox}>
        <Text style={styles.detailLabel}>Commande</Text>
        <Text style={styles.detailValue}>{orderNumber}</Text>
        <Text style={{ ...styles.detailLabel, marginTop: "12px" }}>Client</Text>
        <Text style={styles.detailValue}>{customerName}</Text>
      </Section>

      <Text style={styles.paragraph}>
        Votre solde en attente sera libéré dans 48 heures conformément aux
        conditions Pixel-Mart.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={orderUrl}>Voir la commande</CTAButton>
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
    marginBottom: "16px",
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
