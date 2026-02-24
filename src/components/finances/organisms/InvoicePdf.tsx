// filepath: src/components/finance/organisms/InvoicePdf.tsx

"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  brand: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#d4831a",
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  invoiceMeta: {
    fontSize: 9,
    color: "#737373",
    textAlign: "right",
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addressBlock: {
    width: "48%",
  },
  addressText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  colProduct: { width: "40%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "25%", textAlign: "right" },
  headerCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#737373",
    textTransform: "uppercase",
  },
  cell: {
    fontSize: 9,
  },
  // Totals
  totalsBlock: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 220,
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 9,
    color: "#737373",
    width: 120,
  },
  totalValue: {
    fontSize: 9,
    width: 100,
    textAlign: "right",
  },
  totalFinal: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    paddingTop: 6,
    marginTop: 4,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 7,
    color: "#a3a3a3",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e5e5",
    paddingTop: 8,
  },
});

// ─── Types ───────────────────────────────────────────────────

interface InvoiceItem {
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sku?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  createdAt: number;
  items: InvoiceItem[];
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  commissionAmount: number;
  currency: string;
  couponCode?: string;
  shippingAddress: {
    full_name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
    phone?: string;
  };
  store: {
    name: string;
    slug: string;
    country: string;
    // ── Collectés via UI, pas dans le schema ──
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    city?: string;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
  } | null;
}

// ─── Helpers ─────────────────────────────────────────────────

function fmt(centimes: number, currency: string): string {
  const value = centimes / 100;
  if (currency === "XOF") return `${value.toLocaleString("fr-FR")} FCFA`;
  return `${value.toFixed(2)} ${currency}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────

interface InvoicePdfProps {
  data: InvoiceData;
}

export function InvoicePdf({ data }: InvoicePdfProps) {
  const addr = data.shippingAddress;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Pixel-Mart</Text>
            <Text style={{ fontSize: 9, color: "#737373", marginTop: 2 }}>
              {data.store.name}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceMeta}>{data.invoiceNumber}</Text>
            <Text style={styles.invoiceMeta}>
              Date : {formatDate(data.createdAt)}
            </Text>
            <Text style={styles.invoiceMeta}>
              Commande : {data.orderNumber}
            </Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={[styles.section, styles.row]}>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionTitle}>Vendeur</Text>
            <Text style={styles.addressText}>{data.store.name}</Text>
            {data.store.address && (
              <Text style={styles.addressText}>{data.store.address}</Text>
            )}
            {data.store.city && (
              <Text style={styles.addressText}>
                {data.store.city}, {data.store.country}
              </Text>
            )}
            {data.store.contactEmail && (
              <Text style={styles.addressText}>{data.store.contactEmail}</Text>
            )}
            {data.store.contactPhone && (
              <Text style={styles.addressText}>{data.store.contactPhone}</Text>
            )}
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.sectionTitle}>Facturé à</Text>
            <Text style={styles.addressText}>{addr.full_name}</Text>
            <Text style={styles.addressText}>{addr.line1}</Text>
            {addr.line2 && <Text style={styles.addressText}>{addr.line2}</Text>}
            <Text style={styles.addressText}>
              {addr.city}
              {addr.state ? `, ${addr.state}` : ""}
              {addr.postal_code ? ` ${addr.postal_code}` : ""}
            </Text>
            <Text style={styles.addressText}>{addr.country}</Text>
            {addr.phone && <Text style={styles.addressText}>{addr.phone}</Text>}
            {data.customer?.email && (
              <Text style={styles.addressText}>{data.customer.email}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.colProduct]}>Produit</Text>
            <Text style={[styles.headerCell, styles.colQty]}>Qté</Text>
            <Text style={[styles.headerCell, styles.colPrice]}>Prix unit.</Text>
            <Text style={[styles.headerCell, styles.colTotal]}>Total</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colProduct}>
                <Text style={styles.cell}>{item.title}</Text>
                {item.sku && (
                  <Text style={{ fontSize: 7, color: "#a3a3a3" }}>
                    SKU: {item.sku}
                  </Text>
                )}
              </View>
              <Text style={[styles.cell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.cell, styles.colPrice]}>
                {fmt(item.unit_price, data.currency)}
              </Text>
              <Text style={[styles.cell, styles.colTotal]}>
                {fmt(item.total_price, data.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>
              {fmt(data.subtotal, data.currency)}
            </Text>
          </View>
          {data.shippingAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Livraison</Text>
              <Text style={styles.totalValue}>
                {fmt(data.shippingAmount, data.currency)}
              </Text>
            </View>
          )}
          {data.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Remise{data.couponCode ? ` (${data.couponCode})` : ""}
              </Text>
              <Text style={[styles.totalValue, { color: "#10b981" }]}>
                -{fmt(data.discountAmount, data.currency)}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.totalFinal]}>
            <Text
              style={[
                styles.totalLabel,
                { fontFamily: "Helvetica-Bold", fontSize: 12 },
              ]}
            >
              Total
            </Text>
            <Text
              style={[
                styles.totalValue,
                { fontFamily: "Helvetica-Bold", fontSize: 12 },
              ]}
            >
              {fmt(data.totalAmount, data.currency)}
            </Text>
          </View>
          {data.commissionAmount > 0 && (
            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text
                style={[styles.totalLabel, { fontSize: 8, color: "#a3a3a3" }]}
              >
                Commission Pixel-Mart
              </Text>
              <Text
                style={[styles.totalValue, { fontSize: 8, color: "#a3a3a3" }]}
              >
                -{fmt(data.commissionAmount, data.currency)}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Pixel-Mart — La marketplace africaine — Ce document est généré
          automatiquement et ne constitue pas une facture fiscale.
        </Text>
      </Page>
    </Document>
  );
}
