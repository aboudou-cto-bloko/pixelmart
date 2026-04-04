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
import { SHOP_ROUTES } from "@/constants/routes";

const META_EVENTS = [
  {
    icon: ShoppingBag,
    name: "PageView",
    description: "Chaque visite d'une page de la boutique",
    type: "Client",
  },
  {
    icon: Eye,
    name: "ViewContent",
    description: "Consultation d'une page produit",
    type: "Client",
  },
  {
    icon: ShoppingCart,
    name: "AddToCart",
    description: "Ajout d'un article au panier",
    type: "Client",
  },
  {
    icon: MousePointerClick,
    name: "InitiateCheckout",
    description: "Ouverture de la page de paiement",
    type: "Client",
  },
  {
    icon: Package,
    name: "Purchase",
    description: "Confirmation de paiement (Webhook Moneroo)",
    type: "Serveur (CAPI)",
  },
];

export default function VendorMetaSettingsPage() {
  const router = useRouter();
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
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingShop, setIsTogglingShop] = useState(false);
  const [isTogglingMarketplace, setIsTogglingMarketplace] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrater les champs depuis le store
  useEffect(() => {
    if (!store) return;
    setPixelId(store.meta_pixel_id ?? "");
    setAccessToken(store.meta_access_token ?? "");
    setTestEventCode(store.meta_test_event_code ?? "");
    setVendorShopEnabled(store.vendor_shop_enabled ?? false);
    setHideFromMarketplace(store.hide_from_marketplace ?? false);
  }, [store]);

  async function handleToggleMarketplace(hide: boolean) {
    if (isTogglingMarketplace) return;
    setHideFromMarketplace(hide);
    setIsTogglingMarketplace(true);
    try {
      await toggleMarketplaceVisibility({ hide });
    } catch (err) {
      setHideFromMarketplace(!hide); // rollback
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
      setVendorShopEnabled(!enabled); // rollback
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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Boutique vendeur & Meta Pixel</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Activez votre vitrine personnalisée et connectez vos campagnes
          Facebook Ads.
        </p>
      </div>

      {/* Activation de la boutique */}
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

      {/* Config Meta Pixel */}
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

      {/* Événements trackés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Événements trackés</CardTitle>
          <CardDescription>
            Ces événements sont automatiquement envoyés à Meta lorsque votre
            boutique est active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {META_EVENTS.map((event) => {
              const Icon = event.icon;
              return (
                <div
                  key={event.name}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                  <Badge
                    variant={
                      event.type === "Serveur (CAPI)" ? "default" : "secondary"
                    }
                    className="text-[10px] shrink-0"
                  >
                    {event.type}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Save */}
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
