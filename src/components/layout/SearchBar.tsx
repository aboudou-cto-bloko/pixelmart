"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useQuery } from "convex/react";
import Image from "next/image";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  defaultValue?: string;
  className?: string;
  compact?: boolean;
  onSubmit?: () => void;
}

export function SearchBar({
  defaultValue = "",
  className = "",
  compact = false,
  onSubmit,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [debouncedQuery] = useDebounce(query, 250);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const trimmed = debouncedQuery.trim();
  const suggestions = useQuery(
    api.products.queries.searchSuggestions,
    trimmed.length >= 2 ? { query: trimmed, limit: 6 } : "skip",
  );

  const isLoading = trimmed.length >= 2 && suggestions === undefined;
  const showDropdown = open && query.trim().length >= 2;

  function submitSearch() {
    const q = query.trim();
    if (!q) return;
    router.push(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(q)}`);
    setOpen(false);
    onSubmit?.();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitSearch();
  }

  function handleSuggestionClick(slug: string) {
    router.push(ROUTES.PRODUCT(slug));
    setOpen(false);
    setQuery("");
    onSubmit?.();
  }

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          <Input
            ref={inputRef}
            type="search"
            placeholder="Rechercher des produits…"
            value={query}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                inputRef.current?.blur();
              }
            }}
            className={cn(
              "pl-9",
              isLoading && "pr-9",
              compact ? "h-9 text-sm" : "h-10",
            )}
          />
        </div>
        {!compact && (
          <Button type="submit" size="sm" className="shrink-0">
            Rechercher
          </Button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-popover shadow-lg">
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Recherche en cours…
            </div>
          ) : !suggestions || suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Aucun résultat pour «&nbsp;{query.trim()}&nbsp;»
            </p>
          ) : (
            <>
              <ul role="listbox" aria-label="Suggestions de recherche">
                {suggestions.map((product) => (
                  <li key={product._id} role="option">
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(product.slug)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        {product.thumbnailUrl ? (
                          <Image
                            src={product.thumbnailUrl}
                            alt={product.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {product.title}
                        </p>
                        <p className="text-xs font-semibold text-primary">
                          {formatPrice(product.price, "XOF")}
                        </p>
                      </div>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t px-3 py-2">
                <button
                  type="button"
                  onClick={submitSearch}
                  className="flex w-full items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <Search className="size-3.5" />
                  Voir tous les résultats pour «&nbsp;{query.trim()}&nbsp;»
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
