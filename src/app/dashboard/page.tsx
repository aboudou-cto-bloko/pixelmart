// filepath: src/app/dashboard/page.tsx — remplacer le contenu existant

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader2 } from "lucide-react";

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading || !user) return;

    switch (user.role) {
      case "admin":
        router.replace("/admin/dashboard");
        break;
      case "vendor":
        router.replace("/vendor/dashboard");
        break;
      case "customer":
      default:
        // Le customer n'a pas de dashboard dédié pour l'instant
        // Il est redirigé vers la storefront
        router.replace("/");
        break;
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
