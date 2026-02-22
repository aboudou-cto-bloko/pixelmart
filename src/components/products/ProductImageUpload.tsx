"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, GripVertical, Loader2 } from "lucide-react";
import Image from "next/image";

interface ProductImageUploadProps {
  images: string[]; // storageIds
  imageUrls: string[]; // resolved URLs for preview
  onChange: (storageIds: string[]) => void;
  maxImages?: number;
}

export function ProductImageUpload({
  images,
  imageUrls,
  onChange,
  maxImages = 10,
}: ProductImageUploadProps) {
  const generateUploadUrl = useMutation(api.files.mutations.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remaining = maxImages - images.length;
      if (remaining <= 0) return;

      const filesToUpload = Array.from(files).slice(0, remaining);
      setUploading(true);

      try {
        const newIds: string[] = [];

        for (const file of filesToUpload) {
          // Validation côté client
          if (!file.type.startsWith("image/")) continue;
          if (file.size > 5 * 1024 * 1024) continue; // 5 Mo max

          // Step 1: Get upload URL
          const uploadUrl = await generateUploadUrl();

          // Step 2: POST file
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!result.ok) continue;

          const { storageId } = await result.json();
          newIds.push(storageId as string);
        }

        if (newIds.length > 0) {
          onChange([...images, ...newIds]);
        }
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [images, maxImages, onChange, generateUploadUrl],
  );

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  }

  // ---- Drag & Drop reorder ----
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    onChange(reordered);
    setDragIndex(index);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  // ---- Drop zone ----
  function handleDropZone(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Images ({images.length}/{maxImages})
        </p>
        {images.length > 0 && (
          <p className="text-xs text-muted-foreground">
            La première image est la photo principale
          </p>
        )}
      </div>

      {/* Grid de previews */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {imageUrls.map((url, index) => (
          <div
            key={images[index]}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`group relative aspect-square overflow-hidden rounded-lg border bg-muted ${
              dragIndex === index ? "opacity-50" : ""
            } ${index === 0 ? "ring-2 ring-primary" : ""}`}
          >
            <Image
              src={url}
              alt={`Produit ${index + 1}`}
              className="h-full w-full object-cover"
            />

            {/* Overlay actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                className="cursor-grab rounded p-1 text-white hover:bg-white/20"
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={() => handleRemove(index)}
                className="rounded p-1 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Badge "principale" */}
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Principale
              </span>
            )}
          </div>
        ))}

        {/* Zone d'ajout */}
        {images.length < maxImages && (
          <div
            onDrop={handleDropZone}
            onDragOver={(e) => e.preventDefault()}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Ajouter</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground">
        JPG, PNG ou WebP. Max 5 Mo par image. Glissez pour réordonner.
      </p>
    </div>
  );
}
