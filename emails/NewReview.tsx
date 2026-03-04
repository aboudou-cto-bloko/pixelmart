// filepath: emails/NewReview.tsx

import { Section, Text } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface NewReviewProps {
  vendorName: string;
  customerName: string;
  productTitle: string;
  rating: number;
  reviewTitle?: string;
  dashboardUrl: string;
}

export function NewReview({
  vendorName,
  customerName,
  productTitle,
  rating,
  reviewTitle,
  dashboardUrl,
}: NewReviewProps) {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  return (
    <Layout preview={`Nouvel avis ${stars} sur ${productTitle}`}>
      <Text
        style={{
          fontFamily: emailTheme.fonts.heading,
          fontSize: "22px",
          fontWeight: "700",
          color: emailTheme.colors.foreground,
          margin: "0 0 8px 0",
        }}
      >
        Nouvel avis client
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
        Bonjour {vendorName},
        <br />
        <strong>{customerName}</strong> a laissé un avis sur{" "}
        <strong>{productTitle}</strong>.
      </Text>

      <Section
        style={{
          backgroundColor: "#F8FAFC",
          borderRadius: "8px",
          padding: "16px",
          margin: "0 0 24px 0",
        }}
      >
        <Text
          style={{
            fontSize: "24px",
            margin: "0 0 4px 0",
            textAlign: "center" as const,
          }}
        >
          {stars}
        </Text>
        {reviewTitle && (
          <Text
            style={{
              fontFamily: emailTheme.fonts.body,
              fontSize: "14px",
              fontWeight: "600",
              color: emailTheme.colors.foreground,
              textAlign: "center" as const,
              margin: "0",
            }}
          >
            « {reviewTitle} »
          </Text>
        )}
      </Section>

      <Section style={{ textAlign: "center" as const, margin: "0 0 24px 0" }}>
        <CTAButton href={dashboardUrl}>Voir et répondre</CTAButton>
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
        Répondre aux avis améliore la confiance de vos clients et votre taux de
        conversion.
      </Text>
    </Layout>
  );
}

NewReview.PreviewProps = {
  vendorName: "Franck",
  customerName: "Aminata",
  productTitle: "Robe Wax Ankara",
  rating: 4,
  reviewTitle: "Très belle qualité !",
  dashboardUrl: "https://pixelmart.io/vendor/reviews",
} satisfies NewReviewProps;

export default NewReview;
