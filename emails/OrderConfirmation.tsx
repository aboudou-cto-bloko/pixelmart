// filepath: emails/OrderConfirmation.tsx

import { Text, Section, Row, Column, Hr } from "@react-email/components";
import * as React from "react";
import { Layout, emailTheme } from "./components/Layout";
import { CTAButton } from "./components/CTAButton";

interface OrderItem {
  title: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface OrderConfirmationProps {
  customerName: string;
  orderNumber: string;
  storeName: string;
  items: OrderItem[];
  subtotal: string;
  discount?: string;
  shipping: string;
  total: string;
  shippingAddress: string;
  paymentMethod: string;
  orderUrl: string;
}

export default function OrderConfirmation({
  customerName = "Client",
  orderNumber = "PM-000001",
  storeName = "Ma Boutique",
  items = [
    {
      title: "Produit test",
      quantity: 1,
      unit_price: "5 000 XOF",
      total_price: "5 000 XOF",
    },
  ],
  subtotal = "5 000 XOF",
  discount,
  shipping = "Gratuite",
  total = "5 000 XOF",
  shippingAddress = "Cotonou, Bénin",
  paymentMethod = "MTN Mobile Money",
  orderUrl = "https://pixelmart.com/orders/123",
}: OrderConfirmationProps) {
  return (
    <Layout preview={`Commande ${orderNumber} confirmée — Pixel-Mart`}>
      <Text style={styles.heading}>Commande confirmée !</Text>

      <Text style={styles.paragraph}>Bonjour {customerName},</Text>

      <Text style={styles.paragraph}>
        Merci pour votre achat ! Votre commande <strong>{orderNumber}</strong>{" "}
        chez <strong>{storeName}</strong> a été confirmée.
      </Text>

      {/* Items */}
      <Section style={styles.table}>
        <Text style={styles.tableHeader}>Récapitulatif</Text>
        {items.map((item, i) => (
          <Row key={i} style={styles.tableRow}>
            <Column style={styles.itemName}>
              {item.title} × {item.quantity}
            </Column>
            <Column style={styles.itemPrice}>{item.total_price}</Column>
          </Row>
        ))}
        <Hr style={styles.hr} />
        <Row style={styles.tableRow}>
          <Column style={styles.itemName}>Sous-total</Column>
          <Column style={styles.itemPrice}>{subtotal}</Column>
        </Row>
        {discount && (
          <Row style={styles.tableRow}>
            <Column style={{ ...styles.itemName, color: "#16a34a" }}>
              Réduction
            </Column>
            <Column style={{ ...styles.itemPrice, color: "#16a34a" }}>
              -{discount}
            </Column>
          </Row>
        )}
        <Row style={styles.tableRow}>
          <Column style={styles.itemName}>Livraison</Column>
          <Column style={styles.itemPrice}>{shipping}</Column>
        </Row>
        <Hr style={styles.hr} />
        <Row style={styles.tableRow}>
          <Column style={{ ...styles.itemName, fontWeight: "700" }}>
            Total
          </Column>
          <Column
            style={{
              ...styles.itemPrice,
              fontWeight: "700",
              color: emailTheme.colors.primary,
            }}
          >
            {total}
          </Column>
        </Row>
      </Section>

      {/* Details */}
      <Section style={{ marginTop: "24px" }}>
        <Text style={styles.detailLabel}>Adresse de livraison</Text>
        <Text style={styles.detailValue}>{shippingAddress}</Text>

        <Text style={styles.detailLabel}>Méthode de paiement</Text>
        <Text style={styles.detailValue}>{paymentMethod}</Text>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: "center" as const, marginTop: "32px" }}>
        <CTAButton href={orderUrl}>Suivre ma commande</CTAButton>
      </Section>

      <Text style={styles.footer}>
        Le vendeur va préparer votre commande. Vous recevrez un email dès
        qu&apos;elle sera expédiée.
      </Text>
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
  tableRow: {
    marginBottom: "8px",
  },
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
  hr: {
    borderColor: emailTheme.colors.border,
    margin: "8px 0",
  },
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
  footer: {
    fontFamily: emailTheme.fonts.body,
    fontSize: "13px",
    color: emailTheme.colors.muted,
    textAlign: "center" as const,
    marginTop: "24px",
  },
};
