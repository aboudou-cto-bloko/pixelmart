// filepath: src/components/admin/templates/AdminCommunicationTemplate.tsx

"use client";

import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  BellRing,
  Megaphone,
  Users,
  Store,
  Send,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

type BannerData = {
  _id: Id<"vendor_banner">;
  enabled: boolean;
  text: string;
  link_url?: string;
  link_text?: string;
  bg_type: "color" | "gradient" | "image";
  bg_value: string;
  text_color: string;
  bg_image_url?: string | null;
  updated_at: number;
} | null;

interface Props {
  banner: BannerData | undefined;
}

type PushTarget = "vendors" | "customers" | "both";
type BgType = "color" | "gradient" | "image";

// ─── Helpers ─────────────────────────────────────────────────

function getBannerStyle(
  bgType: BgType,
  bgValue: string,
  bgImageUrl?: string | null,
): React.CSSProperties {
  if (bgType === "color") return { backgroundColor: bgValue || "#1d4ed8" };
  if (bgType === "gradient")
    return {
      background: bgValue || "linear-gradient(135deg, #667eea, #764ba2)",
    };
  if (bgType === "image" && bgImageUrl)
    return {
      backgroundImage: `url(${bgImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  return { backgroundColor: "#1d4ed8" };
}

// ─── Push Broadcast Section ───────────────────────────────────

function PushBroadcastSection() {
  const [target, setTarget] = useState<PushTarget>("vendors");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);

  const broadcast = useAction(api.admin.actions.broadcastPush);

  const targetLabels: Record<PushTarget, string> = {
    vendors: "Vendeurs",
    customers: "Clients",
    both: "Vendeurs + Clients",
  };

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await broadcast({
        target,
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
      });
      setResult(res);
      toast.success(
        `Notification envoyée à ${res.sent} utilisateur${res.sent !== 1 ? "s" : ""}`,
      );
      setTitle("");
      setBody("");
      setUrl("");
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BellRing className="size-4 text-primary" />
          Notification push broadcast
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Envoie une notification push + in-app à la cible choisie. Seuls les
          utilisateurs ayant activé les notifications seront touchés.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        {/* Cible */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Cible</Label>
          <RadioGroup
            value={target}
            onValueChange={(v) => setTarget(v as PushTarget)}
            className="flex flex-wrap gap-3"
          >
            {(["vendors", "customers", "both"] as PushTarget[]).map((t) => (
              <div key={t} className="flex items-center gap-2">
                <RadioGroupItem value={t} id={`target-${t}`} />
                <Label
                  htmlFor={`target-${t}`}
                  className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
                >
                  {t === "vendors" && (
                    <Store className="size-3.5 text-muted-foreground" />
                  )}
                  {t === "customers" && (
                    <Users className="size-3.5 text-muted-foreground" />
                  )}
                  {t === "both" && (
                    <Megaphone className="size-3.5 text-muted-foreground" />
                  )}
                  {targetLabels[t]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Titre */}
        <div className="space-y-1.5">
          <Label htmlFor="push-title" className="text-xs font-medium">
            Titre
          </Label>
          <Input
            id="push-title"
            placeholder="Ex : Nouvelle fonctionnalité disponible"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {title.length}/80
          </p>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label htmlFor="push-body" className="text-xs font-medium">
            Message
          </Label>
          <Textarea
            id="push-body"
            placeholder="Ex : Gérez vos commandes encore plus facilement…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={200}
          />
          <p className="text-[10px] text-muted-foreground text-right">
            {body.length}/200
          </p>
        </div>

        {/* Lien */}
        <div className="space-y-1.5">
          <Label htmlFor="push-url" className="text-xs font-medium">
            Lien (optionnel)
          </Label>
          <Input
            id="push-url"
            placeholder="Ex : /vendor/dashboard"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        {result && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="size-4" />
            Envoyé à {result.sent} utilisateur{result.sent !== 1 ? "s" : ""}
          </div>
        )}

        <Button
          onClick={handleSend}
          disabled={!title.trim() || !body.trim() || loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              <Send className="mr-2 size-4" />
              Envoyer aux {targetLabels[target].toLowerCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Vendor Banner Section ────────────────────────────────────

function VendorBannerSection({ banner }: { banner: BannerData | undefined }) {
  const isLoading = banner === undefined;

  const [enabled, setEnabled] = useState(banner?.enabled ?? false);
  const [text, setText] = useState(banner?.text ?? "");
  const [linkUrl, setLinkUrl] = useState(banner?.link_url ?? "");
  const [linkText, setLinkText] = useState(banner?.link_text ?? "");
  const [bgType, setBgType] = useState<BgType>(banner?.bg_type ?? "color");
  const [bgValue, setBgValue] = useState(banner?.bg_value ?? "#1d4ed8");
  const [textColor, setTextColor] = useState(banner?.text_color ?? "#ffffff");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(
    banner?.bg_image_url ?? null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upsert = useMutation(api.admin.mutations.upsertVendorBanner);
  const generateUploadUrl = useMutation(
    api.admin.mutations.generateAdminUploadUrl,
  );

  // Sync state when banner loads for the first time
  const initialized = useRef(false);
  if (banner && !initialized.current) {
    initialized.current = true;
    setEnabled(banner.enabled);
    setText(banner.text);
    setLinkUrl(banner.link_url ?? "");
    setLinkText(banner.link_text ?? "");
    setBgType(banner.bg_type);
    setBgValue(banner.bg_value);
    setTextColor(banner.text_color);
    setPreviewImageUrl(banner.bg_image_url ?? null);
  }

  async function handleImageUpload(file: File) {
    setUploadingImage(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("Upload échoué");
      const { storageId } = (await response.json()) as { storageId: string };
      setBgValue(storageId);
      setPreviewImageUrl(URL.createObjectURL(file));
    } catch {
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSave() {
    if (!text.trim()) {
      toast.error("Le texte du bandeau est requis");
      return;
    }
    setSaving(true);
    try {
      await upsert({
        enabled,
        text: text.trim(),
        link_url: linkUrl.trim() || undefined,
        link_text: linkText.trim() || undefined,
        bg_type: bgType,
        bg_value: bgValue,
        text_color: textColor,
      });
      toast.success("Bandeau enregistré");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  const bannerStyle = getBannerStyle(
    bgType,
    bgValue,
    bgType === "image" ? previewImageUrl : undefined,
  );

  return (
    <Card>
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Megaphone className="size-4 text-primary" />
            Bandeau d&apos;annonce vendeurs
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="banner-enabled"
              className="text-xs text-muted-foreground"
            >
              {enabled ? "Activé" : "Désactivé"}
            </Label>
            <Switch
              id="banner-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={isLoading}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Fine bannière affichée en haut du dashboard de chaque vendeur.
          Modifiable et activable/désactivable à tout moment.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-5">
        {/* Texte */}
        <div className="space-y-1.5">
          <Label htmlFor="banner-text" className="text-xs font-medium">
            Message du bandeau <span className="text-destructive">*</span>
          </Label>
          <Input
            id="banner-text"
            placeholder="Ex : Nouvelle fonctionnalité : gestion des variantes disponible !"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
            disabled={isLoading}
          />
        </div>

        {/* Lien */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="banner-link-url" className="text-xs font-medium">
              Lien (optionnel)
            </Label>
            <div className="relative">
              <Input
                id="banner-link-url"
                placeholder="Ex : /vendor/products"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                disabled={isLoading}
                className="pr-8"
              />
              {linkUrl && (
                <ExternalLink className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="banner-link-text" className="text-xs font-medium">
              Texte du lien
            </Label>
            <Input
              id="banner-link-text"
              placeholder="Ex : Découvrir"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              disabled={isLoading || !linkUrl}
            />
          </div>
        </div>

        <Separator />

        {/* Arrière-plan */}
        <div className="space-y-3">
          <Label className="text-xs font-medium">Arrière-plan</Label>
          <Tabs value={bgType} onValueChange={(v) => setBgType(v as BgType)}>
            <TabsList className="h-8">
              <TabsTrigger value="color" className="text-xs px-3">
                Couleur
              </TabsTrigger>
              <TabsTrigger value="gradient" className="text-xs px-3">
                Dégradé
              </TabsTrigger>
              <TabsTrigger value="image" className="text-xs px-3">
                Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="color" className="mt-3">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgValue.startsWith("#") ? bgValue : "#1d4ed8"}
                  onChange={(e) => setBgValue(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded border border-input p-0.5"
                />
                <Input
                  placeholder="#1d4ed8"
                  value={bgValue}
                  onChange={(e) => setBgValue(e.target.value)}
                  className="max-w-40 font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="gradient" className="mt-3 space-y-2">
              <Textarea
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                value={bgValue}
                onChange={(e) => setBgValue(e.target.value)}
                rows={2}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Entrez un CSS gradient valide. Ex :{" "}
                <code>linear-gradient(90deg, #f093fb, #f5576c)</code>
              </p>
            </TabsContent>

            <TabsContent value="image" className="mt-3 space-y-2">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="text-xs"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                      Upload…
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-1.5 size-3" />
                      Choisir une image
                    </>
                  )}
                </Button>
                {previewImageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewImageUrl(null);
                      setBgValue("#1d4ed8");
                    }}
                    className="text-xs text-muted-foreground"
                  >
                    <X className="mr-1 size-3" />
                    Retirer
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                Recommandé : image large (1200×80px minimum), JPEG ou PNG.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Couleur du texte */}
        <div className="flex items-center gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs font-medium">Couleur du texte</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-input p-0.5"
              />
              <Input
                placeholder="#ffffff"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="max-w-40 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Prévisualisation */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Prévisualisation</Label>
          <div className="overflow-hidden rounded-lg border">
            <div
              style={bannerStyle}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span
                style={{ color: textColor }}
                className="flex-1 truncate text-sm font-medium"
              >
                {text || "Texte du bandeau…"}
              </span>
              {linkUrl && (
                <span
                  style={{ color: textColor }}
                  className="shrink-0 text-xs font-semibold underline underline-offset-2"
                >
                  {linkText || "En savoir plus"}
                </span>
              )}
              <span
                style={{ color: textColor }}
                className="shrink-0 opacity-60"
              >
                <X className="size-3.5" />
              </span>
            </div>
          </div>
          {!enabled && (
            <Badge
              variant="outline"
              className="text-[10px] text-muted-foreground"
            >
              Bandeau désactivé — non visible pour les vendeurs
            </Badge>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving || isLoading}>
          {saving ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            "Enregistrer le bandeau"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Template ────────────────────────────────────────────

export function AdminCommunicationTemplate({ banner }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Communication
        </h1>
        <p className="text-sm text-muted-foreground">
          Diffusez des notifications push et gérez le bandeau d&apos;annonce du
          dashboard vendeur.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PushBroadcastSection />
        <VendorBannerSection banner={banner} />
      </div>
    </div>
  );
}
