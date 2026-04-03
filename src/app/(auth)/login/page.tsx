"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  loginSchema,
  getSafeErrorMessage,
  type LoginFormData,
} from "@/lib/validation/auth";
import { z } from "zod";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const lastSubmissionTime = useRef<number>(0);

  // Controlled form state
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  // Update form field
  function updateField<K extends keyof LoginFormData>(
    key: K,
    value: LoginFormData[K],
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
    if (now - lastSubmissionTime.current < 2000) {
      // 2 second cooldown
      setError("Veuillez attendre avant de soumettre à nouveau");
      return;
    }
    lastSubmissionTime.current = now;

    setIsLoading(true);

    try {
      // Client-side validation
      const validatedData = loginSchema.parse(formData);

      const { error: signInError } = await authClient.signIn.email({
        email: validatedData.email,
        password: validatedData.password,
        callbackURL: "/dashboard",
      });

      setIsLoading(false);
      if (signInError) {
        setError(getSafeErrorMessage(signInError));
      } else {
        router.push("/dashboard");
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

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>Accédez à votre compte Pixel-Mart</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

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
              className={fieldErrors.email ? "border-destructive" : ""}
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe *</Label>
              <Link
                href="/forgot-password"
                className="text-sm underline text-muted-foreground hover:text-foreground"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className={`pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
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
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Se connecter
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="underline text-foreground hover:text-primary"
          >
            S&apos;inscrire
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
