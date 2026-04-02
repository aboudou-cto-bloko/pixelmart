"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Info, Package, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export default function VendorTarifsPage() {
  const commissions = useQuery(api.stores.queries.getPublicCommissionRates);
  const storageFees = useQuery(api.stores.queries.getPublicStorageFees);

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-2xl font-bold">Grilles tarifaires</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tarifs appliqués en temps réel sur la plateforme — mis à jour sans
          redéploiement.
        </p>
      </div>

      {/* Commissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" />
            Commissions Pixel-Mart
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Calculée sur le sous-total produits (hors frais de livraison).
          </p>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {[
              { tier: "Gratuit", key: "free", color: "secondary" },
              { tier: "Pro", key: "pro", color: "default" },
              { tier: "Business", key: "business", color: "default" },
            ].map(({ tier, key, color }) => (
              <div key={key} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Badge variant={color as "default" | "secondary"}>
                    {tier}
                  </Badge>
                </div>
                <span className="font-semibold text-sm">
                  {commissions
                    ? `${commissions[key as "free" | "pro" | "business"]}%`
                    : "—"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
            <Info className="size-3.5 shrink-0 mt-0.5" />
            <span>
              Formule&nbsp;:{" "}
              <strong>commission = (sous-total − remise) × taux</strong>. Les
              frais de livraison ne sont pas inclus dans la base de calcul.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Frais de stockage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4 text-primary" />
            Frais de stockage entrepôt
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Facturés à la validation de votre demande de stockage.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Par unité */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Tarification à l&apos;unité
            </p>
            <div className="divide-y rounded-lg border overflow-hidden">
              <div className="flex justify-between px-4 py-2.5 bg-background text-sm">
                <span className="text-muted-foreground">
                  ≤ {storageFees?.BULK_THRESHOLD_UNITS ?? 50} unités
                </span>
                <span className="font-medium">
                  {storageFees ? formatPrice(storageFees.PER_UNIT, "XOF") : "—"}{" "}
                  / unité
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5 bg-muted/30 text-sm">
                <span className="text-muted-foreground">
                  &gt; {storageFees?.BULK_THRESHOLD_UNITS ?? 50} unités (bulk)
                </span>
                <span className="font-medium">
                  {storageFees
                    ? formatPrice(storageFees.PER_UNIT_BULK, "XOF")
                    : "—"}{" "}
                  / unité
                </span>
              </div>
            </div>
          </div>

          {/* Par poids */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Tarification au poids
            </p>
            <div className="divide-y rounded-lg border overflow-hidden">
              <div className="flex justify-between px-4 py-2.5 bg-background text-sm">
                <span className="text-muted-foreground">
                  0 – {storageFees?.FREE_MAX_KG ?? 5} kg
                </span>
                <span className="font-medium text-green-600">Inclus</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 bg-muted/30 text-sm">
                <span className="text-muted-foreground">
                  {storageFees?.FREE_MAX_KG ?? 5} –{" "}
                  {storageFees?.MEDIUM_MAX_KG ?? 25} kg
                </span>
                <span className="font-medium">
                  {storageFees
                    ? formatPrice(storageFees.MEDIUM_KG_FLAT, "XOF")
                    : "—"}{" "}
                  forfait
                </span>
              </div>
              <div className="flex justify-between px-4 py-2.5 bg-background text-sm">
                <span className="text-muted-foreground">
                  &gt; {storageFees?.MEDIUM_MAX_KG ?? 25} kg
                </span>
                <span className="font-medium">
                  {storageFees
                    ? `${formatPrice(storageFees.HEAVY_BASE, "XOF")} + ${formatPrice(storageFees.HEAVY_PER_KG, "XOF")}/kg sup.`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
