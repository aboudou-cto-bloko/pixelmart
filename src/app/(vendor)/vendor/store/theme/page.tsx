"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { THEME_PRESETS, type ThemePresetId } from "@/lib/themes";
import { ThemePreview } from "@/components/store/ThemePreview";
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
import { toast } from "sonner";
import { Loader2, Moon, Palette, Sun } from "lucide-react";

export default function StoreThemePage() {
  const store = useQuery(api.stores.queries.getMyStore);
  const updateTheme = useMutation(api.stores.mutations.updateStoreTheme);

  const [selectedTheme, setSelectedTheme] = useState<ThemePresetId>("default");
  const [customColor, setCustomColor] = useState("");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (store && !initialized) {
      setSelectedTheme((store.theme_id as ThemePresetId) ?? "default");
      setCustomColor(store.primary_color ?? "");
      setThemeMode((store.theme_mode as "light" | "dark") ?? "light");
      setInitialized(true);
    }
  }, [store, initialized]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateTheme({
        theme_id: selectedTheme,
        primary_color: customColor || undefined,
        theme_mode: themeMode,
      });
      toast.success("Thème mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour du thème");
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges =
    store &&
    (selectedTheme !== store.theme_id ||
      (customColor || "") !== (store.primary_color || "") ||
      themeMode !== (store.theme_mode ?? "light"));

  if (!store) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Thème de la boutique
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personnalisez l&apos;apparence de votre vitrine publique
        </p>
      </div>

      {/* Mode clair / sombre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {themeMode === "dark" ? (
              <Moon className="size-5" />
            ) : (
              <Sun className="size-5" />
            )}
            Mode d&apos;affichage
          </CardTitle>
          <CardDescription>
            Choisissez entre un affichage clair ou sombre pour votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setThemeMode("light")}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                themeMode === "light"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-muted text-muted-foreground hover:border-muted-foreground/30"
              }`}
            >
              <Sun className="size-4" />
              Clair
            </button>
            <button
              type="button"
              onClick={() => setThemeMode("dark")}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                themeMode === "dark"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-muted text-muted-foreground hover:border-muted-foreground/30"
              }`}
            >
              <Moon className="size-4" />
              Sombre
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sélection du thème */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5" />
            Choisir un thème
          </CardTitle>
          <CardDescription>
            5 thèmes pré-conçus — l&apos;aperçu reflète le mode{" "}
            {themeMode === "dark" ? "sombre" : "clair"} sélectionné
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((id) => (
              <ThemePreview
                key={id}
                themeId={id}
                isSelected={selectedTheme === id}
                onSelect={setSelectedTheme}
                darkMode={themeMode === "dark"}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Couleur personnalisée */}
      <Card>
        <CardHeader>
          <CardTitle>Couleur primaire personnalisée</CardTitle>
          <CardDescription>
            Remplace la couleur principale du thème en mode clair (optionnel)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="customColor">Couleur (hex)</Label>
              <div className="flex gap-2">
                <Input
                  id="customColor"
                  type="color"
                  value={customColor || "#2563EB"}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer p-1"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#2563EB"
                  className="w-32 font-mono"
                  maxLength={7}
                />
              </div>
            </div>
            {customColor && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCustomColor("")}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Enregistrer le thème
        </Button>
      </div>
    </div>
  );
}
