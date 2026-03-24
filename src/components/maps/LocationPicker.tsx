// filepath: src/components/maps/LocationPicker.tsx

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { searchAddress } from "@/lib/geocoding";
import type { GeocodingResult } from "@/lib/geocoding";
import { MAP_DEFAULT_ZOOM, MAP_COTONOU_CENTER } from "@/constants/pickup";

export interface PickedLocation {
  lat: number;
  lon: number;
  label: string;
}

interface LocationPickerProps {
  value?: PickedLocation;
  onChange: (location: PickedLocation) => void;
  /** Height of the map container — defaults to 320px */
  height?: number;
  /** If true, shows a subtle read-only overlay (no click / no search) */
  readOnly?: boolean;
}

export function LocationPicker({
  value,
  onChange,
  height = 320,
  readOnly = false,
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Store map/marker as refs so they survive re-renders without triggering effects
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Initialise map once ──────────────────────────────────────────────────

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    let cancelled = false;

    // Leaflet is a CJS module — import dynamically to avoid SSR issues
    import("leaflet").then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const initialCenter = value
        ? ([value.lat, value.lon] as [number, number])
        : ([MAP_COTONOU_CENTER.lat, MAP_COTONOU_CENTER.lon] as [
            number,
            number,
          ]);

      const map = L.map(mapContainerRef.current!, {
        center: initialCenter,
        zoom: MAP_DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: !readOnly,
        dragging: !readOnly,
        doubleClickZoom: !readOnly,
        touchZoom: !readOnly,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Place initial marker if value provided
      if (value) {
        markerRef.current = L.marker([value.lat, value.lon]).addTo(map);
      }

      // Click to pick (only in edit mode)
      if (!readOnly) {
        map.on("click", async (e: import("leaflet").LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;

          // Update or create marker
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng]).addTo(map);
          }

          // Reverse geocode to get human-readable label
          try {
            const { reverseGeocode } = await import("@/lib/geocoding");
            const result = await reverseGeocode(lat, lng);
            onChange({
              lat,
              lon: lng,
              label:
                result?.displayName ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            });
          } catch {
            onChange({
              lat,
              lon: lng,
              label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            });
          }
        });
      }

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync external value → marker position ───────────────────────────────

  useEffect(() => {
    if (!mapRef.current || !value) return;

    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if (markerRef.current) {
        markerRef.current.setLatLng([value.lat, value.lon]);
      } else {
        markerRef.current = L.marker([value.lat, value.lon]).addTo(
          mapRef.current,
        );
      }
      mapRef.current.setView([value.lat, value.lon], MAP_DEFAULT_ZOOM);
    });
  }, [value?.lat, value?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Nominatim search ─────────────────────────────────────────────────────

  const handleSearchChange = useCallback((val: string) => {
    setQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (val.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    searchDebounce.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchAddress(val);
        setResults(found);
        setShowResults(found.length > 0);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, []);

  function handleSelectResult(result: GeocodingResult) {
    setQuery(result.displayName);
    setResults([]);
    setShowResults(false);
    onChange({
      lat: result.lat,
      lon: result.lon,
      label: result.displayName,
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Search bar — hidden in readOnly mode */}
      {!readOnly && (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Rechercher une adresse…"
                className="pl-8 pr-8"
                onFocus={() => results.length > 0 && setShowResults(true)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setShowResults(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {isSearching && (
              <Loader2 className="size-4 animate-spin self-center text-muted-foreground" />
            )}
          </div>

          {/* Suggestions dropdown */}
          {showResults && results.length > 0 && (
            <div className="absolute z-[1000] mt-1 w-full rounded-md border bg-popover shadow-md">
              {results.map((r) => (
                <button
                  key={r.placeId}
                  type="button"
                  onClick={() => handleSelectResult(r)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                >
                  <MapPin className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <span className="line-clamp-2">{r.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border">
        {/* Leaflet CSS injected inline to avoid next.config hassle */}
        <style>{`
          @import "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          .leaflet-container { font-family: inherit; }
        `}</style>
        <div ref={mapContainerRef} style={{ height }} className="w-full" />
        {readOnly && <div className="absolute inset-0 pointer-events-none" />}
      </div>

      {/* Current value label */}
      {value && (
        <div className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2">
          <MapPin className="size-4 shrink-0 mt-0.5 text-primary" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {value.label}
          </p>
        </div>
      )}

      {/* Hint */}
      {!readOnly && (
        <p className="text-xs text-muted-foreground">
          Cliquez sur la carte pour placer l&apos;épingle, ou recherchez une
          adresse ci-dessus.
        </p>
      )}
    </div>
  );
}
