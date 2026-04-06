"use client";

// filepath: src/app/(vendor)/vendor/store/meta/page.tsx

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ExternalLink,
  Facebook,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  MousePointerClick,
  ShoppingCart,
  CreditCard,
  Package,
  BarChart2,
  TrendingUp,
  ServerCrash,
  Wifi,
} from "lucide-react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHOP_ROUTES } from "@/constants/routes";

// ─── Constants ────────────────────────────────────────────────

const ALL_META_EVENTS = [
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
] as const;

type MetaEventName = (typeof ALL_META_EVENTS)[number];

const META_EVENTS_CONFIG: Record<
  MetaEventName,
  { icon: React.ElementType; description: string; type: string }
> = {
  PageView: {
    icon: ShoppingBag,
    description: "Chaque visite d'une page de la boutique",
    type: "Client",
  },
  ViewContent: {
    icon: Eye,
    description: "Consultation d'une page produit",
    type: "Client",
  },
  AddToCart: {
    icon: ShoppingCart,
    description: "Ajout d'un article au panier",
    type: "Client",
  },
  InitiateCheckout: {
    icon: MousePointerClick,
    description: "Ouverture de la page de paiement",
    type: "Client",
  },
  Purchase: {
    icon: Package,
    description: "Confirmation de paiement (Webhook Moneroo)",
    type: "Serveur (CAPI)",
  },
};

type Period = "1d" | "7d" | "30d" | "90d" | "12m";

// ─── Funnel step bar ──────────────────────────────────────────

