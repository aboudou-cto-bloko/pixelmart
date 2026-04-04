"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import {
  getPasswordStrength,
  getStrengthLabel,
  getStrengthColor,
  getStrengthWidth,
  getPasswordRequirements,
} from "@/lib/password-strength";
import {
  registerSchema,
  getSafeErrorMessage,
  type RegisterFormData,
} from "@/lib/validation/auth";
import { z } from "zod";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupEmail = searchParams.get("email") ?? "";
  const isSetupFlow = Boolean(searchParams.get("token") && setupEmail);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const lastSubmissionTime = useRef<number>(0);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Controlled form state — pré-remplissage email depuis URL (flux setup invité)
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: setupEmail,
    password: "",
    confirmPassword: "",
  });

  // Update form field
  function updateField<K extends keyof RegisterFormData>(
    key: K,
    value: RegisterFormData[K],
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Rate limiting: prevent rapid submissions
    const now = Date.now();
    if (now - lastSubmissionTime.current < 3000) {
      // 3 second cooldown for registration
      setError("Veuillez attendre avant de soumettre à nouveau");
      return;
    }
    lastSubmissionTime.current = now;

    setIsLoading(true);

    try {
      // Client-side validation
      const validatedData = registerSchema.parse(formData);

      const { error: signUpError } = await authClient.signUp.email({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        callbackURL: "/dashboard",
      });

      setIsLoading(false);
      if (signUpError) {
        setError(getSafeErrorMessage(signUpError));
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setIsLoading(false);
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
        setError("Une erreur inattendue est survenue. Veuillez réessayer.");
      }
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Vérifiez votre email</CardTitle>
          <CardDescription>
            Un email de vérification a été envoyé. Cliquez sur le lien pour
            activer votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Vous ne trouvez pas l&apos;email ?{" "}
            <span className="font-medium text-foreground">
              Pensez à vérifier vos spams ou courriers indésirables.
            </span>
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm underline">
            Retour à la connexion
          </Link>
        </CardFooter>
      </Card>
    );
  }

  const passwordRequirements = getPasswordRequirements(formData.password);
  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {isSetupFlow ? "Finalisez votre compte" : "Créer un compte"}
        </CardTitle>
        <CardDescription>
          {isSetupFlow
            ? "Choisissez un mot de passe pour accéder à votre espace client et suivre vos commandes."
            : "Rejoignez Pixel-Mart, la marketplace africaine"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Franck Zinsou"
              required
              autoComplete="name"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={fieldErrors.name ? "border-destructive" : ""}
            />
            {fieldErrors.name && (
              <p className="text-sm text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="mail@example.com"
              required
              autoComplete="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              readOnly={isSetupFlow}
              className={`${fieldErrors.email ? "border-destructive" : ""} ${isSetupFlow ? "bg-muted cursor-not-allowed" : ""}`}
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 caractères"
                required
                autoComplete="new-password"
                minLength={8}
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className={`pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}

            {/* Password strength indicator */}
            {formData.password && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getStrengthColor(passwordStrength)}`}
                      style={{ width: getStrengthWidth(passwordStrength) }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground min-w-fit">
                    {getStrengthLabel(passwordStrength)}
                  </span>
                </div>

                {/* Password requirements checklist */}
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    {passwordRequirements.minLength ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        passwordRequirements.minLength
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      Au moins 8 caractères
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasLowercase &&
                    passwordRequirements.hasUppercase ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        passwordRequirements.hasLowercase &&
                        passwordRequirements.hasUppercase
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      Majuscules et minuscules
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordRequirements.hasNumber &&
                    passwordRequirements.hasSpecialChar ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        passwordRequirements.hasNumber &&
                        passwordRequirements.hasSpecialChar
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      Chiffre et caractère spécial
                    </span>
                  </div>
                  {!passwordRequirements.notCommon && (
                    <div className="flex items-center gap-2">
                      <X className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">
                        Mot de passe trop courant
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Répéter le mot de passe"
                required
                autoComplete="new-password"
                minLength={8}
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                className={`pr-10 ${fieldErrors.confirmPassword ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSetupFlow ? "Créer mon mot de passe" : "Créer mon compte"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link href="/login" className="underline text-foreground">
            Se connecter
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
