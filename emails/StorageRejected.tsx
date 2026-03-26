// filepath: emails/StorageRejected.tsx
// Envoyé au vendeur quand l'admin rejette sa demande de mise en stock.

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface StorageRejectedProps {
  vendorName: string;
  storageCode: string;
  productName: string;
  reason: string;
}

export function StorageRejected({
  vendorName,
  storageCode,
  productName,
  reason,
}: StorageRejectedProps) {
  return (
    <Layout preview={`Demande de stockage ${storageCode} rejetée`}>
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Demande de stockage rejetée
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
        pour <strong>{productName}</strong> (code <strong>{storageCode}</strong>
        ) n'a pas pu être validée.
      </Text>

      {/* Motif */}
      <Section
        style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          padding: "16px 20px",
          margin: "0 0 24px 0",
        }}
      >
        <Text
          style={{
            fontFamily: emailTheme.fonts.body,
            fontSize: "11px",
            color: "#991b1b",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            margin: "0 0 8px 0",
          }}
        >
          Motif du rejet
        </Text>
        <Text
          style={{
            fontFamily: emailTheme.fonts.body,
            fontSize: "14px",
            color: "#7f1d1d",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          {reason}
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
        Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez créer une
        nouvelle demande, rendez-vous dans votre espace de gestion du stockage.
      </Text>

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href="https://pixel-mart.com/vendor/storage">
          Gérer mon stockage
        </CTAButton>
      </Section>
    </Layout>
  );
}

StorageRejected.PreviewProps = {
  vendorName: "Koffi Mensah",
  storageCode: "PM-039",
  productName: "Sneakers Canvas",
  reason:
    "Le colis ne correspond pas à la description. Les articles sont endommagés et ne peuvent pas être acceptés en entrepôt.",
} satisfies StorageRejectedProps;

export default StorageRejected;
