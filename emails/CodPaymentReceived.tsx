// filepath: emails/CodPaymentReceived.tsx
// Email envoyé au VENDEUR quand un client a payé sa commande COD via Mobile Money.

import { Text, Section, Row, Column, Hr } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface CodPaymentReceivedProps {
  vendorName: string;
  orderNumber: string;
  customerName: string;
  total: string;
  commission: string;
  netRevenue: string;
  orderUrl: string;
}

export default function CodPaymentReceived({
  vendorName = "Vendeur",
  orderNumber = "PM-000001",
  customerName = "Client",
  total = "12 500 FCFA",
  commission = "625 FCFA",
  netRevenue = "11 875 FCFA",
  orderUrl = "https://pixelmart.com/vendor/orders/123",
}: CodPaymentReceivedProps) {
  return (
    <Layout preview={`Paiement COD reçu — Commande ${orderNumber}`}>
      <Text style={styles.emoji}>💳</Text>
      <Text style={styles.heading}>Paiement COD reçu !</Text>

      <Text style={styles.paragraph}>Bonjour {vendorName},</Text>

      <Text style={styles.paragraph}>
        Le client <strong>{customerName}</strong> vient de régler sa commande{" "}
        <strong>{orderNumber}</strong> via Mobile Money. Le montant est crédité
        sur votre solde en attente et sera libéré sous{" "}
        <strong>48 heures</strong>.
      </Text>

      {/* Récapitulatif financier */}
      <Section style={styles.table}>
        <Text style={styles.tableHeader}>Récapitulatif financier</Text>

        <Row style={styles.tableRow}>
          <Column style={styles.itemName}>Total commande</Column>
          <Column style={styles.itemPrice}>{total}</Column>
        </Row>

        <Row style={styles.tableRow}>
          <Column
            style={{ ...styles.itemName, color: emailTheme.colors.muted }}
          >
            Commission Pixel-Mart
          </Column>
          <Column
            style={{ ...styles.itemPrice, color: emailTheme.colors.muted }}
          >
            -{commission}
          </Column>
        </Row>

        <Hr style={styles.hr} />

        <Row style={styles.tableRow}>
          <Column style={{ ...styles.itemName, fontWeight: "700" }}>
            Votre revenu net
          </Column>
          <Column
            style={{
              ...styles.itemPrice,
              fontWeight: "700",
              color: "#16a34a",
            }}
          >
            {netRevenue}
          </Column>
        </Row>
      </Section>

      {/* Info libération */}
      <Section style={styles.infoBox}>
        <Text style={styles.infoText}>
          ⏱ Ce montant sera disponible pour retrait sous 48h, conformément aux
          règles de la plateforme.
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={orderUrl}>Voir la commande</CTAButton>
      </Section>
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
  infoBox: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: emailTheme.borderRadius,
    padding: "12px 16px",
    marginTop: "20px",
  },
  infoText: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: "#166534",
    margin: "0",
    lineHeight: "1.5",
  },
};
