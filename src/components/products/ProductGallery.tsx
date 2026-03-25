// filepath: src/components/products/ProductGallery.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/constants/imageRoles";

interface ProductGalleryProps {
  images: string[];
  title: string;
  imageRoles?: string[];
}

export function ProductGallery({
  images,
  title,
  imageRoles,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        Pas d&apos;image disponible
      </div>
    );
  }

  const selectedRole = imageRoles?.[selectedIndex];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <Image
          src={images[selectedIndex]}
          alt={`${title} — image ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority={selectedIndex === 0}
        />
        {/* Role label overlay on main image */}
        {selectedRole && (
          <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {getRoleLabel(selectedRole)}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => {
            const role = imageRoles?.[i];
            return (
              <button
                key={url}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                  i === selectedIndex
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/30",
                  role ? "w-16" : "size-16",
                )}
                style={role ? { width: 64, height: 64 } : undefined}
              >
                <div className="relative size-16">
                  <Image
                    src={url}
                    alt={`${title} — miniature ${i + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                  {/* Role badge on thumbnail */}
                  {role && (
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[9px] leading-tight text-white truncate">
                      {getRoleLabel(role)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
