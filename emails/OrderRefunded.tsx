// filepath: emails/OrderRefunded.tsx

import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface OrderRefundedProps {
  customerName: string;
  orderNumber: string;
  storeName: string;
  total: string;
  ordersUrl: string;
}

export default function OrderRefunded({
  customerName = "Client",
  orderNumber = "PM-000001",
  storeName = "Ma Boutique",
  total = "5 000 XOF",
  ordersUrl = "https://pixelmart.com/orders",
}: OrderRefundedProps) {
  return (
    <Layout preview={`Remboursement commande ${orderNumber} — Pixel-Mart`}>
      <Text style={styles.heading}>Remboursement effectué</Text>

      <Text style={styles.paragraph}>Bonjour {customerName},</Text>

      <Text style={styles.paragraph}>
        Votre commande <strong>{orderNumber}</strong> de{" "}
        <strong>{storeName}</strong> a été remboursée.
      </Text>

      <Section style={styles.refundBox}>
        <Text style={styles.refundText}>
          Un remboursement de <strong>{total}</strong> a été initié sur votre
          moyen de paiement d&apos;origine. Le délai de réception est
          généralement de 3 à 7 jours ouvrables selon votre opérateur.
        </Text>
      </Section>

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
