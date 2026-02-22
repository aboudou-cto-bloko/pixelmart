// filepath: src/app/onboarding/vendor/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  vendorOnboardingSchema,
  type VendorOnboardingValues,
} from "@/lib/validations/vendor";
import { SUPPORTED_COUNTRIES } from "@/constants/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Loader2,
  Store,
  MapPin,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

// ---- Types extraits pour éviter le conflit JSX/generics ----
type FieldErrors = Partial<Record<keyof VendorOnboardingValues, string>>;

const STEPS = [
  { id: 1, title: "Votre boutique", icon: Store },
  { id: 2, title: "Localisation", icon: MapPin },
  { id: 3, title: "Finalisation", icon: FileText },
] as const;

export default function VendorOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const becomeVendor = useMutation(api.users.mutations.becomeVendor);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState<VendorOnboardingValues>({
    store_name: "",
    description: "",
    country: "BJ",
  });

  // ---- Guards ----
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (user.role === "vendor") {
    router.replace("/vendor/dashboard");
    return null;
  }

  if (user.role === "admin") {
    router.replace("/admin/dashboard");
    return null;
  }

  // ---- Handlers ----
  function updateField<K extends keyof VendorOnboardingValues>(
    key: K,
    value: VendorOnboardingValues[K],
  ) {
    setFormData((prev: VendorOnboardingValues) => ({ ...prev, [key]: value }));
    setFieldErrors((prev: FieldErrors) => ({ ...prev, [key]: undefined }));
    setError(null);
  }

  function validateCurrentStep(): boolean {
    const errors: FieldErrors = {};

    if (step === 1) {
      const trimmed = formData.store_name.trim();
      if (trimmed.length < 3) {
        errors.store_name = "Le nom doit contenir au moins 3 caractères";
      } else if (trimmed.length > 60) {
        errors.store_name = "Le nom ne peut pas dépasser 60 caractères";
      }
    }

    if (step === 2) {
      if (!formData.country) {
        errors.country = "Sélectionnez un pays";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleNext() {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(s + 1, 3));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    setError(null);

    const result = vendorOnboardingSchema.safeParse(formData);
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      const mapped: FieldErrors = {};
      for (const [key, msgs] of Object.entries(flat)) {
        const messages = msgs as string[] | undefined;
        if (messages && messages.length > 0) {
          mapped[key as keyof VendorOnboardingValues] = messages[0];
        }
      }
      setFieldErrors(mapped);
      return;
    }

    setIsSubmitting(true);

    try {
      await becomeVendor({
        store_name: result.data.store_name.trim(),
        country: result.data.country,
        description: result.data.description ?? undefined,
      });

      router.push("/vendor/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue";
      setError(message);
      setIsSubmitting(false);
    }
  }

  // ---- Derived ----
  const selectedCountry = SUPPORTED_COUNTRIES.find(
    (c) => c.code === formData.country,
  );

  // ---- Render ----
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, index) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;

            return (
              <div key={s.id} className="flex items-center gap-2">
                {index > 0 && (
                  <div
                    className={`h-px w-8 transition-colors ${
                      isCompleted ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCompleted
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 && "Nommez votre boutique"}
              {step === 2 && "Où êtes-vous basé ?"}
              {step === 3 && "Prêt à lancer ?"}
            </CardTitle>
            <CardDescription>
              {step === 1 &&
                "Ce nom sera visible par vos clients. Vous pourrez le modifier plus tard."}
              {step === 2 &&
                "Votre pays détermine la devise et les modes de paiement disponibles."}
              {step === 3 &&
                "Vérifiez les informations et lancez votre boutique."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1 — Store name */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store_name">Nom de la boutique</Label>
                  <Input
                    id="store_name"
                    placeholder="ex: Mode Dakar, Tech Cotonou..."
                    value={formData.store_name}
                    onChange={(e) => updateField("store_name", e.target.value)}
                    maxLength={60}
                    autoFocus
                  />
                  {fieldErrors.store_name && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.store_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.store_name.length}/60 caractères
                  </p>
                </div>
              </div>
            )}

            {/* Step 2 — Country */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) =>
                      updateField(
                        "country",
                        value as VendorOnboardingValues["country"],
                      )
                    }
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Sélectionnez un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.country && (
                    <p className="text-sm text-destructive">
                      {fieldErrors.country}
                    </p>
                  )}
                </div>

                {selectedCountry && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      Devise :{" "}
                      <span className="font-medium text-foreground">
                        {selectedCountry.currency}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Les prix seront affichés en {selectedCountry.currency}.
                      Tous les montants sont stockés en centimes.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Review + optional description */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Boutique
                    </span>
                    <span className="text-sm font-medium">
                      {formData.store_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pays</span>
                    <span className="text-sm font-medium">
                      {selectedCountry?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Devise
                    </span>
                    <span className="text-sm font-medium">
                      {selectedCountry?.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Commission
                    </span>
                    <span className="text-sm font-medium">
                      5% (plan gratuit)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description{" "}
                    <span className="text-muted-foreground">(optionnel)</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre boutique en quelques mots..."
                    value={formData.description ?? ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {(formData.description ?? "").length}/500 caractères
                  </p>
                </div>
              </div>
            )}

            {/* Error global */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
              )}

              {step < 3 ? (
                <Button onClick={handleNext} className="flex-1">
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Store className="mr-2 h-4 w-4" />
                      Ouvrir ma boutique
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Vous pourrez modifier ces informations à tout moment dans les
          paramètres de votre boutique.
        </p>
      </div>
    </div>
  );
}
