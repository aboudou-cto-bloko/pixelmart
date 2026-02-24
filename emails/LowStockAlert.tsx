// filepath: emails/LowStockAlert.tsx

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface LowStockAlertProps {
  productTitle: string;
  currentQuantity: number;
  threshold: number;
  storeName: string;
}

export function LowStockAlert({
  productTitle,
  currentQuantity,
  threshold,
  storeName,
}: LowStockAlertProps) {
  return (
    <Layout preview={`⚠ Stock faible : ${productTitle}`}>
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Alerte stock faible
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
        Le produit <strong>{productTitle}</strong> de votre boutique{" "}
        <strong>{storeName}</strong> est bientôt en rupture.
      </Text>

      <Section
        style={{
          backgroundColor: "#fef2f2",
          borderRadius: "8px",
          padding: "16px",
          margin: "0 0 24px 0",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontSize: "28px",
            fontFamily: emailTheme.fonts.heading,
            fontWeight: "700",
            color: "#dc2626",
            margin: "0 0 4px 0",
          }}
        >
          {currentQuantity}
        </Text>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: emailTheme.fonts.body,
            color: emailTheme.colors.muted,
            margin: "0",
          }}
        >
          restant{currentQuantity > 1 ? "s" : ""} (seuil : {threshold})
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href="https://pixelmart.io/vendor/products">
          Réapprovisionner
        </CTAButton>
      </Section>
    </Layout>
  );
}

LowStockAlert.PreviewProps = {
  productTitle: "Robe Wax Multicolore - Taille M",
  currentQuantity: 3,
  threshold: 5,
  storeName: "Mode Dakar",
} satisfies LowStockAlertProps;

export default LowStockAlert;
