// filepath: src/components/products/ProductGallery.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRoleLabel } from "@/constants/imageRoles";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        Pas d&apos;image disponible
      </div>
    );
  }

  const selectedRole = imageRoles?.[selectedIndex];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const prev = () =>
    setLightboxIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setLightboxIndex((i) => (i + 1) % images.length);

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-zoom-in group"
          onClick={() => openLightbox(selectedIndex)}
        >
          <Image
            src={images[selectedIndex]}
            alt={`${title} — image ${selectedIndex + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={selectedIndex === 0}
          />
          {/* Zoom hint */}
          <div className="absolute top-3 right-3 size-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="size-4 text-white" />
          </div>
          {/* Role label overlay on main image */}
          {selectedRole && (
            <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {getRoleLabel(selectedRole)}
            </span>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex flex-wrap gap-2 pb-1 md:flex-nowrap md:overflow-x-auto">
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

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          <div className="relative flex items-center justify-center min-h-[50vh] max-h-[90vh]">
            {/* Close */}
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="size-5 text-white" />
            </button>

            {/* Prev */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 z-10 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Image précédente"
              >
                <ChevronLeft className="size-6 text-white" />
              </button>
            )}

            {/* Image */}
            <div className="relative w-full max-h-[85vh] aspect-square sm:aspect-auto sm:h-[80vh]">
              <Image
                src={images[lightboxIndex]}
                alt={`${title} — image ${lightboxIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* Next */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={next}
                className="absolute right-4 z-10 size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Image suivante"
              >
                <ChevronRight className="size-6 text-white" />
              </button>
            )}

            {/* Counter */}
            {images.length > 1 && (
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/40 px-3 py-1 rounded-full">
                {lightboxIndex + 1} / {images.length}
              </span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
