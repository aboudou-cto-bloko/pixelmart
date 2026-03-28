// filepath: emails/StorageValidated.tsx
// Envoyé au vendeur quand l'admin valide sa mise en stock et génère la facture.

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";
import { formatPrice } from "../src/lib/format";

interface StorageValidatedProps {
  vendorName: string;
  storageCode: string;
  productName: string;
  storageFee: number; // centimes
  currency: string;
  paymentMethod: "immediate" | "auto_debit" | "deferred";
  actualQty?: number;
  actualWeightKg?: number;
  measurementType?: "units" | "weight";
}

const PAYMENT_LABELS: Record<string, string> = {
  immediate: "Paiement immédiat",
  auto_debit: "Prélèvement automatique sur ventes",
  deferred: "Paiement différé (prélevé au prochain retrait)",
};

export function StorageValidated({
  vendorName,
  storageCode,
  productName,
  storageFee,
  currency,
  paymentMethod,
  actualQty,
  actualWeightKg,
  measurementType,
}: StorageValidatedProps) {
  const measureLabel =
    measurementType === "units"
      ? `${actualQty} unité${(actualQty ?? 0) > 1 ? "s" : ""}`
      : `${actualWeightKg} kg`;

  return (
    <Layout
      preview={`${storageCode} en stock — Frais : ${formatPrice(storageFee, currency)}`}
    >
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Produit mis en stock ✓
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
        Bonjour <strong>{vendorName}</strong>, votre produit a été validé et est
        maintenant disponible dans notre entrepôt.
      </Text>

      {/* Détails */}
      <Section
        style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          padding: "20px",
          margin: "0 0 16px 0",
        }}
      >
        <Text
          style={{
            fontFamily: emailTheme.fonts.body,
            fontSize: "11px",
            color: emailTheme.colors.muted,
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            margin: "0 0 12px 0",
          }}
        >
          Récapitulatif
        </Text>
        {[
          { label: "Code de stockage", value: storageCode },
          { label: "Produit", value: productName },
          ...(measurementType
            ? [{ label: "Mesure officielle", value: measureLabel }]
            : []),
          { label: "Frais de stockage", value: formatPrice(storageFee, currency) },
          {
            label: "Mode de facturation",
            value: PAYMENT_LABELS[paymentMethod],
          },
        ].map(({ label, value }) => (
          <Section key={label} style={{ margin: "0 0 8px 0" }}>
            <Text
              style={{
                fontFamily: emailTheme.fonts.body,
                fontSize: "11px",
                color: emailTheme.colors.muted,
                margin: "0 0 2px 0",
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontFamily: emailTheme.fonts.body,
                fontSize: "14px",
                fontWeight: label === "Frais de stockage" ? "700" : "400",
                color: emailTheme.colors.foreground,
                margin: "0",
              }}
            >
              {value}
            </Text>
          </Section>
        ))}
      </Section>

      {paymentMethod === "immediate" && (
        <Text
          style={{
            fontFamily: emailTheme.fonts.body,
            fontSize: "13px",
            color: "#92400e",
            backgroundColor: "#fffbeb",
            borderRadius: "6px",
            padding: "10px 14px",
            margin: "0 0 24px 0",
          }}
        >
          Une facture de <strong>{formatPrice(storageFee, currency)}</strong> est
          disponible. Réglez-la depuis votre espace facturation pour activer le
          service.
        </Text>
      )}

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href="https://pixel-mart.com/vendor/billing">
          Voir ma facture
        </CTAButton>
      </Section>
    </Layout>
  );
}

StorageValidated.PreviewProps = {
  vendorName: "Awa Kante",
  storageCode: "PM-042",
  productName: "Robe Wax Premium",
  storageFee: 150_000,
  currency: "XOF",
  paymentMethod: "deferred",
  actualQty: 15,
  measurementType: "units",
} satisfies StorageValidatedProps;

export default StorageValidated;
