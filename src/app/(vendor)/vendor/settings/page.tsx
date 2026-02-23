// filepath: src/app/(vendor)/vendor/settings/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { Loader2, Save, User, Mail, Phone, Globe } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function VendorProfilePage() {
  const { user, isLoading: authLoading } = useCurrentUser();
  const updateProfile = useMutation(api.users.mutations.updateProfile);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [locale, setLocale] = useState<"fr" | "en">("fr");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pré-remplir depuis les données utilisateur
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      setLocale((user.locale as "fr" | "en") ?? "fr");
    }
  }, [user]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        locale,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Mon compte</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" />
            Informations personnelles
          </CardTitle>
          <CardDescription>
            Ces informations sont visibles dans vos commandes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="size-3" />
              Email
            </Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="mt-1 opacity-60"
            />
            <p className="text-xs text-muted-foreground mt-1">
              L&apos;email ne peut pas être modifié ici
            </p>
          </div>

          <div>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="size-3" />
              Téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+22961234567"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="locale" className="flex items-center gap-2">
              <Globe className="size-3" />
              Langue
            </Label>
            <Select
              value={locale}
              onValueChange={(v) => setLocale(v as "fr" | "en")}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Account info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rôle</span>
            <Badge variant="outline" className="capitalize">
              {user.role}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email vérifié</span>
            <Badge
              variant="secondary"
              className={
                user.is_verified
                  ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20"
                  : "text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20"
              }
            >
              {user.is_verified ? "Vérifié" : "Non vérifié"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membre depuis</span>
            <span>
              {new Intl.DateTimeFormat("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(user._creationTime))}
            </span>
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
          Enregistrer
        </Button>
        {success && <p className="text-sm text-green-600">Profil mis à jour</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
