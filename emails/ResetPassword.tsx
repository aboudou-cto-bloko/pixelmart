import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface ResetPasswordProps {
  userName: string;
  resetUrl: string;
}

export function ResetPassword({ userName, resetUrl }: ResetPasswordProps) {
  return (
    <Layout preview="Réinitialiser votre mot de passe Pixel-Mart">
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Réinitialiser votre mot de passe
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
        Bonjour {userName || ""},<br />
        Vous avez demandé une réinitialisation de mot de passe. Cliquez
        ci-dessous pour choisir un nouveau mot de passe.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "0 0 24px 0" }}>
        <CTAButton href={resetUrl}>Réinitialiser le mot de passe</CTAButton>
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
        Ce lien expire dans 1 heure. Si vous n&apos;êtes pas à l&apos;origine de
        cette demande, ignorez cet email — votre mot de passe restera inchangé.
      </Text>
    </Layout>
  );
}

ResetPassword.PreviewProps = {
  userName: "Franck",
  resetUrl: "https://pixelmart.io/reset-password?token=abc123",
} satisfies ResetPasswordProps;

export default ResetPassword;
