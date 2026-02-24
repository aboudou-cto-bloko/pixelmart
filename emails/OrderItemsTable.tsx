// filepath: emails/components/OrderItemsTable.tsx

import { Section, Text, Row, Column, Img } from "@react-email/components";
import * as React from "react";
import { emailTheme } from "./components/Layout";

interface OrderItem {
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string;
}

interface OrderItemsTableProps {
  items: OrderItem[];
  currency: string;
  totalAmount: number;
}

function fmt(centimes: number, currency: string): string {
  const value = centimes / 100;
  if (currency === "XOF") return `${value.toLocaleString("fr-FR")} FCFA`;
  return `${value.toFixed(2)} ${currency}`;
}

export function OrderItemsTable({
  items,
  currency,
  totalAmount,
}: OrderItemsTableProps) {
  return (
    <Section>
      {items.map((item, i) => (
        <Row key={i} style={{ marginBottom: "12px" }}>
          <Column style={{ width: "48px", verticalAlign: "top" }}>
            <Img
              src={item.image_url}
              width="44"
              height="44"
              alt={item.title}
              style={{
                borderRadius: "6px",
                objectFit: "cover" as const,
              }}
            />
          </Column>
          <Column style={{ paddingLeft: "12px", verticalAlign: "top" }}>
            <Text
              style={{
                fontSize: "14px",
                fontFamily: emailTheme.fonts.body,
                color: emailTheme.colors.foreground,
                margin: "0",
                fontWeight: "500",
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: "12px",
                fontFamily: emailTheme.fonts.body,
                color: emailTheme.colors.muted,
                margin: "2px 0 0 0",
              }}
            >
              {item.quantity} × {fmt(item.unit_price, currency)}
            </Text>
          </Column>
          <Column
            style={{
              textAlign: "right" as const,
              verticalAlign: "top",
              width: "100px",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                fontFamily: emailTheme.fonts.body,
                color: emailTheme.colors.foreground,
                margin: "0",
                fontWeight: "600",
              }}
            >
              {fmt(item.total_price, currency)}
            </Text>
          </Column>
        </Row>
      ))}

      {/* Total */}
      <Section
        style={{
          borderTop: `1px solid ${emailTheme.colors.border}`,
          marginTop: "12px",
          paddingTop: "12px",
        }}
      >
        <Row>
          <Column>
            <Text
              style={{
                fontSize: "16px",
                fontFamily: emailTheme.fonts.heading,
                fontWeight: "700",
                color: emailTheme.colors.foreground,
                margin: "0",
              }}
            >
              Total
            </Text>
          </Column>
          <Column style={{ textAlign: "right" as const }}>
            <Text
              style={{
                fontSize: "16px",
                fontFamily: emailTheme.fonts.heading,
                fontWeight: "700",
                color: emailTheme.colors.primary,
                margin: "0",
              }}
            >
              {fmt(totalAmount, currency)}
            </Text>
          </Column>
        </Row>
      </Section>
    </Section>
  );
}