function FunnelStepBar({
  name,
  count,
  conversionRate,
  maxCount,
  enabled,
}: {
  name: MetaEventName;
  count: number;
  conversionRate: number;
  maxCount: number;
  enabled: boolean;
}) {
  const cfg = META_EVENTS_CONFIG[name];
  const Icon = cfg.icon;
  const widthPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

  return (
    <div className={`space-y-1.5 ${!enabled ? "opacity-40" : ""}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted-foreground" />
          <span className="font-medium">{name}</span>
          {!enabled && (
            <Badge variant="outline" className="text-[10px] py-0">
              désactivé
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-right">
          <span className="font-semibold tabular-nums">
            {count.toLocaleString("fr-FR")}
          </span>
          {name !== "PageView" && (
            <span className="text-muted-foreground text-xs w-12">
              {conversionRate}%
            </span>
          )}
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function VendorMetaSettingsPage() {
  const _router = useRouter();
  const store = useQuery(api.stores.queries.getMyStore, {});
  const updateMetaConfig = useMutation(api.meta.mutations.updateMetaConfig);
  const toggleMarketplaceVisibility = useMutation(
    api.stores.mutations.toggleMarketplaceVisibility,
  );

  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [testEventCode, setTestEventCode] = useState("");
  const [vendorShopEnabled, setVendorShopEnabled] = useState(false);
  const [hideFromMarketplace, setHideFromMarketplace] = useState(false);
  const [enabledEvents, setEnabledEvents] = useState<Set<string>>(
    new Set(ALL_META_EVENTS),
  );
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingShop, setIsTogglingShop] = useState(false);
  const [isTogglingMarketplace, setIsTogglingMarketplace] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<Period>("7d");

  // Analytics
  const funnelData = useQuery(api.analytics.queries.getMetaFunnel, {
    period: analyticsPeriod,
  });
  const capiStats = useQuery(api.analytics.queries.getCapiAckStats, {
    period: analyticsPeriod,
  });

  // Hydrater les champs depuis le store
  useEffect(() => {
    if (!store) return;
    setPixelId(store.meta_pixel_id ?? "");
    setAccessToken(store.meta_access_token ?? "");
    setTestEventCode(store.meta_test_event_code ?? "");
    setVendorShopEnabled(store.vendor_shop_enabled ?? false);
    setHideFromMarketplace(store.hide_from_marketplace ?? false);
    setEnabledEvents(
      new Set(
        store.meta_pixel_enabled_events &&
          store.meta_pixel_enabled_events.length > 0
          ? store.meta_pixel_enabled_events
          : ALL_META_EVENTS,
      ),
    );
  }, [store]);

  function toggleEvent(name: string) {
    setEnabledEvents((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  async function handleToggleMarketplace(hide: boolean) {
    if (isTogglingMarketplace) return;
    setHideFromMarketplace(hide);
    setIsTogglingMarketplace(true);
    try {
      await toggleMarketplaceVisibility({ hide });
    } catch (err) {
      setHideFromMarketplace(!hide);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
      );
    } finally {
      setIsTogglingMarketplace(false);
    }
  }

  async function handleToggleShop(enabled: boolean) {
    if (isTogglingShop) return;
    setVendorShopEnabled(enabled);
    setIsTogglingShop(true);
    try {
      await updateMetaConfig({ vendorShopEnabled: enabled });
    } catch (err) {
      setVendorShopEnabled(!enabled);
      setError(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
      );
    } finally {
      setIsTogglingShop(false);
    }
  }

  async function handleSave() {
    if (isSaving) return;
    setError(null);
    setIsSaving(true);
    try {
      await updateMetaConfig({
        pixelId: pixelId.trim() || undefined,
        accessToken: accessToken.trim() || undefined,
        testEventCode: testEventCode.trim() || undefined,
        enabledEvents: Array.from(enabledEvents),
        vendorShopEnabled,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (store === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pixel-mart-bj.com";
  const shopUrl = store ? `${siteUrl}/shop/${store.slug}` : "";

  const hasPixel = !!store?.meta_pixel_id;
  const maxFunnelCount =
    funnelData?.funnel && funnelData.funnel.length > 0
      ? Math.max(...funnelData.funnel.map((s) => s.count), 1)
      : 1;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Boutique vendeur & Meta Pixel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Activez votre vitrine personnalisée et connectez vos campagnes
          Facebook Ads.
        </p>
      </div>

      {/* ── Activation de la boutique ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="size-4" />
            Boutique vendeur
          </CardTitle>
          <CardDescription>
            Activez votre vitrine dédiée accessible via une URL publique sans
            branding Pixel-Mart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Activer la boutique</p>
              <p className="text-xs text-muted-foreground">
                Rend votre boutique accessible sur votre URL dédiée.
              </p>
            </div>
            <Switch
              checked={vendorShopEnabled}
              onCheckedChange={handleToggleShop}
              disabled={isTogglingShop}
            />
          </div>

          {store && vendorShopEnabled && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5">
              <code className="text-xs flex-1 truncate text-muted-foreground">
                {shopUrl}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                asChild
              >
                <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </div>
          )}

          {vendorShopEnabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <EyeOff className="size-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Masquer mes produits de la marketplace
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Vos produits restent visibles sur votre boutique personnelle
                    mais n&apos;apparaissent plus sur la marketplace Pixel-Mart.
                  </p>
                </div>
                <Switch
                  checked={hideFromMarketplace}
                  onCheckedChange={handleToggleMarketplace}
                  disabled={isTogglingMarketplace}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Config Meta Pixel ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Facebook className="size-4" />
            Configuration Meta Pixel
          </CardTitle>
          <CardDescription>
            Connectez votre Pixel Meta et l'API Conversions pour tracker les
            événements de vente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Pixel ID */}
          <div className="space-y-2">
            <Label htmlFor="pixelId">
              Pixel ID{" "}
              <span className="text-muted-foreground font-normal">
                (15-16 chiffres)
              </span>
            </Label>
            <Input
              id="pixelId"
              placeholder="1234567890123456"
              value={pixelId}
              onChange={(e) =>
                setPixelId(e.target.value.replace(/\D/g, "").slice(0, 16))
              }
              maxLength={16}
            />
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <Label htmlFor="accessToken">
              Token API Conversions{" "}
              <span className="text-muted-foreground font-normal">
                (Conversions API)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="accessToken"
                type={showToken ? "text" : "password"}
                placeholder="EAA..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowToken((v) => !v)}
              >
                {showToken ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Votre token est chiffré et ne sera jamais exposé côté client.
            </p>
          </div>

          {/* Test Event Code */}
          <div className="space-y-2">
            <Label htmlFor="testEventCode">
              Code d'événement test{" "}
              <span className="text-muted-foreground font-normal">
                (optionnel)
              </span>
            </Label>
            <Input
              id="testEventCode"
              placeholder="TEST12345"
              value={testEventCode}
              onChange={(e) => setTestEventCode(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Utiliser uniquement pour tester dans Meta Events Manager.
              Supprimer en production.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Événements trackés (toggles) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Événements à tracker</CardTitle>
          <CardDescription>
            Choisissez les événements que votre Pixel Meta doit envoyer à
            Facebook. Les modifications sont effectives après sauvegarde.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {ALL_META_EVENTS.map((name) => {
              const cfg = META_EVENTS_CONFIG[name];
              const Icon = cfg.icon;
              const isEnabled = enabledEvents.has(name);
              return (
                <div
                  key={name}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isEnabled ? "bg-blue-500/10" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`size-4 transition-colors ${
                        isEnabled ? "text-blue-500" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cfg.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={
                        cfg.type === "Serveur (CAPI)" ? "default" : "secondary"
                      }
                      className="text-[10px] hidden sm:flex"
                    >
                      {cfg.type}
                    </Badge>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => toggleEvent(name)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            <CreditCard className="size-3 inline mr-1" />
            L'événement <strong>Purchase</strong> est également envoyé côté
            serveur via l'API Conversions de Meta, indépendamment des bloqueurs
            de publicités.
          </p>
        </CardContent>
      </Card>

      {/* ── Sync CAPI ── */}
      {hasPixel && capiStats && capiStats.hasPixel && capiStats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="size-4" />
              Sync Facebook — Achats confirmés
            </CardTitle>
            <CardDescription>
              Chaque achat est envoyé à Meta via l&apos;API Conversions (côté
              serveur). Ce tableau indique si Facebook a bien reçu chaque
              événement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-green-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {capiStats.acked}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirmés
                </p>
              </div>
              <div
                className={`rounded-lg p-3 text-center ${capiStats.failed > 0 ? "bg-destructive/10" : "bg-muted/50"}`}
              >
                <p
                  className={`text-2xl font-bold ${capiStats.failed > 0 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {capiStats.failed}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Rejetés</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold text-muted-foreground">
                  {capiStats.pending}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  En attente
                </p>
              </div>
            </div>

            {capiStats.failed > 0 && (capiStats.errors ?? []).length > 0 && (
              <div className="space-y-1.5 mt-2">
                <p className="text-xs font-medium text-destructive flex items-center gap-1">
                  <ServerCrash className="size-3" />
                  Dernières erreurs Meta
                </p>
                {(capiStats.errors ?? []).map((e, i) => (
                  <div
                    key={i}
                    className="text-xs bg-destructive/5 rounded px-2 py-1.5 text-destructive/80 font-mono"
                  >
                    {new Date(e.occurredAt).toLocaleDateString("fr-FR")} —{" "}
                    {e.error}
                  </div>
                ))}
              </div>
            )}

            {capiStats.acked === capiStats.total && (
              <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                <CheckCircle2 className="size-4" />
                Tous les achats ont été reçus par Facebook.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Analytics Pixel ── */}
      {hasPixel && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="size-4" />
                  Données collectées
                </CardTitle>
                <CardDescription>
                  Événements enregistrés par votre Pixel{" "}
                  <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
                    {store?.meta_pixel_id}
                  </code>
                </CardDescription>
              </div>
              <Select
                value={analyticsPeriod}
                onValueChange={(v) => setAnalyticsPeriod(v as Period)}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Aujourd'hui</SelectItem>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                  <SelectItem value="12m">12 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {funnelData === undefined ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : !funnelData?.hasPixel || funnelData.funnel.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="size-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune donnée pour cette période.</p>
                <p className="text-xs mt-1">
                  Les événements apparaissent dès que votre boutique reçoit des
                  visites.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {funnelData.funnel.map((step) => (
                  <FunnelStepBar
                    key={step.name}
                    name={step.name as MetaEventName}
                    count={step.count}
                    conversionRate={step.conversionRate}
                    maxCount={maxFunnelCount}
                    enabled={enabledEvents.has(step.name)}
                  />
                ))}
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Le taux de conversion est calculé par rapport à l'étape
                  précédente. Les données de <strong>Purchase</strong> incluent
                  les événements côté serveur (CAPI).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Save ── */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
          {isSaving ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Sauvegarde…
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="size-4 mr-2 text-green-500" />
              Sauvegardé
            </>
          ) : (
            "Sauvegarder"
          )}
        </Button>
        {vendorShopEnabled && store && (
          <Button variant="outline" asChild>
            <a
              href={SHOP_ROUTES.HOME(store.slug)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4 mr-2" />
              Voir ma boutique
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
