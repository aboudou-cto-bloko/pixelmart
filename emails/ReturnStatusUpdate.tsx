// filepath: src/emails/ReturnStatusUpdate.tsx

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ReturnStatusUpdateProps {
  recipientName: string;
  orderNumber: string;
  storeName: string;
  returnStatus: "requested" | "approved" | "rejected" | "received" | "refunded";
  refundAmount: number;
  currency: string;
  customerName?: string;
  isVendorNotification?: boolean;
  rejectionReason?: string;
  vendorNotes?: string;
}

const STATUS_CONFIG = {
  requested: {
    customerTitle: "Demande de retour enregistrée",
    vendorTitle: "Nouvelle demande de retour",
    customerBody:
      "Votre demande de retour a bien été enregistrée. Le vendeur va examiner votre demande.",
    vendorBody: "Un client a demandé un retour. Veuillez examiner la demande.",
    color: "#F59E0B",
  },
  approved: {
    customerTitle: "Retour approuvé",
    vendorTitle: "Retour approuvé",
    customerBody:
      "Votre demande de retour a été approuvée. Veuillez renvoyer le(s) article(s) au vendeur.",
    vendorBody: "Vous avez approuvé cette demande de retour.",
    color: "#3B82F6",
  },
  rejected: {
    customerTitle: "Retour refusé",
    vendorTitle: "Retour refusé",
    customerBody: "Votre demande de retour a été refusée par le vendeur.",
    vendorBody: "Vous avez refusé cette demande de retour.",
    color: "#EF4444",
  },
  received: {
    customerTitle: "Articles reçus — Remboursement en cours",
    vendorTitle: "Articles retournés reçus",
    customerBody:
      "Le vendeur a confirmé la réception de vos articles. Le remboursement va être traité.",
    vendorBody: "Vous avez confirmé la réception des articles retournés.",
    color: "#8B5CF6",
  },
  refunded: {
    customerTitle: "Remboursement effectué",
    vendorTitle: "Remboursement traité",
    customerBody:
      "Votre remboursement a été traité. Le montant sera crédité sur votre moyen de paiement d'origine.",
    vendorBody: "Le remboursement a été traité et débité de votre solde.",
    color: "#10B981",
  },
};

function formatPrice(centimes: number, currency: string): string {
  const amount = centimes / 100;
  const noDecimal = ["XOF", "XAF", "GNF", "CDF"];
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimal.includes(currency) ? 0 : 2,
    maximumFractionDigits: noDecimal.includes(currency) ? 0 : 2,
  }).format(amount);
}

export default function ReturnStatusUpdate({
  recipientName = "Client",
  orderNumber = "PM-2026-0001",
  storeName = "Ma Boutique",
  returnStatus = "requested",
  refundAmount = 5000,
  currency = "XOF",
  customerName,
  isVendorNotification = false,
  rejectionReason,
  vendorNotes,
}: ReturnStatusUpdateProps) {
  const config = STATUS_CONFIG[returnStatus];
  const title = isVendorNotification
    ? config.vendorTitle
    : config.customerTitle;
  const body = isVendorNotification ? config.vendorBody : config.customerBody;

  return (
    <Html>
      <Head />
      <Preview>
        {title} — Commande {orderNumber}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Pixel-Mart</Heading>

          <Section style={statusBadge(config.color)}>
            <Text style={statusText}>{title}</Text>
          </Section>

          <Text style={greeting}>Bonjour {recipientName},</Text>

          <Text style={paragraph}>{body}</Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Commande</Text>
            <Text style={detailValue}>{orderNumber}</Text>

            <Text style={detailLabel}>Boutique</Text>
            <Text style={detailValue}>{storeName}</Text>

            {isVendorNotification && customerName && (
              <>
                <Text style={detailLabel}>Client</Text>
                <Text style={detailValue}>{customerName}</Text>
              </>
            )}

            <Text style={detailLabel}>Montant du remboursement</Text>
            <Text style={detailValueBold}>
              {formatPrice(refundAmount, currency)}
            </Text>
          </Section>

          {rejectionReason && returnStatus === "rejected" && (
            <Section style={noteBox}>
              <Text style={noteLabel}>Motif du refus :</Text>
              <Text style={noteText}>{rejectionReason}</Text>
            </Section>
          )}

          {vendorNotes && (
            <Section style={noteBox}>
              <Text style={noteLabel}>Note du vendeur :</Text>
              <Text style={noteText}>{vendorNotes}</Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Cet email a été envoyé automatiquement par Pixel-Mart. Pour toute
            question, contactez le support.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const main = {
  backgroundColor: "#F9FAFB",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#FFFFFF",
  margin: "40px auto",
  padding: "32px",
  maxWidth: "560px",
  borderRadius: "8px",
  border: "1px solid #E5E7EB",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#111827",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const statusBadge = (color: string) => ({
  backgroundColor: `${color}15`,
  borderLeft: `4px solid ${color}`,
  padding: "12px 16px",
  borderRadius: "0 6px 6px 0",
  margin: "0 0 24px",
});

const statusText = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#111827",
  margin: "0",
};

const greeting = {
  fontSize: "15px",
  color: "#374151",
  margin: "0 0 12px",
};

const paragraph = {
  fontSize: "14px",
  color: "#4B5563",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const detailsBox = {
  backgroundColor: "#F9FAFB",
  padding: "16px",
  borderRadius: "6px",
  margin: "0 0 24px",
};

const detailLabel = {
  fontSize: "12px",
  color: "#6B7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "8px 0 2px",
};

const detailValue = {
  fontSize: "14px",
  color: "#111827",
  margin: "0 0 8px",
};

const detailValueBold = {
  fontSize: "16px",
  fontWeight: "700" as const,
  color: "#111827",
  margin: "0",
};

const noteBox = {
  backgroundColor: "#FEF3C7",
  padding: "12px 16px",
  borderRadius: "6px",
  margin: "0 0 24px",
};

const noteLabel = {
  fontSize: "12px",
  fontWeight: "600" as const,
  color: "#92400E",
  margin: "0 0 4px",
};

const noteText = {
  fontSize: "14px",
  color: "#78350F",
  margin: "0",
};

const hr = {
  borderColor: "#E5E7EB",
  margin: "24px 0",
};

const footer = {
  fontSize: "12px",
  color: "#9CA3AF",
  textAlign: "center" as const,
  lineHeight: "1.5",
};
