// filepath: src/hooks/useAddressAutocomplete.ts

"use client";

import { useState, useCallback, useRef } from "react";
import { searchAddress, type GeocodingResult } from "@/lib/geocoding";
import { useDebouncedCallback } from "use-debounce";

interface UseAddressAutocompleteOptions {
  countryCode?: string;
  debounceMs?: number;
}

interface UseAddressAutocompleteReturn {
  query: string;
  setQuery: (query: string) => void;
  results: GeocodingResult[];
  isLoading: boolean;
  error: string | null;
  selectResult: (result: GeocodingResult) => void;
  selectedResult: GeocodingResult | null;
  clearSelection: () => void;
}

export function useAddressAutocomplete(
  options: UseAddressAutocompleteOptions = {},
): UseAddressAutocompleteReturn {
  const { countryCode = "bj", debounceMs = 400 } = options;

  const [query, setQueryInternal] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<GeocodingResult | null>(
    null,
  );

  // Abort controller for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchDebounced = useDebouncedCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await searchAddress(searchQuery, countryCode);
      setResults(searchResults);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Erreur lors de la recherche d'adresse");
      }
    } finally {
      setIsLoading(false);
    }
  }, debounceMs);

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryInternal(newQuery);
      // Clear selection if user modifies the query
      if (selectedResult && newQuery !== selectedResult.displayName) {
        setSelectedResult(null);
      }
      searchDebounced(newQuery);
    },
    [selectedResult, searchDebounced],
  );

  const selectResult = useCallback((result: GeocodingResult) => {
    setSelectedResult(result);
    setQueryInternal(result.displayName);
    setResults([]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedResult(null);
    setQueryInternal("");
    setResults([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    selectResult,
    selectedResult,
    clearSelection,
  };
}
