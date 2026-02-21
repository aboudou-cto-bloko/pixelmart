// filepath: emails/components/Layout.tsx

import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

// ---- Design tokens email (inline CSS obligatoire pour les clients mail) ----
// Correspondance avec globals.css — modifier ICI pour rebrand les emails.
export const emailTheme = {
  colors: {
    primary: "#d4831a", // ≈ oklch(0.75 0.18 70) — orange PixelMart
    primaryForeground: "#1a1a1a", // ≈ oklch(0.15 0 0)
    secondary: "#3a7bd5", // ≈ oklch(0.7 0.15 230) — bleu PixelMart
    background: "#f7f7f7", // ≈ oklch(0.98 0 0) légèrement grisé
    card: "#ffffff",
    foreground: "#1a1a1a", // ≈ oklch(0.15 0 0)
    muted: "#737373", // ≈ oklch(0.4 0 0)
    border: "#e5e5e5", // ≈ oklch(0.88 0 0)
  },
  fonts: {
    heading: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
    body: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
  },
  spacing: {
    containerWidth: "600px",
    padding: "40px 24px",
    sectionGap: "24px",
  },
  borderRadius: "8px",
} as const;

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: emailTheme.colors.background,
          fontFamily: emailTheme.fonts.body,
          margin: "0",
          padding: "0",
        }}
      >
        <Container
          style={{
            maxWidth: emailTheme.spacing.containerWidth,
            margin: "0 auto",
            padding: emailTheme.spacing.padding,
          }}
        >
          {/* Header */}
          <Section
            style={{
              textAlign: "center" as const,
              marginBottom: emailTheme.spacing.sectionGap,
            }}
          >
            <Text
              style={{
                fontFamily: emailTheme.fonts.heading,
                fontSize: "28px",
                fontWeight: "700",
                color: emailTheme.colors.primary,
                margin: "0",
                letterSpacing: "-0.01em",
              }}
            >
              Pixel-Mart
            </Text>
          </Section>

          {/* Content card */}
          <Section
            style={{
              backgroundColor: emailTheme.colors.card,
              borderRadius: emailTheme.borderRadius,
              padding: "32px 24px",
              border: `1px solid ${emailTheme.colors.border}`,
            }}
          >
            {children}
          </Section>

          {/* Footer */}
          <Section
            style={{
              marginTop: emailTheme.spacing.sectionGap,
              textAlign: "center" as const,
            }}
          >
            <Hr
              style={{
                borderColor: emailTheme.colors.border,
                margin: "0 0 16px 0",
              }}
            />
            <Text
              style={{
                fontFamily: emailTheme.fonts.body,
                fontSize: "12px",
                color: emailTheme.colors.muted,
                margin: "0",
                lineHeight: "1.6",
              }}
            >
              © {new Date().getFullYear()} Pixel-Mart — La marketplace
              africaine.
              <br />
              Cet email a été envoyé automatiquement, merci de ne pas y
              répondre.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
