// filepath: src/components/atoms/ErrorView.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldAlert, Home, RefreshCw, LogIn } from "lucide-react";

interface ErrorViewProps {
  error: Error & { digest?: string };
  reset?: () => void;
  backHref?: string;
  backLabel?: string;
}

export function ErrorView({
  error,
  reset,
  backHref = "/",
  backLabel = "Retour à l'accueil",
}: ErrorViewProps) {
  const isUnauthenticated =
    error.message === "Unauthenticated" ||
    error.message?.includes("Unauthenticated") ||
    ("data" in error && (error as { data?: unknown }).data === "Unauthenticated");

  if (isUnauthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Session expirée</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Votre session a expiré ou vous n&apos;êtes pas connecté. Veuillez vous
            reconnecter pour continuer.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => (window.location.href = "/login")}
            className="gap-2"
          >
            <LogIn className="h-4 w-4" />
            Se connecter
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = backHref)}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            {backLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Une erreur est survenue
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Une erreur inattendue s&apos;est produite. Vous pouvez réessayer ou
          revenir en arrière.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            Réf. : {error.digest}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {reset && (
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => (window.location.href = backHref)}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
