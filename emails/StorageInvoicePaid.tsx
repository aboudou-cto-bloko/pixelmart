// filepath: emails/StorageInvoicePaid.tsx
// Envoyé au vendeur quand une facture de stockage est réglée.

import { Section, Text, Hr } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";
import { formatPrice } from "../src/lib/format";

interface StorageInvoicePaidProps {
  vendorName: string;
  amount: number; // centimes
  currency: string;
  storageCode?: string;
}

export function StorageInvoicePaid({
  vendorName,
  amount,
  currency,
  storageCode,
}: StorageInvoicePaidProps) {
  const formatted = formatPrice(amount, currency);

  return (
    <Layout preview={`Facture de stockage réglée — ${formatted}`}>
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Facture de stockage réglée ✅
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
        Bonjour <strong>{vendorName}</strong>,
      </Text>

      {/* Montant */}
      <Section
        style={{
          backgroundColor: "#f0fdf4",
          border: `1px solid #86efac`,
          borderRadius: "8px",
          padding: "24px",
          margin: "0 0 24px 0",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontFamily: emailTheme.fonts.body,
            fontSize: "11px",
            color: emailTheme.colors.muted,
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            margin: "0 0 8px 0",
          }}
        >
          Paiement confirmé
        </Text>
        <Text
          style={{
            fontFamily: emailTheme.fonts.heading,
            fontSize: "32px",
            fontWeight: "700",
            color: "#16a34a",
            margin: "0 0 4px 0",
          }}
        >
          {formatted}
        </Text>
        {storageCode && (
          <Text
            style={{
              fontFamily: emailTheme.fonts.body,
              fontSize: "12px",
              color: emailTheme.colors.muted,
              margin: "0",
            }}
          >
            Facture {storageCode}
          </Text>
        )}
      </Section>

      <Text
        style={{
          fontFamily: emailTheme.fonts.body,
          fontSize: "14px",
          color: emailTheme.colors.foreground,
          lineHeight: "1.6",
          margin: "0 0 24px 0",
        }}
      >
        Votre paiement de <strong>{formatted}</strong> a été confirmé et votre
        facture{storageCode ? ` (${storageCode})` : ""} est désormais réglée.
      </Text>

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href="https://pixel-mart-bj.com/vendor/billing">
          Voir ma facturation
        </CTAButton>
      </Section>

      <Hr
        style={{
          borderColor: emailTheme.colors.border,
          margin: "24px 0",
        }}
      />
    </Layout>
  );
}

StorageInvoicePaid.PreviewProps = {
  vendorName: "Awa Kante",
  amount: 5_000,
  currency: "XOF",
  storageCode: "PM-042",
} satisfies StorageInvoicePaidProps;

export default StorageInvoicePaid;
