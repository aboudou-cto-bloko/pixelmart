// filepath: emails/OrderShipped.tsx

import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface OrderShippedProps {
  customerName: string;
  orderNumber: string;
  storeName: string;
  trackingNumber?: string;
  carrier?: string;
  orderUrl: string;
}

export default function OrderShipped({
  customerName = "Client",
  orderNumber = "PM-000001",
  storeName = "Ma Boutique",
  trackingNumber,
  carrier,
  orderUrl = "https://pixelmart.com/orders/123",
}: OrderShippedProps) {
  return (
    <Layout preview={`Votre commande ${orderNumber} a été expédiée !`}>
      <Text style={styles.emoji}>📦</Text>
      <Text style={styles.heading}>Commande expédiée !</Text>

      <Text style={styles.paragraph}>Bonjour {customerName},</Text>

      <Text style={styles.paragraph}>
        Bonne nouvelle ! Votre commande <strong>{orderNumber}</strong> de{" "}
        <strong>{storeName}</strong> a été expédiée et est en route vers vous.
      </Text>

      {(trackingNumber || carrier) && (
        <Section style={styles.infoBox}>
          {carrier && (
            <>
              <Text style={styles.detailLabel}>Transporteur</Text>
              <Text style={styles.detailValue}>{carrier}</Text>
            </>
          )}
          {trackingNumber && (
            <>
              <Text style={styles.detailLabel}>Numéro de suivi</Text>
              <Text style={{ ...styles.detailValue, fontFamily: "monospace" }}>
                {trackingNumber}
              </Text>
            </>
          )}
        </Section>
      )}

      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={orderUrl}>Suivre ma commande</CTAButton>
      </Section>

      <Text style={styles.footer}>
        La livraison prend généralement 2 à 7 jours ouvrables.
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
  infoBox: {
    backgroundColor: emailTheme.colors.background,
    borderRadius: emailTheme.borderRadius,
    padding: "16px",
    marginTop: "20px",
  },
  detailLabel: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "11px",
    color: emailTheme.colors.muted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "8px 0 2px 0",
  },
  detailValue: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "16px",
    fontWeight: "600" as const,
    color: emailTheme.colors.foreground,
    margin: "0",
  },
  footer: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.muted,
    textAlign: "center" as const,
    marginTop: "24px",
  },
};
