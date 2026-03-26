// filepath: emails/StorageRequestReceived.tsx
// Envoyé au vendeur à la création de sa demande de stockage.

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface StorageRequestReceivedProps {
  vendorName: string;
  storageCode: string;
  productName: string;
  estimatedQty?: number;
  storeName: string;
}

export function StorageRequestReceived({
  vendorName,
  storageCode,
  productName,
  estimatedQty,
  storeName,
}: StorageRequestReceivedProps) {
  return (
    <Layout preview={`Code de stockage : ${storageCode} — ${productName}`}>
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Demande de stockage créée
      </Text>

      <Text
        style={{
          fontFamily: emailTheme.fonts.body,
          fontSize: "15px",
          color: emailTheme.colors.foreground,
          lineHeight: "1.6",
          margin: "0 0 24px 0",
        }}
      >
        Bonjour <strong>{vendorName}</strong>, votre demande de mise en stock
        pour <strong>{storeName}</strong> a été créée.
      </Text>

      {/* Code box */}
      <Section
        style={{
          backgroundColor: "#fffbeb",
          border: "2px dashed #f59e0b",
          borderRadius: "8px",
          padding: "24px",
          margin: "0 0 24px 0",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontSize: "11px",
            fontFamily: emailTheme.fonts.body,
            color: emailTheme.colors.muted,
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            margin: "0 0 8px 0",
          }}
        >
          À écrire sur votre colis
        </Text>
        <Text
          style={{
            fontSize: "36px",
            fontFamily: "monospace",
            fontWeight: "900",
            color: "#92400e",
            letterSpacing: "0.05em",
            margin: "0 0 8px 0",
          }}
        >
          {storageCode}
        </Text>
        <Text
          style={{
            fontSize: "13px",
            fontFamily: emailTheme.fonts.body,
            color: "#78350f",
            margin: "0",
          }}
        >
          {productName}
          {estimatedQty
            ? ` · ${estimatedQty} unité${estimatedQty > 1 ? "s" : ""}`
            : ""}
        </Text>
      </Section>

      <Text
        style={{
          fontFamily: emailTheme.fonts.body,
          fontSize: "14px",
          color: emailTheme.colors.muted,
          lineHeight: "1.6",
          margin: "0 0 24px 0",
        }}
      >
        Écrivez le code <strong>{storageCode}</strong> et le nom du produit
        lisiblement sur le colis avant de le déposer à l'entrepôt. Un agent
        Pixel-Mart le réceptionnera et saisira les données officielles.
      </Text>

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href="https://pixel-mart.com/vendor/storage">
          Voir ma demande
        </CTAButton>
      </Section>
    </Layout>
  );
}

StorageRequestReceived.PreviewProps = {
  vendorName: "Awa Kante",
  storageCode: "PM-042",
  productName: "Robe Wax Premium",
  estimatedQty: 15,
  storeName: "Boutique Awa",
} satisfies StorageRequestReceivedProps;

export default StorageRequestReceived;
