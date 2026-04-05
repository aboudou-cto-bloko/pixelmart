// filepath: emails/VendorDeliveryFailed.tsx

import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface VendorDeliveryFailedProps {
  vendorName: string;
  orderNumber: string;
  customerName: string;
  orderUrl: string;
}

export default function VendorDeliveryFailed({
  vendorName = "Vendeur",
  orderNumber = "PM-000001",
  customerName = "Client",
  orderUrl = "https://pixelmart.com/vendor/orders/123",
}: VendorDeliveryFailedProps) {
  return (
    <Layout preview={`Échec de livraison — Commande ${orderNumber}`}>
      <Text style={styles.heading}>Échec de livraison</Text>

      <Text style={styles.paragraph}>Bonjour {vendorName},</Text>

      <Text style={styles.paragraph}>
        La tentative de livraison de la commande <strong>{orderNumber}</strong>{" "}
        pour <strong>{customerName}</strong> a échoué.
      </Text>

      <Section style={styles.alertBox}>
        <Text style={styles.alertText}>
          Veuillez contacter le client pour replanifier la livraison ou annuler
          la commande si nécessaire.
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={orderUrl}>Gérer la commande</CTAButton>
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
  alertBox: {
    backgroundColor: "#fef9c3",
    borderRadius: emailTheme.borderRadius,
    padding: "16px",
    marginTop: "16px",
    border: "1px solid #fde047",
  },
  alertText: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "14px",
    color: "#854d0e",
    margin: "0",
    lineHeight: "1.6",
  },
};
