// filepath: src/components/admin/templates/AdminConfigTemplate.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Settings2, Pencil, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Hardcoded defaults (from convex/lib/constants.ts) ────────

export const CONFIG_DEFAULTS: ConfigEntry[] = [
  // Abonnements (prix en centimes XOF, 0 = gratuit)
  {
    key: "subscription_pro_price",
    label: "Prix abonnement Pro",
    defaultValue: 2900,
    group: "Abonnements",
    description: "Prix mensuel abonnement Pro — centimes XOF (2 900 = 2 900 XOF)",
    unit: "centimes",
  },
  {
    key: "subscription_business_price",
    label: "Prix abonnement Business",
    defaultValue: 9900,
    group: "Abonnements",
    description: "Prix mensuel abonnement Business — centimes XOF (9 900 = 9 900 XOF)",
    unit: "centimes",
  },
  {
    key: "subscription_free_max_products",
    label: "Produits max (Free)",
    defaultValue: 50,
    group: "Abonnements",
    description: "Nombre maximum de produits pour le plan gratuit",
    unit: "produits",
  },

  // Commissions (basis points — 500 bp = 5%)
  {
    key: "commission_free",
    label: "Commission Free (bp)",
    defaultValue: 500,
    group: "Commissions",
    description: "Taux pour les boutiques Free — 500 bp = 5%",
    unit: "bp",
  },
  {
    key: "commission_pro",
    label: "Commission Pro (bp)",
    defaultValue: 300,
    group: "Commissions",
    description: "Taux pour les boutiques Pro — 300 bp = 3%",
    unit: "bp",
  },
  {
    key: "commission_business",
    label: "Commission Business (bp)",
    defaultValue: 200,
    group: "Commissions",
    description: "Taux pour les boutiques Business — 200 bp = 2%",
    unit: "bp",
  },

  // Délais (ms)
  {
    key: "cancellation_window_ms",
    label: "Fenêtre d'annulation",
    defaultValue: 7200000,
    group: "Délais",
    description: "Délai d'annulation après paiement (ms) — défaut 2h",
    unit: "ms",
  },
  {
    key: "balance_release_delay_ms",
    label: "Délai libération solde",
    defaultValue: 172800000,
    group: "Délais",
    description: "Délai avant crédit solde vendeur (ms) — défaut 48h",
    unit: "ms",
  },
  {
    key: "storage_debt_block_delay_ms",
    label: "Délai blocage facture",
    defaultValue: 2592000000,
    group: "Délais",
    description: "Délai avant blocage retrait si facture impayée (ms) — défaut 30j",
    unit: "ms",
  },

  // Tarifs stockage (centimes XOF)
  {
    key: "storage_fee_per_unit",
    label: "Tarif unité (≤50)",
    defaultValue: 10000,
    group: "Stockage",
    description: "Coût par unité déposée jusqu'à 50 unités — 10 000 c = 100 XOF",
    unit: "centimes",
  },
  {
    key: "storage_fee_per_unit_bulk",
    label: "Tarif unité bulk (>50)",
    defaultValue: 6000,
    group: "Stockage",
    description: "Coût par unité au-delà de 50 — 6 000 c = 60 XOF",
    unit: "centimes",
  },
  {
    key: "storage_fee_bulk_threshold",
    label: "Seuil bulk (unités)",
    defaultValue: 50,
    group: "Stockage",
    description: "Nombre d'unités à partir duquel le tarif bulk s'applique",
    unit: "unités",
  },
  {
    key: "storage_fee_medium_kg_flat",
    label: "Forfait 5–25 kg",
    defaultValue: 500000,
    group: "Stockage",
    description: "Forfait poids 5–25 kg — 500 000 c = 5 000 XOF",
    unit: "centimes",
  },
  {
    key: "storage_fee_heavy_base",
    label: "Base >25 kg",
    defaultValue: 500000,
    group: "Stockage",
    description: "Base pour dépôts >25 kg — 500 000 c = 5 000 XOF",
    unit: "centimes",
  },
  {
    key: "storage_fee_heavy_per_kg",
    label: "Surcoût /kg >25 kg",
    defaultValue: 25000,
    group: "Stockage",
    description: "Tarif par kg supplémentaire au-delà de 25 kg — 25 000 c = 250 XOF",
    unit: "centimes",
  },
];

// ─── Types ────────────────────────────────────────────────────

type ConfigEntry = {
  key: string;
  label: string;
  defaultValue: number;
  group: string;
  description: string;
  unit: string;
};

type ConfigMap = Record<string, { value: number; label: string; updated_at: number }>;

interface Props {
  config: ConfigMap | undefined;
}

// ─── Config Row ───────────────────────────────────────────────

function ConfigRow({
  entry,
  currentValue,
  isOverridden,
}: {
  entry: ConfigEntry;
  currentValue: number;
  isOverridden: boolean;
}) {
  const upsert = useMutation(api.admin.mutations.upsertPlatformConfig);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(currentValue));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const num = Number(draft);
    if (isNaN(num) || num < 0) {
      setError("Valeur invalide");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsert({ key: entry.key, value: num, label: entry.label });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      await upsert({
        key: entry.key,
        value: entry.defaultValue,
        label: entry.label,
      });
      setDraft(String(entry.defaultValue));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{entry.label}</span>
          <span className="text-xs font-mono text-muted-foreground">
            {entry.key}
          </span>
          {isOverridden && (
            <Badge className="text-[10px] px-1 py-0 bg-orange-100 text-orange-700 border-orange-300">
              modifié
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
        {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {editing ? (
          <>
            <Input
              type="number"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-32 h-7 text-sm"
              autoFocus
            />
            <span className="text-xs text-muted-foreground">{entry.unit}</span>
            <Button
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleSave}
              disabled={loading}
            >
              <Check className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => {
                setEditing(false);
                setDraft(String(currentValue));
                setError(null);
              }}
            >
              <X className="size-3.5" />
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm font-mono font-semibold tabular-nums">
              {currentValue.toLocaleString("fr-FR")}
            </span>
            <span className="text-xs text-muted-foreground">{entry.unit}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => {
                setDraft(String(currentValue));
                setEditing(true);
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
            {isOverridden && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground"
                title={`Remettre à ${entry.defaultValue}`}
                onClick={handleReset}
                disabled={loading}
              >
                <RotateCcw className="size-3.5" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminConfigTemplate({ config }: Props) {
  // Group entries by group name
  const groups = CONFIG_DEFAULTS.reduce<Record<string, ConfigEntry[]>>(
    (acc, entry) => {
      if (!acc[entry.group]) acc[entry.group] = [];
      acc[entry.group].push(entry);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Configuration plateforme
          </h1>
          <p className="text-sm text-muted-foreground">
            Constantes éditables — les valeurs modifiées priment sur les défauts
            codés.
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-1 text-xs mt-1"
        >
          <Settings2 className="size-3" />
          {config ? Object.keys(config).length : 0} surchargée
          {Object.keys(config ?? {}).length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {Object.entries(groups).map(([group, entries]) => (
          <Card key={group}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">{group}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {entries.map((entry) => {
                const override = config?.[entry.key];
                const currentValue = override?.value ?? entry.defaultValue;
                const isOverridden = !!override;
                return (
                  <ConfigRow
                    key={entry.key}
                    entry={entry}
                    currentValue={currentValue}
                    isOverridden={isOverridden}
                  />
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
