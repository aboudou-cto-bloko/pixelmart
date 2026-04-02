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
  Package,
  Check,
  Info,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
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
  type StoreSettingsData,
  type DeliverySettingsData,
} from "@/lib/validation/store-settings";

export default function StoreSettingsPage() {
  const store = useQuery(api.stores.queries.getMyStore);
  const hasPendingOrders = useQuery(api.stores.queries.hasPendingOrders);
  const commissionRates = useQuery(api.stores.queries.getPublicCommissionRates);
  const updateStore = useMutation(api.stores.mutations.updateStore);
  const updateDeliverySettings = useMutation(
    api.stores.mutations.updateDeliverySettings,
  );
  const generateUploadUrl = useMutation(api.stores.mutations.generateUploadUrl);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [country, setCountry] = useState("BJ");
  const [currency, setCurrency] = useState("XOF");
  const [logoStorageId, setLogoStorageId] = useState<string | undefined>();
  const [bannerStorageId, setBannerStorageId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Delivery settings — tri-state
  type ServiceMode = "full" | "delivery_only" | "none";
  const [serviceMode, setServiceMode] = useState<ServiceMode>("full");
  const [customPickup, setCustomPickup] = useState<
    PickedLocation | undefined
  >();
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Helper function to clear field errors
  function clearFieldError(fieldName: string) {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  }

  // Obtenir les URLs à partir des storageIds
  const logoImageUrl = useQuery(
    api.files.queries.getUrl,
    logoStorageId ? { storageId: logoStorageId } : "skip",
  );
  const bannerImageUrl = useQuery(
    api.files.queries.getUrl,
    bannerStorageId ? { storageId: bannerStorageId } : "skip",
  );

  // Pré-remplir
  useEffect(() => {
    if (store) {
      setName(store.name);
      setDescription(store.description ?? "");
      setPrimaryColor(store.primary_color ?? "#6366f1");
      setCountry(store.country);
      setCurrency(store.currency);
      setLogoStorageId(store.logo_url); // store.logo_url est le storageId
      setBannerStorageId(store.banner_url);

      // Delivery settings — derive tri-state from DB fields
      const usePM = store.use_pixelmart_service ?? true;
      const hasSP = store.has_storage_plan ?? usePM;
      if (!usePM) {
        setServiceMode("none");
      } else if (usePM && !hasSP) {
        setServiceMode("delivery_only");
      } else {
        setServiceMode("full");
      }
      const isDeliveryOnly = usePM && !hasSP;
      if (
        isDeliveryOnly &&
        store.custom_pickup_lat !== undefined &&
        store.custom_pickup_lon !== undefined &&
        store.custom_pickup_label
      ) {
        setCustomPickup({
          lat: store.custom_pickup_lat,
          lon: store.custom_pickup_lon,
          label: store.custom_pickup_label,
        });
      } else {
        setCustomPickup(undefined);
      }
    }
  }, [store]);

  async function handleUpload(file: File, type: "logo" | "banner") {
    const setUploading =
      type === "logo" ? setIsUploadingLogo : setIsUploadingBanner;
    const setStorageId =
      type === "logo" ? setLogoStorageId : setBannerStorageId;

    // Rate limiting check
    const rateLimit = RateLimiter.checkRateLimit(`upload-${type}`, 5000); // 5 second cooldown
    if (!rateLimit.allowed) {
      setError(
        `Veuillez attendre ${RateLimiter.formatRemainingTime(rateLimit.remainingTime!)} avant d'uploader à nouveau`,
      );
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Validate file before upload
      const validation = await validateImageFile(file);
      if (!validation.isValid) {
        setError(validation.error!);
        return;
      }

      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.storageId) {
        throw new Error("Invalid upload response");
      }

      const newStorageId = result.storageId as string;
      setStorageId(newStorageId);

      // Auto-save immediately so the tutorial step is marked done
      await updateStore({
        name,
        description: description || undefined,
        primary_color: primaryColor,
        country,
        currency,
        logo_url: type === "logo" ? newStorageId : logoStorageId,
        banner_url: type === "banner" ? newStorageId : bannerStorageId,
      });
    } catch (err) {
      setError(getSafeSettingsErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDelivery() {
    // Rate limiting check
    const rateLimit = RateLimiter.checkRateLimit("save-delivery", 3000); // 3 second cooldown
    if (!rateLimit.allowed) {
      setDeliveryError(
        `Veuillez attendre ${RateLimiter.formatRemainingTime(rateLimit.remainingTime!)} avant de sauvegarder à nouveau`,
      );
      return;
    }

    setIsSavingDelivery(true);
    setDeliveryError(null);
    setDeliverySuccess(false);

    try {
      // Validate delivery settings
      const deliveryData: DeliverySettingsData = {
        use_pixelmart_service: serviceMode !== "none",
        has_storage_plan: serviceMode === "full",
        custom_pickup_lat:
          serviceMode === "delivery_only" ? customPickup?.lat : undefined,
        custom_pickup_lon:
          serviceMode === "delivery_only" ? customPickup?.lon : undefined,
        custom_pickup_label:
          serviceMode === "delivery_only" ? customPickup?.label : undefined,
      };

      const validatedData = deliverySettingsSchema.parse(deliveryData);

      await updateDeliverySettings(validatedData);

      setDeliverySuccess(true);
      setTimeout(() => setDeliverySuccess(false), 3000);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.issues[0];
        setDeliveryError(
          firstError?.message || "Données de livraison invalides",
        );
      } else {
        setDeliveryError(getSafeSettingsErrorMessage(err));
      }
    } finally {
      setIsSavingDelivery(false);
    }
  }

  async function handleSave() {
    // Rate limiting check
    const rateLimit = RateLimiter.checkRateLimit("save-settings", 3000); // 3 second cooldown
    if (!rateLimit.allowed) {
      setError(
        `Veuillez attendre ${RateLimiter.formatRemainingTime(rateLimit.remainingTime!)} avant de sauvegarder à nouveau`,
      );
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    try {
      // Client-side validation
      const validatedData = storeSettingsSchema.parse({
        name,
        description,
        primaryColor,
        country,
        currency,
      });

      await updateStore({
        name: validatedData.name,
        description: validatedData.description || undefined,
        primary_color: validatedData.primaryColor,
        country: validatedData.country,
        currency: validatedData.currency,
        logo_url: logoStorageId,
        banner_url: bannerStorageId,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Handle validation errors
        const newFieldErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          if (field && !newFieldErrors[field]) {
            newFieldErrors[field] = issue.message;
          }
        });
        setFieldErrors(newFieldErrors);
        setError("Veuillez corriger les erreurs ci-dessous");
      } else {
        setError(getSafeSettingsErrorMessage(err));
      }
    } finally {
      setIsSaving(false);
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
            <Label htmlFor="store-name">Nom de la boutique *</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
              placeholder="Ma super boutique"
              className={`mt-1 ${fieldErrors.name ? "border-destructive" : ""}`}
              maxLength={100}
            />
            {fieldErrors.name && (
              <p className="text-sm text-destructive mt-1">
                {fieldErrors.name}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              URL : /stores/{store.slug} • {name.length}/100
            </p>
          </div>

          <div>
            <Label htmlFor="store-desc">Description</Label>
            <Textarea
              id="store-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearFieldError("description");
              }}
              placeholder="Décrivez votre boutique en quelques lignes…"
              rows={4}
              maxLength={2000}
              className={`mt-1 ${fieldErrors.description ? "border-destructive" : ""}`}
            />
            {fieldErrors.description && (
              <p className="text-sm text-destructive mt-1">
                {fieldErrors.description}
              </p>
            )}
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
                {logoImageUrl ? (
                  <Image
                    src={logoImageUrl}
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
                  accept="image/jpeg,image/png,image/webp"
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
            <p className="text-xs text-muted-foreground mt-2">
              JPEG, PNG ou WebP · Max 5 Mo · Carré recommandé (400×400 px min)
            </p>
          </div>

          <Separator />

          {/* Banner */}
          <div>
            <Label className="mb-2 block">Bannière</Label>
            <div className="space-y-3">
              <div className="relative h-32 w-full rounded-xl bg-muted overflow-hidden border flex items-center justify-center">
                {bannerImageUrl ? (
                  <Image
                    src={bannerImageUrl}
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
                  accept="image/jpeg,image/png,image/webp"
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
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG ou WebP · Max 5 Mo · 1200×400 px recommandé
              </p>
            </div>
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
            <Label htmlFor="theme-color">Couleur principale *</Label>
            <div className="flex items-center gap-3 mt-1">
              <input
                id="theme-color"
                type="color"
                value={primaryColor}
                onChange={(e) => {
                  setPrimaryColor(e.target.value);
                  clearFieldError("primaryColor");
                }}
                className="size-10 rounded-lg border cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => {
                  setPrimaryColor(e.target.value);
                  clearFieldError("primaryColor");
                }}
                placeholder="#6366f1"
                className={`w-32 font-mono text-sm ${fieldErrors.primaryColor ? "border-destructive" : ""}`}
                pattern="^#[0-9A-Fa-f]{6}$"
                maxLength={7}
              />
              <div
                className="size-10 rounded-lg border"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
            {fieldErrors.primaryColor && (
              <p className="text-sm text-destructive mt-1">
                {fieldErrors.primaryColor}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Format hexadécimal (ex: #6366f1)
            </p>
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

          {/* 3 service option cards */}
          <div
            className={`grid gap-3 ${hasPendingOrders ? "opacity-50 pointer-events-none select-none" : ""}`}
          >
            {/* Option 1 — Livraison + Stockage */}
            <button
              type="button"
              onClick={() => {
                setServiceMode("full");
                setCustomPickup(undefined);
              }}
              className={`relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                serviceMode === "full"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              {serviceMode === "full" && (
                <span className="absolute top-3 right-3">
                  <Check className="size-4 text-primary" />
                </span>
              )}
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Package className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Livraison + Stockage</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pixel-Mart stocke vos produits et gère les livraisons depuis
                  son entrepôt. Les distances sont calculées depuis{" "}
                  {PIXELMART_WAREHOUSE.label}.
                </p>
              </div>
            </button>

            {/* Option 2 — Livraison uniquement */}
            <button
              type="button"
              onClick={() => setServiceMode("delivery_only")}
              className={`relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                serviceMode === "delivery_only"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              {serviceMode === "delivery_only" && (
                <span className="absolute top-3 right-3">
                  <Check className="size-4 text-primary" />
                </span>
              )}
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Truck className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Livraison uniquement</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pixel-Mart livre vos commandes depuis votre propre adresse.
                  Vous gérez votre stock vous-même. Une adresse de retrait est
                  obligatoire.
                </p>
              </div>
            </button>

            {/* Option 3 — Aucun service */}
            <button
              type="button"
              onClick={() => {
                setServiceMode("none");
                setCustomPickup(undefined);
              }}
              className={`relative flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                serviceMode === "none"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              {serviceMode === "none" && (
                <span className="absolute top-3 right-3">
                  <Check className="size-4 text-primary" />
                </span>
              )}
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <X className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Aucun service</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vous gérez stock et livraison hors plateforme. Aucun frais de
                  livraison n&apos;est appliqué au checkout.
                </p>
              </div>
            </button>
          </div>

          {/* Custom pickup map — shown only for "delivery_only" */}
          {serviceMode === "delivery_only" && !hasPendingOrders && (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <p className="text-sm font-medium">
                  Votre adresse de retrait{" "}
                  <span className="text-destructive">*</span>
                </p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <Info className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  La géolocalisation peut être imprécise sur ordinateur.
                  Utilisez la recherche d&apos;adresse ou passez sur mobile pour
                  plus de précision.
                </p>
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

          {/* Warehouse info for "full" mode */}
          {serviceMode === "full" && (
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
                (serviceMode === "delivery_only" && !customPickup)
              }
              size="sm"
            >
              {isSavingDelivery ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Enregistrer les services
            </Button>
            {deliverySuccess && (
              <p className="text-sm text-green-600">Services mis à jour ✓</p>
            )}
            {deliveryError && (
              <p className="text-sm text-destructive">{deliveryError}</p>
            )}
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
            <Label>Pays *</Label>
            <Select
              value={country}
              onValueChange={(value) => {
                setCountry(value);
                clearFieldError("country");
              }}
            >
              <SelectTrigger
                className={`mt-1 ${fieldErrors.country ? "border-destructive" : ""}`}
              >
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
            {fieldErrors.country && (
              <p className="text-sm text-destructive mt-1">
                {fieldErrors.country}
              </p>
            )}
          </div>
          <div>
            <Label>Devise *</Label>
            <Select
              value={currency}
              onValueChange={(value) => {
                setCurrency(value);
                clearFieldError("currency");
              }}
            >
              <SelectTrigger
                className={`mt-1 ${fieldErrors.currency ? "border-destructive" : ""}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="USD">USD (Dollar US)</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.currency && (
              <p className="text-sm text-destructive mt-1">
                {fieldErrors.currency}
              </p>
            )}
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
            <span>
              {commissionRates
                ? `${(commissionRates[store.subscription_tier as "free" | "pro" | "business"] ?? commissionRates.free).toFixed(1)}%`
                : "—"}
            </span>
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
