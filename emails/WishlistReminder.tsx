// filepath: emails/WishlistReminder.tsx

import { Text, Section, Link } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface WishlistItem {
  title: string;
  price: string;
  productUrl: string;
}

interface WishlistReminderProps {
  customerName: string;
  items: WishlistItem[];
  shopUrl: string; // lien vers la marketplace ou la boutique
}

export default function WishlistReminder({
  customerName = "Client",
  items = [{ title: "Produit exemple", price: "5 000 FCFA", productUrl: "#" }],
  shopUrl = "https://pixel-mart-bj.com",
}: WishlistReminderProps) {
  return (
    <Layout
      preview={`${items.length > 1 ? `${items.length} articles vous attendent` : `"${items[0].title}" vous attend`} dans votre liste de souhaits`}
    >
      <Section style={{ textAlign: "center" as const, marginBottom: "8px" }}>
        <Text style={styles.icon}>🛍️</Text>
      </Section>

      <Text style={styles.heading}>
        {items.length > 1
          ? "Vos articles favoris vous attendent"
          : `"${items[0].title}" vous attend`}
      </Text>

      <Text style={styles.paragraph}>Bonjour {customerName},</Text>

      <Text style={styles.paragraph}>
        Vous avez ajouté{" "}
        {items.length > 1 ? `${items.length} articles` : "un article"} à votre
        liste de souhaits il y a quelques jours. Les stocks peuvent changer —
        profitez-en avant qu&apos;il ne soit trop tard !
      </Text>

      {/* Liste des articles */}
      <Section style={styles.itemsBox}>
        <Text style={styles.sectionLabel}>
          Vos articles en liste de souhaits
        </Text>
        {items.map((item, i) => (
          <Section key={i} style={styles.itemRow}>
            <table width="100%" cellPadding={0} cellSpacing={0}>
              <tr>
                <td>
                  <Link href={item.productUrl} style={styles.itemLink}>
                    {item.title}
                  </Link>
                </td>
                <td style={{ textAlign: "right" as const }}>
                  <Text style={styles.itemPrice}>{item.price}</Text>
                </td>
              </tr>
            </table>
          </Section>
        ))}
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={shopUrl}>
          {items.length > 1 ? "Voir mes articles" : "Voir le produit"}
        </CTAButton>
      </Section>

      <Text style={styles.hint}>
        Vous pouvez gérer votre liste de souhaits depuis votre espace personnel.
        Pour ne plus recevoir ce type d&apos;email, consultez vos préférences de
        notification.
      </Text>
    </Layout>
  );
}

const styles = {
  icon: {
    fontSize: "40px",
    margin: "0 0 4px 0",
  },
  heading: {
    fontFamily: emailTheme.fonts.heading,
    fontSize: "22px",
    fontWeight: "700" as const,
    color: emailTheme.colors.foreground,
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
    margin: "0 0 12px 0",
  },
  itemRow: {
    borderBottom: `1px solid ${emailTheme.colors.border}`,
    paddingBottom: "10px",
    marginBottom: "10px",
  },
  itemLink: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "14px",
    color: emailTheme.colors.secondary,
    textDecoration: "underline",
  },
  itemPrice: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "14px",
    fontWeight: "600" as const,
    color: emailTheme.colors.primary,
    margin: "0",
    textAlign: "right" as const,
  },
  hint: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "12px",
    color: emailTheme.colors.muted,
    lineHeight: "1.5",
    textAlign: "center" as const,
    margin: "24px 0 0 0",
  },
};
