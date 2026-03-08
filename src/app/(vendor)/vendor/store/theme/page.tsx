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
import { Loader2, Palette } from "lucide-react";

export default function StoreThemePage() {
  const store = useQuery(api.stores.queries.getMyStore);
  const updateTheme = useMutation(api.stores.mutations.updateStoreTheme);

  const [selectedTheme, setSelectedTheme] = useState<ThemePresetId>("default");
  const [customColor, setCustomColor] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialisation une fois que le store est chargé
  useEffect(() => {
    if (store && !initialized) {
      setSelectedTheme((store.theme_id as ThemePresetId) ?? "default");
      setCustomColor(store.primary_color ?? "");
      setInitialized(true);
    }
  }, [store, initialized]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateTheme({
        theme_id: selectedTheme,
        primary_color: customColor || undefined,
      });
      toast.success("Thème mis à jour");
      // Optionnel : re-sync si besoin, mais la query va se mettre à jour automatiquement
      // setInitialized(false); // si on veut forcer la relecture après sauvegarde, mais pas nécessaire car la query se met à jour.
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du thème");
    } finally {
      setIsSaving(false);
    }
  }

  // Calcul des changements seulement si store est chargé
  const hasChanges =
    store &&
    (selectedTheme !== store.theme_id ||
      (customColor || "") !== (store.primary_color || ""));

  // Si le store n'est pas encore chargé, on peut afficher un loader
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
        <p className="text-muted-foreground">
          Personnalisez l&apos;apparence de votre vitrine publique
        </p>
      </div>

      {/* Sélection du thème */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5" />
            Choisir un thème
          </CardTitle>
          <CardDescription>
            3 thèmes pré-conçus optimisés pour la conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((id) => (
              <ThemePreview
                key={id}
                themeId={id}
                isSelected={selectedTheme === id}
                onSelect={setSelectedTheme}
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
            Remplace la couleur principale du thème par la vôtre (optionnel)
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
