// filepath: emails/NewOrder.tsx

import { Text, Section, Row, Column, Hr } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface OrderItem {
  title: string;
  quantity: number;
  total_price: string;
  sku?: string;
}

interface NewOrderProps {
  vendorName: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: string;
  commission: string;
  netRevenue: string;
  shippingAddress: string;
  orderUrl: string;
}

export default function NewOrder({
  vendorName = "Vendeur",
  orderNumber = "PM-000001",
  customerName = "Client",
  items = [{ title: "Produit test", quantity: 1, total_price: "5 000 XOF" }],
  total = "5 000 XOF",
  commission = "250 XOF",
  netRevenue = "4 750 XOF",
  shippingAddress = "Cotonou, Bénin",
  orderUrl = "https://pixelmart.com/vendor/orders/123",
}: NewOrderProps) {
  return (
    <Layout preview={`Nouvelle commande ${orderNumber} — Pixel-Mart`}>
      <Text style={styles.heading}>Nouvelle commande !</Text>

      <Text style={styles.paragraph}>Bonjour {vendorName},</Text>

      <Text style={styles.paragraph}>
        Vous avez reçu une nouvelle commande <strong>{orderNumber}</strong> de{" "}
        <strong>{customerName}</strong>. Veuillez la traiter dès que possible.
      </Text>

      {/* Items */}
      <Section style={styles.table}>
        <Text style={styles.tableHeader}>Articles commandés</Text>
        {items.map((item, i) => (
          <Row key={i} style={styles.tableRow}>
            <Column style={styles.itemName}>
              {item.title} × {item.quantity}
              {item.sku && (
                <span
                  style={{ color: emailTheme.colors.muted, fontSize: "11px" }}
                >
                  {" "}
                  ({item.sku})
                </span>
              )}
            </Column>
            <Column style={styles.itemPrice}>{item.total_price}</Column>
          </Row>
        ))}
        <Hr style={styles.hr} />
        <Row style={styles.tableRow}>
          <Column style={styles.itemName}>Total commande</Column>
          <Column style={styles.itemPrice}>{total}</Column>
        </Row>
        <Row style={styles.tableRow}>
          <Column
            style={{ ...styles.itemName, color: emailTheme.colors.muted }}
          >
            Commission Pixel-Mart
          </Column>
          <Column
            style={{ ...styles.itemPrice, color: emailTheme.colors.muted }}
          >
            -{commission}
          </Column>
        </Row>
        <Row style={styles.tableRow}>
          <Column style={{ ...styles.itemName, fontWeight: "700" }}>
            Votre revenu net
          </Column>
          <Column
            style={{
              ...styles.itemPrice,
              fontWeight: "700",
              color: "#16a34a",
            }}
          >
            {netRevenue}
          </Column>
        </Row>
      </Section>

      {/* Shipping */}
      <Section style={{ marginTop: "20px" }}>
        <Text style={styles.detailLabel}>Livrer à</Text>
        <Text style={styles.detailValue}>{shippingAddress}</Text>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={orderUrl}>Traiter la commande</CTAButton>
      </Section>
    </Layout>
  );
}

const styles = {
  heading: {
    fontFamily: emailTheme.fonts.heading,
    fontSize: "24px",
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
  table: {
    backgroundColor: emailTheme.colors.background,
    borderRadius: emailTheme.borderRadius,
    padding: "16px",
    marginTop: "20px",
  },
  tableHeader: {
    fontFamily: emailTheme.fonts.heading,
    fontSize: "14px",
    fontWeight: "600" as const,
    color: emailTheme.colors.foreground,
    margin: "0 0 12px 0",
  },
  tableRow: { marginBottom: "8px" },
  itemName: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.foreground,
    paddingRight: "16px",
  },
  itemPrice: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.foreground,
    textAlign: "right" as const,
    whiteSpace: "nowrap" as const,
  },
  hr: { borderColor: emailTheme.colors.border, margin: "8px 0" },
  detailLabel: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "11px",
    color: emailTheme.colors.muted,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "12px 0 2px 0",
  },
  detailValue: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "14px",
    color: emailTheme.colors.foreground,
    margin: "0",
  },
};
