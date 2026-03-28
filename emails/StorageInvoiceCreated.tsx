// filepath: emails/StorageInvoiceCreated.tsx
// Envoyé au vendeur quand une facture de stockage est générée après validation admin.

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";
import { formatPrice } from "../src/lib/format";

interface StorageInvoiceCreatedProps {
  vendorName: string;
  storageCode: string;
  productName: string;
  amount: number; // centimes
  currency: string;
  paymentMethod: "immediate" | "auto_debit" | "deferred";
  dueDate?: string; // ex: "31 mars 2026" — pour le mode différé
}

const PAYMENT_DESCRIPTIONS: Record<string, string> = {
  immediate:
    "Réglez cette facture directement depuis votre espace facturation. Votre stock est actif.",
  auto_debit:
    "Cette facture sera prélevée automatiquement sur vos prochaines ventes.",
  deferred:
    "Cette facture sera déduite automatiquement lors de votre prochain retrait de gains.",
};

export function StorageInvoiceCreated({
  vendorName,
  storageCode,
  productName,
  amount,
  currency,
  paymentMethod,
  dueDate,
}: StorageInvoiceCreatedProps) {
  return (
    <Layout preview={`Facture de stockage — ${formatPrice(amount, currency)}`}>
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Facture de stockage
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
        Bonjour <strong>{vendorName}</strong>, une facture de stockage a été
        générée suite à la mise en stock de votre produit.
      </Text>

      {/* Montant */}
      <Section
        style={{
          backgroundColor: "#f8fafc",
          border: `1px solid ${emailTheme.colors.border}`,
          borderRadius: "8px",
          padding: "24px",
          margin: "0 0 16px 0",
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
          Montant à régler
        </Text>
        <Text
          style={{
            fontFamily: emailTheme.fonts.heading,
            fontSize: "32px",
            fontWeight: "700",
            color: emailTheme.colors.primary,
            margin: "0 0 4px 0",
          }}
        >
          {formatPrice(amount, currency)}
        </Text>
        <Text
          style={{
            fontFamily: emailTheme.fonts.body,
            fontSize: "12px",
            color: emailTheme.colors.muted,
            margin: "0",
          }}
        >
          {storageCode} · {productName}
        </Text>
      </Section>

      {/* Mode de paiement */}
      <Section
        style={{
          backgroundColor:
            paymentMethod === "immediate" ? "#fffbeb" : "#f0f9ff",
          borderRadius: "6px",
          padding: "12px 16px",
          margin: "0 0 24px 0",
        }}
      >
        <Text
          style={{
            fontFamily: emailTheme.fonts.body,
            fontSize: "13px",
            color: paymentMethod === "immediate" ? "#92400e" : "#0c4a6e",
            lineHeight: "1.5",
            margin: "0",
          }}
        >
          {PAYMENT_DESCRIPTIONS[paymentMethod]}
          {dueDate && paymentMethod === "deferred" && (
            <>
              {" "}
              Date limite : <strong>{dueDate}</strong>.
            </>
          )}
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href="https://pixel-mart.com/vendor/billing">
          {paymentMethod === "immediate"
            ? "Payer maintenant"
            : "Voir ma facture"}
        </CTAButton>
      </Section>
    </Layout>
  );
}

StorageInvoiceCreated.PreviewProps = {
  vendorName: "Awa Kante",
  storageCode: "PM-042",
  productName: "Robe Wax Premium",
  amount: 150_000,
  currency: "XOF",
  paymentMethod: "deferred",
} satisfies StorageInvoiceCreatedProps;

export default StorageInvoiceCreated;
