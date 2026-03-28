"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader2, Ban } from "lucide-react";
import Link from "next/link";

type Role = "admin" | "vendor" | "customer" | "agent";

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: Role[];
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, roles, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useCurrentUser();

  const isBanned = !!user?.is_banned;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isBanned) router.push("/login");
  }, [isLoading, isAuthenticated, isBanned, router]);

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    );
  }

  if (isBanned) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <Ban className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Compte suspendu</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Votre compte a été suspendu. Contactez le support si vous pensez
            qu&apos;il s&apos;agit d&apos;une erreur.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (window as typeof window & { Chatway?: (cmd: string) => void }).Chatway?.("open")}
          className="text-sm text-primary underline underline-offset-4"
        >
          Contacter le support
        </button>
        <Link href="/" className="text-sm text-muted-foreground underline underline-offset-4">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground">
          Vous n&apos;avez pas les droits pour accéder à cette page.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="underline text-sm"
        >
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
