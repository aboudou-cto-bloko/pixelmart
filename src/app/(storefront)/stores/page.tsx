// filepath: src/app/(storefront)/stores/page.tsx

"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Search, ShieldCheck } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { StoreCard } from "@/components/store/StoreCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SUPPORTED_COUNTRIES } from "@/constants/countries";

export default function StoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState<string | undefined>(
    undefined,
  );
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const stores = useQuery(api.stores.queries.listActive, {
    limit: 50,
    country: countryFilter,
    verifiedOnly: verifiedOnly || undefined,
  });

  // Client-side name filter (search index n'existe pas sur stores)
  const filteredStores = stores?.filter((store) => {
    if (searchTerm.trim().length === 0) return true;
    return store.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pays qui ont des boutiques actives
  const activeCountries = SUPPORTED_COUNTRIES.filter((c) =>
    stores?.some((s) => s.country === c.code),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Boutiques</h1>
        <p className="text-muted-foreground">
          Découvrez les vendeurs de confiance sur Pixel-Mart.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search by name */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une boutique…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Verified toggle */}
          <Button
            variant={verifiedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setVerifiedOnly(!verifiedOnly)}
          >
            <ShieldCheck className="size-4 mr-1.5" />
            Vérifiées uniquement
          </Button>
        </div>

        {/* Country filter */}
        {activeCountries.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={countryFilter === undefined ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCountryFilter(undefined)}
            >
              Tous les pays
            </Badge>
            {activeCountries.map((c) => (
              <Badge
                key={c.code}
                variant={countryFilter === c.code ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  setCountryFilter(
                    countryFilter === c.code ? undefined : c.code,
                  )
                }
              >
                {c.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {filteredStores === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">
            {searchTerm
              ? `Aucune boutique trouvée pour « ${searchTerm} ».`
              : "Aucune boutique disponible pour le moment."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredStores.length} boutique
            {filteredStores.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStores.map((store) => (
              <StoreCard key={store._id} store={store} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
