import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface VerifyEmailProps {
  userName: string;
  verificationUrl: string;
}

export function VerifyEmail({ userName, verificationUrl }: VerifyEmailProps) {
  return (
    <Layout preview="Vérifiez votre adresse email pour activer votre compte Pixel-Mart">
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Bienvenue sur Pixel-Mart !
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
        Merci de vous être inscrit. Cliquez ci-dessous pour vérifier votre
        adresse email et activer votre compte.
      </Text>

      <Section style={{ textAlign: "center" as const, margin: "0 0 24px 0" }}>
        <CTAButton href={verificationUrl}>Vérifier mon email</CTAButton>
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
        Ce lien expire dans 1 heure. Si vous n&apos;avez pas créé de compte sur
        Pixel-Mart, ignorez simplement cet email.
      </Text>
    </Layout>
  );
}

VerifyEmail.PreviewProps = {
  userName: "Franck",
  verificationUrl: "https://pixelmart.io/api/auth/verify-email?token=abc123",
} satisfies VerifyEmailProps;

export default VerifyEmail;
