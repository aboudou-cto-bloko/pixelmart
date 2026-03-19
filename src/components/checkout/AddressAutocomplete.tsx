// filepath: src/components/checkout/AddressAutocomplete.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";
import type { GeocodingResult } from "@/lib/geocoding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  countryCode?: string;
  value?: string;
  onSelect: (result: GeocodingResult) => void;
  error?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  label = "Adresse de livraison",
  placeholder = "Commencez à taper votre adresse…",
  countryCode = "bj",
  value,
  onSelect,
  error,
  required = false,
}: AddressAutocompleteProps) {
  const { query, setQuery, results, isLoading, selectedResult, selectResult } =
    useAddressAutocomplete({ countryCode });

  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: GeocodingResult) => {
    selectResult(result);
    onSelect(result);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative space-y-2">
      {label && (
        <Label htmlFor="address-autocomplete">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="address-autocomplete"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "pl-10 pr-10",
            error && "border-destructive",
            selectedResult && "border-green-500",
          )}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {selectedResult && !isLoading && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((result) => (
            <button
              key={result.placeId}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-3"
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm truncate">{result.displayName}</p>
                {result.city && (
                  <p className="text-xs text-muted-foreground">
                    {result.city}, {result.country}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 3 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune adresse trouvée
          </p>
        </div>
      )}
    </div>
  );
}
