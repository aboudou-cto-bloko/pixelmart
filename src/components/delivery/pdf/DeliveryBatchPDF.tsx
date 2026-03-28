// filepath: src/components/delivery/pdf/DeliveryBatchPDF.tsx

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Types ───────────────────────────────────────────────────

interface OrderForPDF {
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  address_line1: string;
  address_city: string;
  payment_mode: "online" | "cod";
  total_amount: number;
  delivery_fee: number;
  items_count: number;
  notes?: string;
}

interface BatchPDFData {
  batch_number: string;
  created_at: string;
  store_name: string;
  store_phone?: string;
  store_address?: string;
  zone_name?: string;
  orders: OrderForPDF[];
  total_delivery_fee: number;
  total_to_collect: number; // Total COD à collecter
  currency: string;
}

interface DeliveryBatchPDFProps {
  data: BatchPDFData;
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#444444",
    marginBottom: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  batchNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
  },
  date: {
    fontSize: 9,
    color: "#666666",
    marginTop: 4,
  },
  // Store info
  storeInfo: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
  },
  storeInfoRow: {
    flexDirection: "row",
    gap: 20,
  },
  storeLabel: {
    fontSize: 8,
    color: "#666666",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  storeValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  // Summary bar
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#000000",
    color: "#ffffff",
    borderRadius: 4,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#cccccc",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  // Orders table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#dddddd",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: "#444444",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  // Column widths
  colNum: { width: "12%" },
  colClient: { width: "25%" },
  colAddress: { width: "30%" },
  colItems: { width: "8%", textAlign: "center" },
  colPayment: { width: "25%", textAlign: "right" },
  // Cell styles
  orderNumber: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  clientName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 9,
    color: "#666666",
  },
  address: {
    fontSize: 9,
    lineHeight: 1.3,
  },
  itemsCount: {
    fontSize: 10,
    textAlign: "center",
  },
  amountPaid: {
    fontSize: 10,
    color: "#22c55e",
    fontFamily: "Helvetica-Bold",
  },
  amountCOD: {
    fontSize: 11,
    color: "#000000",
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#fef3c7",
    padding: 4,
    borderRadius: 2,
  },
  deliveryFee: {
    fontSize: 8,
    color: "#666666",
    marginTop: 2,
  },
  notes: {
    fontSize: 8,
    color: "#666666",
    fontStyle: "italic",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    borderTopStyle: "dashed",
  },
  // Footer totals
  totalsSection: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#000000",
    paddingTop: 15,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  totalsLabel: {
    fontSize: 10,
    width: 150,
    textAlign: "right",
    paddingRight: 15,
  },
  totalsValue: {
    fontSize: 10,
    width: 100,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  totalCollectRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 4,
  },
  totalCollectLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    width: 200,
    textAlign: "right",
    paddingRight: 15,
  },
  totalCollectValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    width: 100,
    textAlign: "right",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#888888",
  },
  // Signature section
  signatureSection: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 8,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#666666",
  },
});

// ─── Helpers ─────────────────────────────────────────────────

