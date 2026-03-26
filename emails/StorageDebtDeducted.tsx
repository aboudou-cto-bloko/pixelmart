// filepath: emails/StorageDebtDeducted.tsx
// Envoyé au vendeur quand sa dette de stockage est déduite d'un retrait (F-05).

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface StorageDebtDeductedProps {
  vendorName: string;
  deductedAmount: number; // centimes
  currency: string;
  grossPayout: number; // centimes — montant brut demandé
  netPayout: number; // centimes — montant effectivement reçu (après dette + frais)
  period: string; // ex: "mars 2026"
}

function fmt(centimes: number, currency: string): string {
  const value = centimes / 100;
  if (currency === "XOF") return `${value.toLocaleString("fr-FR")} FCFA`;
  return `${value.toFixed(2)} ${currency}`;
}

export function StorageDebtDeducted({
  vendorName,
  deductedAmount,
  currency,
  grossPayout,
  netPayout,
  period,
}: StorageDebtDeductedProps) {
  return (
    <Layout
      preview={`Dette de stockage déduite — ${fmt(deductedAmount, currency)}`}
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
        Dette de stockage déduite
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
        Bonjour <strong>{vendorName}</strong>, votre dette de stockage pour la
        période <strong>{period}</strong> a été automatiquement déduite de votre
        retrait.
      </Text>

      {/* Détail du retrait */}
      <Section
        style={{
          backgroundColor: "#f8fafc",
          border: `1px solid ${emailTheme.colors.border}`,
          borderRadius: "8px",
          padding: "20px",
          margin: "0 0 24px 0",
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
          Détail du retrait
        </Text>

        {[
          { label: "Montant demandé", value: fmt(grossPayout, currency) },
          {
            label: "Dette de stockage déduite",
            value: `- ${fmt(deductedAmount, currency)}`,
            highlight: true,
          },
          {
            label: "Montant reçu (après frais)",
            value: fmt(netPayout, currency),
            bold: true,
          },
        ].map(({ label, value, highlight, bold }) => (
          <Section
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "0 0 8px 0",
            }}
          >
            <Text
              style={{
                fontFamily: emailTheme.fonts.body,
                fontSize: "13px",
                color: highlight ? "#92400e" : emailTheme.colors.muted,
                margin: "0",
                display: "inline",
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontFamily: emailTheme.fonts.body,
                fontSize: "13px",
                fontWeight: bold || highlight ? "700" : "400",
                color: highlight
                  ? "#92400e"
                  : bold
                    ? emailTheme.colors.foreground
                    : emailTheme.colors.muted,
                margin: "0",
                display: "inline",
              }}
            >
              {value}
            </Text>
          </Section>
        ))}
      </Section>

      <Text
        style={{
          fontFamily: emailTheme.fonts.body,
          fontSize: "13px",
          color: emailTheme.colors.muted,
          lineHeight: "1.6",
          margin: "0 0 24px 0",
        }}
      >
        Consultez votre espace facturation pour retrouver le détail de vos
        factures de stockage.
      </Text>

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href="https://pixel-mart.com/vendor/billing">
          Voir ma facturation
        </CTAButton>
      </Section>
    </Layout>
  );
}

StorageDebtDeducted.PreviewProps = {
  vendorName: "Awa Kante",
  deductedAmount: 150_000,
  currency: "XOF",
  grossPayout: 1_500_000,
  netPayout: 1_275_000,
  period: "mars 2026",
} satisfies StorageDebtDeductedProps;

export default StorageDebtDeducted;
