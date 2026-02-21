"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader2 } from "lucide-react";

type Role = "admin" | "vendor" | "customer";

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: Role[];
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, roles, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
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
