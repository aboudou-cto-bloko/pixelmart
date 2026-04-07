// filepath: emails/DemoInvite.tsx
// Envoyé au partenaire invité à créer un compte démo Pixel-Mart.

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface DemoInviteProps {
  inviterName: string;
  demoUrl: string;
  note?: string;
}

export function DemoInvite({ inviterName, demoUrl, note }: DemoInviteProps) {
  return (
    <Layout preview="Votre accès démo Pixel-Mart est prêt">
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Bienvenue sur Pixel-Mart
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
        <strong>{inviterName}</strong> vous invite à accéder à un compte démo
        Pixel-Mart. Vous pourrez explorer toutes les fonctionnalités de la
        plateforme vendeur dans un environnement sandbox — sans impact sur les
        données de production.
      </Text>

      {note && (
        <Section
          style={{
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            padding: "16px 20px",
            margin: "0 0 24px 0",
          }}
        >
          <Text
            style={{
              fontFamily: emailTheme.fonts.body,
              fontSize: "13px",
              color: "#0369a1",
              margin: "0",
            }}
          >
            {note}
          </Text>
        </Section>
      )}

      <Section
        style={{
          backgroundColor: emailTheme.colors.muted,
          borderRadius: "8px",
          padding: "20px",
          margin: "0 0 24px 0",
        }}
      >
        {[
          "Créer et gérer des produits",
          "Simuler des commandes et paiements",
          "Tester les notifications et la gestion des livraisons",
          "Explorer le tableau de bord et les analytics",
        ].map((item) => (
          <Text
            key={item}
            style={{
              fontFamily: emailTheme.fonts.body,
              fontSize: "14px",
              color: emailTheme.colors.foreground,
              margin: "0 0 6px 0",
            }}
          >
            ✓ {item}
          </Text>
        ))}
      </Section>

      <Text
        style={{
          fontFamily: emailTheme.fonts.body,
          fontSize: "13px",
          color: emailTheme.colors.muted,
          margin: "0 0 24px 0",
        }}
      >
        Ce lien est valable 7 jours. Cliquez ci-dessous pour créer votre compte
        démo.
      </Text>

      <Section style={{ textAlign: "center" as const }}>
        <CTAButton href={demoUrl}>Créer mon compte démo</CTAButton>
      </Section>
    </Layout>
  );
}

DemoInvite.PreviewProps = {
  inviterName: "Admin Pixel-Mart",
  demoUrl: "https://pixel-mart-bj.com/demo?token=abc123xyz",
  note: "Accès préparé pour la création de tutoriels vidéo.",
} satisfies DemoInviteProps;

export default DemoInvite;
