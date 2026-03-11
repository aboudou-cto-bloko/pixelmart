"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useDebounce } from "use-debounce";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ROUTES } from "@/constants/routes";

import Image from "next/image";

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
  const [debouncedQuery] = useDebounce(query, 300);
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const suggestions = useQuery(
    api.products.queries.searchSuggestions,
    debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip",
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) return;

    router.push(`${ROUTES.PRODUCTS}?q=${encodeURIComponent(trimmed)}`);

    setOpen(false);

    onSubmit?.();
  }

  function handleSuggestionClick(slug: string) {
    router.push(ROUTES.PRODUCT(slug));

    setOpen(false);
    setQuery("");

    onSubmit?.();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <form
        onSubmit={handleSubmit}
        className={`flex items-center gap-2 ${className}`}
      >
        <PopoverTrigger asChild>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />

            <Input
              type="search"
              placeholder="Rechercher des produits…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              className={`pl-9 ${compact ? "h-9 text-sm" : "h-10"}`}
            />
          </div>
        </PopoverTrigger>

        {!compact && (
          <Button type="submit" size="sm" className="shrink-0">
            Rechercher
          </Button>
        )}
      </form>

      <PopoverContent className="w-105 p-0" align="start" sideOffset={4}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher un produit..."
            value={query}
            onValueChange={(value) => {
              setQuery(value);
            }}
          />

          <CommandList>
            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>

            {suggestions && suggestions.length > 0 && (
              <CommandGroup heading="Suggestions">
                {suggestions.map((product) => (
                  <CommandItem
                    key={product._id}
                    value={product.title}
                    onSelect={() => handleSuggestionClick(product.slug)}
                    className="flex items-center gap-3"
                  >
                    {product.thumbnailUrl && (
                      <div className="relative size-9 rounded-md overflow-hidden">
                        <Image
                          src={product.thumbnailUrl}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="flex flex-col flex-1">
                      <span className="text-sm font-medium truncate">
                        {product.title}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {product.price.toFixed(2)} €
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
