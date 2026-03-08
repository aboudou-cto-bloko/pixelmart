"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import Image from "next/image";
import {
  Loader2,
  Save,
  Store,
  Upload,
  X,
  Palette,
  Globe,
  ImageIcon,
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

export default function StoreSettingsPage() {
  const store = useQuery(api.stores.queries.getMyStore);
  const updateStore = useMutation(api.stores.mutations.updateStore);
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

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

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
      setStorageId(storageId); // Stocker le storageId, l'URL sera résolue automatiquement par la query
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
        logo_url: logoStorageId, // Envoyer le storageId
        banner_url: bannerStorageId,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
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
