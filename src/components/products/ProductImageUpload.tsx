// filepath: src/components/products/ProductImageUpload.tsx

"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePlus, X, GripVertical, Loader2 } from "lucide-react";
import Image from "next/image";
import { IMAGE_ROLES, getRoleLabel } from "@/constants/imageRoles";
import { compressImage } from "@/lib/compress-image";

interface ProductImageUploadProps {
  images: string[]; // storageIds
  imageUrls: string[]; // resolved URLs for preview
  imageRoles: string[]; // parallel array of role values
  onChange: (storageIds: string[], roles: string[]) => void;
  maxImages?: number;
}

export function ProductImageUpload({
  images,
  imageUrls,
  imageRoles,
  onChange,
  maxImages = 10,
}: ProductImageUploadProps) {
  const generateUploadUrl = useMutation(api.files.mutations.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Helpers to keep images + roles in sync ----
  function emitChange(newImages: string[], newRoles: string[]) {
    onChange(newImages, newRoles);
  }

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
          if (!file.type.startsWith("image/")) continue;
          if (file.size > 5 * 1024 * 1024) continue; // 5 Mo max

          const compressed = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.82,
          });

          const uploadUrl = await generateUploadUrl();

          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": compressed.type },
            body: compressed,
          });

          if (!result.ok) continue;

          const { storageId } = await result.json();
          newIds.push(storageId as string);
        }

        if (newIds.length > 0) {
          // New images get empty role by default
          const newRoles = [...newIds.map(() => "")];
          emitChange([...images, ...newIds], [...imageRoles, ...newRoles]);
        }
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, imageRoles, maxImages, generateUploadUrl],
  );

  function handleRemove(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    const newRoles = imageRoles.filter((_, i) => i !== index);
    emitChange(newImages, newRoles);
  }

  function handleRoleChange(index: number, role: string) {
    const newRoles = [...imageRoles];
    newRoles[index] = role;
    emitChange(images, newRoles);
  }

  // ---- Drag & Drop reorder ----
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const newImages = [...images];
    const newRoles = [...imageRoles];

    const [movedImg] = newImages.splice(dragIndex, 1);
    const [movedRole] = newRoles.splice(dragIndex, 1);

    newImages.splice(index, 0, movedImg);
    newRoles.splice(index, 0, movedRole);

    emitChange(newImages, newRoles);
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
            Glissez pour réordonner · La première est la photo principale
          </p>
        )}
      </div>

      {/* Grid de previews */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {imageUrls.map((url, index) => (
          <div key={images[index]} className="flex flex-col gap-1.5">
            {/* Image tile */}
            <div
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-square overflow-hidden rounded-lg border bg-muted cursor-grab active:cursor-grabbing ${
                dragIndex === index ? "opacity-50 ring-2 ring-primary/50" : ""
              } ${index === 0 ? "ring-2 ring-primary" : ""}`}
            >
              <Image
                src={url}
                alt={`Produit ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />

              {/* Overlay actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded p-1 text-white">
                  <GripVertical className="h-4 w-4" />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded p-1 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* "Principale" badge on first slot */}
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Principale
                </span>
              )}

              {/* Role badge overlay (when role is set and not editing) */}
              {imageRoles[index] && index !== 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {getRoleLabel(imageRoles[index])}
                </span>
              )}
            </div>

            {/* Role selector below tile */}
            <Select
              value={imageRoles[index] || ""}
              onValueChange={(val) =>
                handleRoleChange(index, val === "_none" ? "" : val)
              }
            >
              <SelectTrigger className="h-7 text-xs px-2">
                <SelectValue placeholder="Catégorie…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="_none"
                  className="text-xs text-muted-foreground"
                >
                  — Sans catégorie
                </SelectItem>
                {IMAGE_ROLES.map((role) => (
                  <SelectItem
                    key={role.value}
                    value={role.value}
                    className="text-xs"
                  >
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {/* Zone d'ajout */}
        {images.length < maxImages && (
          <div className="flex flex-col gap-1.5">
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
            {/* Spacer to align with role selectors */}
            <div className="h-7" />
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
        JPEG, PNG ou WebP · Max 5 Mo · 800×800 px minimum recommandé · Glissez
        pour réordonner
      </p>
    </div>
  );
}
