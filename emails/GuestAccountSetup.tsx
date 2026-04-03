import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface GuestAccountSetupProps {
  customerName: string;
  orderNumber: string;
  setupUrl: string;
}

export function GuestAccountSetup({
  customerName,
  orderNumber,
  setupUrl,
}: GuestAccountSetupProps) {
  return (
    <Layout
      preview={`Commande ${orderNumber} confirmée — Créez votre compte Pixel-Mart`}
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
        Commande confirmée !
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
        Bonjour {customerName},<br />
        Votre commande <strong>{orderNumber}</strong> a bien été enregistrée. Le
        vendeur va préparer votre colis très prochainement.
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
        Pour suivre vos commandes et accéder à votre espace client, créez votre
        mot de passe en cliquant ci-dessous :
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "0 0 24px 0" }}>
        <CTAButton href={setupUrl}>Créer mon compte</CTAButton>
      </Section>

      <Text
        style={{
          fontFamily: emailTheme.fonts.body,
          fontSize: "13px",
          color: emailTheme.colors.muted,
          lineHeight: "1.6",
          margin: "0",
        }}
      >
        Ce lien est valable 7 jours. Si vous n&apos;avez pas passé cette
        commande, ignorez cet email.
      </Text>
    </Layout>
  );
}

GuestAccountSetup.PreviewProps = {
  customerName: "Franck",
  orderNumber: "PM-00042",
  setupUrl:
    "https://www.pixel-mart-bj.com/register?token=abc123&email=franck%40example.com",
} satisfies GuestAccountSetupProps;

export default GuestAccountSetup;
