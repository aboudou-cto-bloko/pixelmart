// filepath: src/app/(vendor)/vendor/select-store/page.tsx

"use client";

import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import Image from "next/image";
import { Store, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState } from "react";

export default function SelectStorePage() {
  const { user } = useCurrentUser();
  const stores = useQuery(api.stores.queries.listMyStores, {});
  const switchStore = useMutation(api.stores.mutations.switchActiveStore);
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelect = async (storeId: Id<"stores">) => {
    setLoading(storeId);
    try {
      await switchStore({ store_id: storeId });
      router.push("/vendor/dashboard");
    } finally {
      setLoading(null);
    }
  };

  if (!stores) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">
          Chargement…
        </div>
      </div>
    );
  }

  if (stores.length === 1) {
    router.push("/vendor/dashboard");
    return null;
  }

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {firstName ? `Bienvenue, ${firstName}` : "Bienvenue"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Choisissez la boutique que vous souhaitez gérer
          </p>
        </div>

        {/* Store list */}
        <div className="space-y-3">
          {stores.map((store) => {
            const isLoading = loading === store._id;
            return (
              <button
                key={store._id}
                onClick={() => handleSelect(store._id)}
                disabled={isLoading}
                className="w-full text-left rounded-xl border bg-card p-4 flex items-center gap-4 hover:border-primary hover:bg-accent/50 transition-all duration-150 group disabled:opacity-60 disabled:cursor-wait"
              >
                {/* Logo */}
                <div className="size-12 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                  {store.logo_url ? (
                    <Image
                      src={store.logo_url}
                      alt={store.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Store className="size-5 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{store.name}</span>
                    {store.isActive && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Actuelle
                      </Badge>
                    )}
                    {store.subscription_tier !== "free" && (
                      <Badge variant="outline" className="text-xs shrink-0 capitalize">
                        {store.subscription_tier}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {store.status === "active" ? "Active" : store.status === "suspended" ? "Suspendue" : store.status}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Create new store */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1"
            onClick={() => router.push("/vendor/store/settings")}
          >
            <Plus className="size-3.5" />
            Créer une nouvelle boutique
          </Button>
        </div>
      </div>
    </div>
  );
}
