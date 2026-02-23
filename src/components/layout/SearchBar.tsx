"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  defaultValue?: string;
  className?: string;
  /** Compact mode pour la navbar mobile */
  compact?: boolean;
}

export function SearchBar({
  defaultValue = "",
  className = "",
  compact = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) return;
    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 ${className}`}
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher des produits…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`pl-9 ${compact ? "h-9 text-sm" : "h-10"}`}
        />
      </div>
      {!compact && (
        <Button type="submit" size="sm" className="shrink-0">
          Rechercher
        </Button>
      )}
    </form>
  );
}
