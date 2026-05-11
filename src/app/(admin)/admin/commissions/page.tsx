// filepath: src/app/(admin)/admin/commissions/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, ShoppingCart, Clock, CheckCircle2 } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";

type CommissionItem = {
  _id: string;
  order_number?: string;
  store_name?: string;
  collected_at: number;
  description: string;
  payment_mode: "online" | "cod";
  commission_rate: number;
  commission_amount: number;
  currency: string;
};

export default function AdminCommissionsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [paymentMode, setPaymentMode] = useState<"online" | "cod" | undefined>(
    undefined,
  );

  const stats = useQuery(api.admin.commissions.getCommissionStats, {
    period,
    paymentMode,
  });
  const commissions = useQuery(api.admin.commissions.listCommissions, {
    limit: 50,
    paymentMode,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Commissions Plateforme</h1>
        <p className="text-muted-foreground mt-2">
          Suivi des commissions perçues par la plateforme sur tous les modes de
          paiement
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as "7d" | "30d" | "90d")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={paymentMode ?? "all"}
          onValueChange={(v) =>
            setPaymentMode(v === "all" ? undefined : (v as "online" | "cod"))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modes</SelectItem>
            <SelectItem value="online">Paiement en ligne</SelectItem>
            <SelectItem value="cod">Paiement à la livraison</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commissions
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.totalCommissions, "XOF")}
              </div>
              <p className="text-xs text-muted-foreground">
                {period === "7d"
                  ? "7 derniers jours"
                  : period === "30d"
                    ? "30 derniers jours"
                    : "90 derniers jours"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalOrders.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                commandes avec commission
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Paiement en ligne
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.breakdown.online.total, "XOF")}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.breakdown.online.orders} commandes (
                {stats.breakdown.online.percentage.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Paiement à la livraison
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.breakdown.cod.total, "XOF")}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.breakdown.cod.orders} commandes (
                {stats.breakdown.cod.percentage.toFixed(1)}%)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Commissions Récentes</CardTitle>
          <CardDescription>
            Les 50 dernières commissions perçues par la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length > 0 ? (
            <div className="space-y-4">
              {(commissions as CommissionItem[]).map((commission) => (
                <div
                  key={commission._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      #{commission.order_number ?? "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {commission.store_name} •{" "}
                      {formatDate(commission.collected_at)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {commission.description}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-semibold">
                      {formatPrice(
                        commission.commission_amount,
                        commission.currency,
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          commission.payment_mode === "online"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {commission.payment_mode === "online"
                          ? "En ligne"
                          : "COD"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(commission.commission_rate / 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune commission trouvée pour la période sélectionnée
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
