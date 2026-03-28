"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import Image from "next/image";
import { z } from "zod";
import {
  Loader2,
  Save,
  Store,
  Upload,
  X,
  Palette,
  Globe,
  ImageIcon,
  Truck,
  MapPin,
  AlertTriangle,
  Info,
} from "lucide-react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SUPPORTED_COUNTRIES } from "@/constants/countries";
import { SUBSCRIPTION_PLANS } from "@/constants/subscriptionPlans";
import { formatPrice } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  LocationPicker,
  type PickedLocation,
} from "@/components/maps/LocationPicker";
import { PIXELMART_WAREHOUSE } from "@/constants/pickup";
import {
  storeSettingsSchema,
  deliverySettingsSchema,
  validateImageFile,
  getSafeSettingsErrorMessage,
  RateLimiter,
} from "@/lib/validation/store-settings";

export default function StoreSettingsPage() {
  const store = useQuery(api.stores.queries.getMyStore);
  const hasPendingOrders = useQuery(api.stores.queries.hasPendingOrders);
  const updateStore = useMutation(api.stores.mutations.updateStore);
  const updateDeliverySettings = useMutation(
    api.stores.mutations.updateDeliverySettings,
  );
  const generateUploadUrl = useMutation(api.stores.mutations.generateUploadUrl);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1"); // renommé
  const [country, setCountry] = useState("BJ");
  const [currency, setCurrency] = useState("XOF");
  const [logoStorageId, setLogoStorageId] = useState<string | undefined>();
  const [bannerStorageId, setBannerStorageId] = useState<string | undefined>();

  const logoUrl = useQuery(
    api.files.queries.getUrl,
    logoStorageId ? { storageId: logoStorageId } : "skip",
  );
  const bannerUrl = useQuery(
    api.files.queries.getUrl,
    bannerStorageId ? { storageId: bannerStorageId } : "skip",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contact
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWebsite, setContactWebsite] = useState("");
  const [contactFacebook, setContactFacebook] = useState("");
  const [contactInstagram, setContactInstagram] = useState("");

  // Delivery settings
  const [usePixelmartService, setUsePixelmartService] = useState(true);
  const [customPickup, setCustomPickup] = useState<
    PickedLocation | undefined
  >();
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Pré-remplir
  useEffect(() => {
    if (store) {
      setName(store.name);
      setDescription(store.description ?? "");
      setPrimaryColor(store.primary_color ?? "#6366f1");
      setCountry(store.country);
      setCurrency(store.currency);
      setLogoStorageId(store.logo_url);
      setBannerStorageId(store.banner_url);

      setContactPhone(store.contact_phone ?? "");
      setContactWhatsapp(store.contact_whatsapp ?? "");
      setContactEmail(store.contact_email ?? "");
      setContactWebsite(store.contact_website ?? "");
      setContactFacebook(store.contact_facebook ?? "");
      setContactInstagram(store.contact_instagram ?? "");

      setUsePixelmartService(store.use_pixelmart_service ?? true);
      const hasCustomPickup =
        store.custom_pickup_lat !== undefined &&
        store.custom_pickup_lon !== undefined &&
        !!store.custom_pickup_label;
      if (hasCustomPickup) {
        setCustomPickup({
          lat: store.custom_pickup_lat!,
          lon: store.custom_pickup_lon!,
          label: store.custom_pickup_label!,
        });
      }
    }
  }, [store]);

  async function handleUpload(file: File, type: "logo" | "banner") {
    const setUploading =
      type === "logo" ? setIsUploadingLogo : setIsUploadingBanner;
    const setStorageId =
      type === "logo" ? setLogoStorageId : setBannerStorageId;

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await response.json();
      setStorageId(storageId as string);
    } catch (err) {
      setError("Erreur lors de l'upload de l'image");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateStore({
        name: name.trim(),
        description: description.trim(),
        primary_color: primaryColor,
        country,
        currency,
        logo_url: logoStorageId,
        banner_url: bannerStorageId,
        contact_phone: contactPhone.trim(),
        contact_whatsapp: contactWhatsapp.trim(),
        contact_email: contactEmail.trim(),
        contact_website: contactWebsite.trim(),
        contact_facebook: contactFacebook.trim(),
        contact_instagram: contactInstagram.trim(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveDelivery() {
    setIsSavingDelivery(true);
    setDeliveryError(null);
    setDeliverySuccess(false);
    try {
      await updateDeliverySettings({
        use_pixelmart_service: usePixelmartService,
        custom_pickup_lat: !usePixelmartService ? customPickup?.lat : undefined,
        custom_pickup_lon: !usePixelmartService ? customPickup?.lon : undefined,
        custom_pickup_label: !usePixelmartService
          ? customPickup?.label
          : undefined,
      });
      setDeliverySuccess(true);
      setTimeout(() => setDeliverySuccess(false), 3000);
    } catch (err) {
      setDeliveryError(
        err instanceof Error ? err.message : "Erreur de sauvegarde",
      );
    } finally {
      setIsSavingDelivery(false);
    }
  }

  if (store === undefined) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  if (store === null) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-bold mb-2">Boutique introuvable</h1>
      </div>
    );
  }

  const plan =
    SUBSCRIPTION_PLANS[
      store.subscription_tier as keyof typeof SUBSCRIPTION_PLANS
    ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres boutique</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalisez l&apos;apparence et les informations de votre boutique
        </p>
      </div>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="size-4" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="store-name">Nom de la boutique</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ma super boutique"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL : /stores/{store.slug}
            </p>
          </div>

          <div>
            <Label htmlFor="store-desc">Description</Label>
            <Textarea
              id="store-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre boutique en quelques lignes…"
              rows={4}
              maxLength={2000}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {description.length}/2000
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="size-4" />
            Images
          </CardTitle>
          <CardDescription>
            Le logo et la bannière apparaissent sur votre vitrine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo */}
          <div>
            <Label className="mb-2 block">Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative size-20 rounded-xl bg-muted overflow-hidden border flex items-center justify-center">
                {logoUrl ? (
                  <Image
                    src={logoUrl ?? ""}
                    alt="Logo"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <Store className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, "logo");
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="size-3.5 mr-2 animate-spin" />
                  ) : (
                    <Upload className="size-3.5 mr-2" />
                  )}
                  {logoStorageId ? "Changer" : "Ajouter"}
                </Button>
                {logoStorageId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setLogoStorageId(undefined)}
                  >
                    <X className="size-3.5 mr-1" />
                    Retirer
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Banner */}
          <div>
            <Label className="mb-2 block">Bannière</Label>
            <div className="space-y-3">
              <div className="relative h-32 w-full rounded-xl bg-muted overflow-hidden border flex items-center justify-center">
                {bannerUrl ? (
                  <Image
                    src={bannerUrl ?? ""}
                    alt="Bannière"
                    fill
                    sizes="600px"
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex gap-2">
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, "banner");
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                >
                  {isUploadingBanner ? (
                    <Loader2 className="size-3.5 mr-2 animate-spin" />
                  ) : (
                    <Upload className="size-3.5 mr-2" />
                  )}
                  {bannerStorageId ? "Changer" : "Ajouter"}
                </Button>
                {bannerStorageId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setBannerStorageId(undefined)}
                  >
                    <X className="size-3.5 mr-1" />
                    Retirer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery & Pickup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="size-4" />
            Livraison & Point de retrait
          </CardTitle>
          <CardDescription>
            Définissez comment vos clients récupèrent leurs commandes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Pending orders lock */}
          {hasPendingOrders && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-yellow-600" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Vous avez des commandes en cours. Ces paramètres seront
                modifiables une fois toutes les commandes terminées ou annulées.
              </p>
            </div>
          )}

          {/* Toggle */}
          <div
            className={`flex items-start justify-between gap-4 ${hasPendingOrders ? "opacity-50 pointer-events-none select-none" : ""}`}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Utiliser le service Pixel-Mart
              </p>
              <p className="text-xs text-muted-foreground">
                Activé : vos produits sont stockés et expédiés depuis notre
                entrepôt ({PIXELMART_WAREHOUSE.label}).
                <br />
                Désactivé : vous gérez vous-même le stockage et définissez votre
                propre point de retrait.
              </p>
            </div>
            <Switch
              checked={usePixelmartService}
              onCheckedChange={(val) => {
                setUsePixelmartService(val);
                if (val) setCustomPickup(undefined);
              }}
              disabled={!!hasPendingOrders}
            />
          </div>

          {/* Custom pickup map — shown only when service is OFF */}
          {!usePixelmartService && !hasPendingOrders && (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <p className="text-sm font-medium">
                  Votre point de retrait{" "}
                  <span className="text-destructive">*</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Cliquez sur la carte ou recherchez votre adresse pour définir
                votre point de retrait.
              </p>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="size-4 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">
                    💡 Conseil pour la localisation
                  </p>
                  <p>
                    La géolocalisation automatique ("Ma position") peut parfois
                    être imprécise sur ordinateur. Si vous remarquez que votre
                    position n'est pas correcte, essayez de passer sur mobile
                    avant de sauvegarder, ou utilisez la recherche d'adresse
                    pour une meilleure précision.
                  </p>
                </div>
              </div>
              <LocationPicker
                value={customPickup}
                onChange={setCustomPickup}
                height={300}
              />
              {!customPickup && (
                <p className="text-xs text-destructive font-medium">
                  ⚠ Adresse obligatoire — vous ne pourrez pas sauvegarder sans
                  définir votre point de retrait.
                </p>
              )}
            </div>
          )}

          {/* Read-only display when service is ON */}
          {usePixelmartService && (
            <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2">
              <MapPin className="size-4 shrink-0 mt-0.5 text-primary" />
              <p className="text-xs text-muted-foreground">
                {PIXELMART_WAREHOUSE.label}
              </p>
            </div>
          )}

          {/* Save delivery */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              onClick={handleSaveDelivery}
              disabled={
                isSavingDelivery ||
                !!hasPendingOrders ||
                (!usePixelmartService && !customPickup)
              }
              size="sm"
            >
              {isSavingDelivery ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Enregistrer la livraison
            </Button>
            {deliverySuccess && (
              <p className="text-sm text-green-600">Livraison mise à jour ✓</p>
            )}
            {deliveryError && (
              <p className="text-sm text-destructive">{deliveryError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="size-4" />
            Apparence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="theme-color">Couleur principale</Label>
            <div className="flex items-center gap-3 mt-1">
              <input
                id="theme-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="size-10 rounded-lg border cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#6366f1"
                className="w-32 font-mono text-sm"
              />
              <div
                className="size-10 rounded-lg border"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Region */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="size-4" />
            Région
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Pays</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Devise</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="USD">USD (Dollar US)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscription (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abonnement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan actuel</span>
            <Badge variant="outline" className="capitalize">
              {plan?.name ?? store.subscription_tier}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commission</span>
            <span>{(store.commission_rate / 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Solde disponible</span>
            <span className="font-medium">
              {formatPrice(store.balance, "XOF")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">En attente</span>
            <span className="text-yellow-600">
              {formatPrice(store.pending_balance, "XOF")}
            </span>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Pour changer de plan, contactez le support.
          </p>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de contact</CardTitle>
          <p className="text-sm text-muted-foreground">
            Affichées sur votre boutique pour que les clients puissent vous
            joindre.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Téléphone</Label>
              <Input
                id="contact_phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+22961234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_whatsapp">WhatsApp</Label>
              <Input
                id="contact_whatsapp"
                value={contactWhatsapp}
                onChange={(e) => setContactWhatsapp(e.target.value)}
                placeholder="+22961234567"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email de contact</Label>
              <Input
                id="contact_email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@maboutique.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_website">Site web</Label>
              <Input
                id="contact_website"
                value={contactWebsite}
                onChange={(e) => setContactWebsite(e.target.value)}
                placeholder="https://maboutique.com"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact_facebook">Facebook</Label>
              <Input
                id="contact_facebook"
                value={contactFacebook}
                onChange={(e) => setContactFacebook(e.target.value)}
                placeholder="https://facebook.com/maboutique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_instagram">Instagram</Label>
              <Input
                id="contact_instagram"
                value={contactInstagram}
                onChange={(e) => setContactInstagram(e.target.value)}
                placeholder="@maboutique"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Enregistrer les modifications
        </Button>
        {success && (
          <p className="text-sm text-green-600">Boutique mise à jour</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