const NO_DECIMAL = ["XOF", "XAF", "GNF", "CDF"];
function formatPrice(amount: number, currency: string): string {
  const value = NO_DECIMAL.includes(currency) ? amount : Math.round(amount / 100);
  return `${value.toLocaleString("fr-FR")} ${currency}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ───────────────────────────────────────────────

export function DeliveryBatchPDF({ data }: DeliveryBatchPDFProps) {
  const codOrders = data.orders.filter((o) => o.payment_mode === "cod");
  const paidOrders = data.orders.filter((o) => o.payment_mode === "online");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Bon de Livraison</Text>
              <Text style={styles.subtitle}>{data.store_name}</Text>
              {data.store_phone && (
                <Text style={styles.subtitle}>Tél: {data.store_phone}</Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.batchNumber}>{data.batch_number}</Text>
              <Text style={styles.date}>{formatDate(data.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Store info */}
        <View style={styles.storeInfo}>
          <View style={styles.storeInfoRow}>
            <View>
              <Text style={styles.storeLabel}>Zone de livraison</Text>
              <Text style={styles.storeValue}>
                {data.zone_name ?? "Diverses"}
              </Text>
            </View>
            <View>
              <Text style={styles.storeLabel}>Nombre de commandes</Text>
              <Text style={styles.storeValue}>{data.orders.length}</Text>
            </View>
            <View>
              <Text style={styles.storeLabel}>À collecter (COD)</Text>
              <Text style={styles.storeValue}>{codOrders.length}</Text>
            </View>
            <View>
              <Text style={styles.storeLabel}>Déjà payées</Text>
              <Text style={styles.storeValue}>{paidOrders.length}</Text>
            </View>
          </View>
        </View>

        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Commandes</Text>
            <Text style={styles.summaryValue}>{data.orders.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Frais livraison</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(data.total_delivery_fee, data.currency)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total à collecter</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(data.total_to_collect, data.currency)}
            </Text>
          </View>
        </View>

        {/* Orders table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNum]}>N°</Text>
            <Text style={[styles.tableHeaderCell, styles.colClient]}>
              Client
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colAddress]}>
              Adresse
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colItems]}>Art.</Text>
            <Text style={[styles.tableHeaderCell, styles.colPayment]}>
              Paiement
            </Text>
          </View>

          {/* Rows */}
          {data.orders.map((order, index) => (
            <View
              key={order.order_number}
              style={[
                styles.tableRow,
                ...(index % 2 === 1 ? [styles.tableRowAlt] : []),
              ]}
            >
              {/* Order number */}
              <View style={styles.colNum}>
                <Text style={styles.orderNumber}>{order.order_number}</Text>
              </View>

              {/* Client */}
              <View style={styles.colClient}>
                <Text style={styles.clientName}>{order.customer_name}</Text>
                {order.customer_phone && (
                  <Text style={styles.clientPhone}>{order.customer_phone}</Text>
                )}
              </View>

              {/* Address */}
              <View style={styles.colAddress}>
                <Text style={styles.address}>
                  {order.address_line1}
                  {"\n"}
                  {order.address_city}
                </Text>
                {order.notes && (
                  <Text style={styles.notes}>Note: {order.notes}</Text>
                )}
              </View>

              {/* Items count */}
              <View style={styles.colItems}>
                <Text style={styles.itemsCount}>{order.items_count}</Text>
              </View>

              {/* Payment */}
              <View style={styles.colPayment}>
                {order.payment_mode === "cod" ? (
                  <Text style={styles.amountCOD}>
                    {formatPrice(order.total_amount, data.currency)}
                  </Text>
                ) : (
                  <Text style={styles.amountPaid}>✓ Payé</Text>
                )}
                <Text style={styles.deliveryFee}>
                  Livr: {formatPrice(order.delivery_fee, data.currency)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Frais de livraison total:</Text>
            <Text style={styles.totalsValue}>
              {formatPrice(data.total_delivery_fee, data.currency)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Commandes déjà payées:</Text>
            <Text style={styles.totalsValue}>{paidOrders.length}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Commandes COD:</Text>
            <Text style={styles.totalsValue}>{codOrders.length}</Text>
          </View>

          {/* Total to collect */}
          <View style={styles.totalCollectRow}>
            <Text style={styles.totalCollectLabel}>
              TOTAL À COLLECTER (COD):
            </Text>
            <Text style={styles.totalCollectValue}>
              {formatPrice(data.total_to_collect, data.currency)}
            </Text>
          </View>
        </View>

        {/* Signature section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature vendeur</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature livreur</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Généré par Pixel-Mart le{" "}
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Text style={styles.footerText}>Page 1/1</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Export types ────────────────────────────────────────────

export type { BatchPDFData, OrderForPDF };
