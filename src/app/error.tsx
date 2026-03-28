"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertCircle, Home, LogIn } from "lucide-react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  const isUnauthenticated =
    error.message === "Unauthenticated" ||
    error.message?.includes("Unauthenticated") ||
    ("data" in error && (error as { data?: unknown }).data === "Unauthenticated");

  useEffect(() => {
    if (!isUnauthenticated) {
      console.error("[GlobalError]", error);
    }
  }, [error, isUnauthenticated]);

  if (isUnauthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Session expirée
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Votre session a expiré ou vous n&apos;êtes pas connecté. Veuillez
            vous reconnecter pour continuer.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => router.push("/login")} className="gap-2">
            <LogIn className="h-4 w-4" />
            Se connecter
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Une erreur est survenue
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Une erreur inattendue s&apos;est produite. Veuillez réessayer ou
          revenir à l&apos;accueil.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => router.push("/")}
        className="gap-2"
      >
        <Home className="h-4 w-4" />
        Retour à l&apos;accueil
      </Button>
    </div>
  );
}
