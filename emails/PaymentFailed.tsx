// filepath: emails/PaymentFailed.tsx

import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface PaymentFailedItem {
  title: string;
  quantity: number;
  productUrl: string;
}

interface PaymentFailedProps {
  customerName: string;
  orderNumber: string;
  storeName: string;
  total: string;
  items: PaymentFailedItem[];
  retryUrl: string; // lien vers la boutique pour repasser commande
  ordersUrl: string;
}

export default function PaymentFailed({
  customerName = "Client",
  orderNumber = "PM-000001",
  storeName = "Ma Boutique",
  total = "5 000 FCFA",
  items = [{ title: "Produit exemple", quantity: 1, productUrl: "#" }],
  retryUrl = "https://pixel-mart-bj.com",
  ordersUrl = "https://pixel-mart-bj.com/orders",
}: PaymentFailedProps) {
  return (
    <Layout preview={`Paiement échoué — Commande ${orderNumber}`}>
      {/* Icône alerte */}
      <Section style={{ textAlign: "center" as const, marginBottom: "8px" }}>
        <Text style={styles.alertIcon}>⚠️</Text>
      </Section>

      <Text style={styles.heading}>Votre paiement n&apos;a pas abouti</Text>

      <Text style={styles.paragraph}>Bonjour {customerName},</Text>

      <Text style={styles.paragraph}>
        Votre paiement pour la commande <strong>{orderNumber}</strong> auprès de{" "}
        <strong>{storeName}</strong> d&apos;un montant de{" "}
        <strong>{total}</strong> n&apos;a pas pu être traité.
      </Text>

      <Text style={styles.paragraph}>
        Ne vous inquiétez pas — votre commande a été annulée et le stock a été
        libéré. Vous pouvez repasser votre commande à tout moment.
      </Text>

      {/* Articles commandés */}
      <Section style={styles.itemsBox}>
        <Text style={styles.sectionLabel}>
          Articles que vous souhaitiez commander
        </Text>
        {items.map((item, i) => (
          <Section key={i} style={styles.itemRow}>
            <Text style={styles.itemText}>
              <Link href={item.productUrl} style={styles.itemLink}>
                {item.title}
              </Link>
              {item.quantity > 1 && (
                <span style={styles.itemQty}> × {item.quantity}</span>
              )}
            </Text>
          </Section>
        ))}
      </Section>

      {/* CTA principal */}
      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={retryUrl}>Repasser ma commande</CTAButton>
      </Section>

      <Text style={styles.hint}>
        Si le problème persiste, vérifiez votre solde Mobile Money ou essayez un
        autre moyen de paiement.
      </Text>

      {/* Lien secondaire */}
      <Section style={{ textAlign: "center" as const, marginTop: "16px" }}>
        <Link href={ordersUrl} style={styles.secondaryLink}>
          Voir l&apos;historique de mes commandes
        </Link>
      </Section>
    </Layout>
  );
}

const styles = {
  alertIcon: {
    fontSize: "40px",
    margin: "0 0 4px 0",
  },
  heading: {
    fontFamily: emailTheme.fonts.heading,
    fontSize: "22px",
    fontWeight: "700" as const,
    color: "#b45309", // amber-700 — alerte sans être alarmiste
    textAlign: "center" as const,
    margin: "0 0 24px 0",
  },
  paragraph: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "15px",
    color: emailTheme.colors.foreground,
    lineHeight: "1.6",
    margin: "0 0 12px 0",
  },
  itemsBox: {
    backgroundColor: emailTheme.colors.background,
    borderRadius: emailTheme.borderRadius,
    padding: "16px 20px",
    marginTop: "20px",
    border: `1px solid ${emailTheme.colors.border}`,
  },
  sectionLabel: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "11px",
    color: emailTheme.colors.muted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    margin: "0 0 10px 0",
  },
  itemRow: {
    borderBottom: `1px solid ${emailTheme.colors.border}`,
    paddingBottom: "8px",
    marginBottom: "8px",
  },
  itemText: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "14px",
    color: emailTheme.colors.foreground,
    margin: "0",
  },
  itemLink: {
    color: emailTheme.colors.secondary,
    textDecoration: "underline",
  },
  itemQty: {
    color: emailTheme.colors.muted,
    fontSize: "13px",
  },
  hint: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.muted,
    lineHeight: "1.5",
    textAlign: "center" as const,
    margin: "24px 0 0 0",
  },
  secondaryLink: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.muted,
    textDecoration: "underline",
  },
};
