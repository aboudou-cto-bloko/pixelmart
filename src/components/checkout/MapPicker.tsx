// filepath: src/components/checkout/MapPicker.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import type { Marker as LeafletMarker, LatLngBoundsExpression } from "leaflet";
import L from "leaflet";
import { reverseGeocode } from "@/lib/geocoding";
import type { GeocodingResult } from "@/lib/geocoding";
import { MAP_COTONOU_CENTER, MAP_DEFAULT_ZOOM } from "@/constants/pickup";
import { Button } from "@/components/ui/button";
import { Loader2, Navigation } from "lucide-react";

// ─── Fix Leaflet default icon (webpack breaks _getIconUrl) ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Sub-components ──────────────────────────────────────────

function DraggableMarker({
  position,
  onMove,
}: {
  position: [number, number];
  onMove: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<LeafletMarker | null>(null);

  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const m = markerRef.current;
          if (m) {
            const { lat, lng } = m.getLatLng();
            onMove(lat, lng);
          }
        },
      }}
    />
  );
}

function FlyToController({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, MAP_DEFAULT_ZOOM);
    }
  }, [map, target]);
  return null;
}

// ─── Main component ───────────────────────────────────────────

export interface MapPickerProps {
  value?: { lat: number; lon: number };
  onLocationSelect: (result: GeocodingResult) => void;
}

const BENIN_BOUNDS: LatLngBoundsExpression = [
  [5.7, 0.78],   // SW corner
  [12.4, 3.85],  // NE corner
];

export function MapPicker({ value, onLocationSelect }: MapPickerProps) {
  const defaultCenter: [number, number] = [
    MAP_COTONOU_CENTER.lat,
    MAP_COTONOU_CENTER.lon,
  ];

  const [position, setPosition] = useState<[number, number]>(
    value ? [value.lat, value.lon] : defaultCenter,
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Sync external value → marker (when autocomplete selects an address)
  useEffect(() => {
    if (value) {
      setPosition([value.lat, value.lon]);
      setFlyTarget([value.lat, value.lon]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lon]);

  async function handleMove(lat: number, lng: number) {
    setPosition([lat, lng]);
    setFlyTarget(null);
    const result = await reverseGeocode(lat, lng);
    if (result) {
      onLocationSelect(result);
    } else {
      onLocationSelect({
        placeId: `${lat},${lng}`,
        displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lon: lng,
      });
    }
  }

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setPosition([lat, lng]);
        setFlyTarget([lat, lng]);
        const result = await reverseGeocode(lat, lng);
        if (result) {
          onLocationSelect(result);
        } else {
          onLocationSelect({
            placeId: `${lat},${lng}`,
            displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lon: lng,
          });
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { timeout: 10000 },
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden border">
      {/* Leaflet CSS */}
      <style>{`@import "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";`}</style>

      {/* "Ma position" button overlay */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleGeolocate}
          disabled={isLocating}
          className="shadow-md"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          <span className="ml-1.5">
            {isLocating ? "Détection…" : "Ma position"}
          </span>
        </Button>
      </div>

      <MapContainer
        center={position}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={7}
        maxBounds={BENIN_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={false}
        style={{ height: "260px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <DraggableMarker position={position} onMove={handleMove} />
        <FlyToController target={flyTarget} />
      </MapContainer>
    </div>
  );
}
