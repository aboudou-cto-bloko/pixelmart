// filepath: emails/OrderDelivered.tsx

import { Text, Section } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface OrderDeliveredProps {
  customerName: string;
  orderNumber: string;
  storeName: string;
  orderUrl: string;
}

export default function OrderDelivered({
  customerName = "Client",
  orderNumber = "PM-000001",
  storeName = "Ma Boutique",
  orderUrl = "https://pixelmart.com/orders/123",
}: OrderDeliveredProps) {
  return (
    <Layout preview={`Votre commande ${orderNumber} a été livrée !`}>
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.heading}>Commande livrée !</Text>

      <Text style={styles.paragraph}>Bonjour {customerName},</Text>

      <Text style={styles.paragraph}>
        Votre commande <strong>{orderNumber}</strong> de{" "}
        <strong>{storeName}</strong> a été livrée avec succès.
      </Text>

      <Text style={styles.paragraph}>
        Nous espérons que vos achats vous plaisent ! Si vous êtes satisfait(e),
        n&apos;hésitez pas à laisser un avis — cela aide les autres acheteurs et
        le vendeur.
      </Text>

      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={orderUrl}>Voir ma commande</CTAButton>
      </Section>

      <Text style={styles.footer}>
        Un problème avec votre commande ? Contactez le vendeur depuis la page de
        commande.
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
  footer: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.muted,
    textAlign: "center" as const,
    marginTop: "24px",
  },
};
