// filepath: emails/PayoutCompleted.tsx

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface PayoutCompletedProps {
  amount: number;
  currency: string;
  method: string;
  storeName: string;
}

function fmt(centimes: number, currency: string): string {
  const value = centimes / 100;
  if (currency === "XOF") return `${value.toLocaleString("fr-FR")} FCFA`;
  return `${value.toFixed(2)} ${currency}`;
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Virement bancaire",
  mobile_money: "Mobile Money",
  paypal: "PayPal",
};

export function PayoutCompleted({
  amount,
  currency,
  method,
  storeName,
}: PayoutCompletedProps) {
  return (
    <Layout preview={`Retrait effectué — ${fmt(amount, currency)}`}>
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Retrait effectué !
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
        Votre retrait pour la boutique <strong>{storeName}</strong> a été traité
        avec succès.
      </Text>

      <Section
        style={{
          backgroundColor: "#f0fdf4",
          borderRadius: "8px",
          padding: "20px",
          margin: "0 0 24px 0",
          textAlign: "center" as const,
        }}
      >
        <Text
          style={{
            fontSize: "28px",
            fontFamily: emailTheme.fonts.heading,
            fontWeight: "700",
            color: "#16a34a",
            margin: "0 0 4px 0",
          }}
        >
          {fmt(amount, currency)}
        </Text>
        <Text
          style={{
            fontSize: "12px",
            fontFamily: emailTheme.fonts.body,
            color: emailTheme.colors.muted,
            margin: "0",
          }}
        >
          via {METHOD_LABELS[method] ?? method}
        </Text>
      </Section>

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href="https://pixelmart.io/vendor/finance">
          Voir mon solde
        </CTAButton>
      </Section>
    </Layout>
  );
}

PayoutCompleted.PreviewProps = {
  amount: 15000000,
  currency: "XOF",
  method: "mobile_money",
  storeName: "Mode Dakar",
} satisfies PayoutCompletedProps;

export default PayoutCompleted;
