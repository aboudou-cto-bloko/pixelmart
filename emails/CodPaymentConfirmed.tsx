// filepath: emails/CodPaymentConfirmed.tsx
// Email envoyé au CLIENT quand son paiement COD est confirmé après livraison.

import { Text, Section, Row, Column, Hr } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface CodPaymentConfirmedProps {
  customerName: string;
  orderNumber: string;
  storeName: string;
  total: string;
  paymentMethod: string;
  orderUrl: string;
}

export default function CodPaymentConfirmed({
  customerName = "Client",
  orderNumber = "PM-000001",
  storeName = "Ma Boutique",
  total = "12 500 FCFA",
  paymentMethod = "MTN Mobile Money",
  orderUrl = "https://pixelmart.com/orders/123",
}: CodPaymentConfirmedProps) {
  return (
    <Layout preview={`Paiement confirmé — Commande ${orderNumber} finalisée`}>
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.heading}>Paiement reçu !</Text>

      <Text style={styles.paragraph}>Bonjour {customerName},</Text>

      <Text style={styles.paragraph}>
        Votre paiement pour la commande <strong>{orderNumber}</strong> chez{" "}
        <strong>{storeName}</strong> a bien été reçu. Votre commande est
        désormais entièrement finalisée.
      </Text>

      {/* Récapitulatif du paiement */}
      <Section style={styles.table}>
        <Text style={styles.tableHeader}>Récapitulatif du paiement</Text>

        <Row style={styles.tableRow}>
          <Column style={styles.itemName}>N° commande</Column>
          <Column style={{ ...styles.itemPrice, fontFamily: "monospace" }}>
            {orderNumber}
          </Column>
        </Row>

        <Hr style={styles.hr} />

        <Row style={styles.tableRow}>
          <Column style={{ ...styles.itemName, fontWeight: "700" }}>
            Montant payé
          </Column>
          <Column
            style={{
              ...styles.itemPrice,
              fontWeight: "700",
              color: "#16a34a",
            }}
          >
            {total}
          </Column>
        </Row>

        <Row style={styles.tableRow}>
          <Column style={styles.itemName}>Mode de paiement</Column>
          <Column style={styles.itemPrice}>{paymentMethod}</Column>
        </Row>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={orderUrl}>Voir ma commande</CTAButton>
      </Section>

      <Text style={styles.footer}>
        Satisfait(e) de votre achat ? Laissez un avis depuis la page de commande
        — cela aide les autres acheteurs et encourage le vendeur.
      </Text>
    </Layout>
  );
}

const styles = {
  emoji: {
    fontSize: "40px",
    textAlign: "center" as const,
    margin: "0 0 8px 0",
  },
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
  table: {
    backgroundColor: emailTheme.colors.background,
    borderRadius: emailTheme.borderRadius,
    padding: "16px",
    marginTop: "20px",
  },
  tableHeader: {
    fontFamily: emailTheme.fonts.heading,
    fontSize: "14px",
    fontWeight: "600" as const,
    color: emailTheme.colors.foreground,
    margin: "0 0 12px 0",
  },
  tableRow: { marginBottom: "8px" },
  itemName: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.foreground,
    paddingRight: "16px",
  },
  itemPrice: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.foreground,
    textAlign: "right" as const,
    whiteSpace: "nowrap" as const,
  },
  hr: { borderColor: emailTheme.colors.border, margin: "8px 0" },
  footer: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.muted,
    textAlign: "center" as const,
    marginTop: "24px",
  },
};
