// filepath: src/lib/validation/product.ts

import { z } from "zod";
import DOMPurify from "dompurify";
import type { Id } from "../../../convex/_generated/dataModel";

// HTML sanitization configuration
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h3",
  "h4",
  "h5",
  "h6",
];

const ALLOWED_ATTR = ["style"];

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: basic tag stripping (fallback)
    return html.replace(/<[^>]*>/g, "");
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

/**
 * Validates if a string is a valid Convex ID format
 */
export function isValidConvexId(id: string): boolean {
  // Convex IDs are base32-encoded strings with specific pattern
  return /^[a-z0-9]{32}$/.test(id);
}

/**
 * Validates and sanitizes a potential Convex ID
 */
export function validateConvexId(id: string, table: string): string {
  if (!isValidConvexId(id)) {
    throw new Error(`Invalid ${table} ID format`);
  }
  return id;
}

/**
 * Sanitizes and validates tags array
 */
export function sanitizeTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 50)
    .filter((tag) => /^[a-zA-Z0-9\s\-_]+$/.test(tag)) // Allow only alphanumeric, spaces, hyphens, underscores
    .slice(0, 10); // Max 10 tags
}

/**
 * Product form validation schema
 */
export const productFormSchema = z
  .object({
    title: z
      .string()
      .min(2, "Le titre doit contenir au moins 2 caractères")
      .max(200, "Le titre ne peut pas dépasser 200 caractères")
      .refine(
        (val) => !/[<>"'&]/.test(val),
        "Le titre contient des caractères non autorisés",
      ),

    description: z
      .string()
      .min(10, "La description doit contenir au moins 10 caractères")
      .max(10000, "La description ne peut pas dépasser 10 000 caractères")
      .transform(sanitizeHTML),

    shortDescription: z
      .string()
      .max(160, "La description courte ne peut pas dépasser 160 caractères")
      .optional()
      .transform((val) => (val ? sanitizeHTML(val) : undefined)),

    categoryId: z
      .string()
      .min(1, "Veuillez sélectionner une catégorie")
      .refine(isValidConvexId, "ID de catégorie invalide"),

    tags: z
      .string()
      .max(500, "Les tags ne peuvent pas dépasser 500 caractères")
      .transform(sanitizeTags),

    price: z
      .number()
      .min(1, "Le prix doit être supérieur à 0")
      .max(10000000, "Le prix ne peut pas dépasser 10 000 000 XOF"), // 100M centimes = 1M XOF

    comparePrice: z
      .number()
      .min(1, "Le prix barré doit être supérieur à 0")
      .max(10000000, "Le prix barré ne peut pas dépasser 10 000 000 XOF")
      .optional(),

    costPrice: z
      .number()
      .min(0, "Le prix d'achat ne peut pas être négatif")
      .max(10000000, "Le prix d'achat ne peut pas dépasser 10 000 000 XOF")
      .optional(),

    sku: z
      .string()
      .max(100, "Le SKU ne peut pas dépasser 100 caractères")
      .regex(
        /^[A-Za-z0-9\-_]*$/,
        "Le SKU ne peut contenir que des lettres, chiffres, tirets et underscores",
      )
      .optional(),

    barcode: z
      .string()
      .max(50, "Le code-barres ne peut pas dépasser 50 caractères")
      .regex(/^[0-9]*$/, "Le code-barres ne peut contenir que des chiffres")
      .optional(),

    quantity: z
      .number()
      .min(0, "La quantité ne peut pas être négative")
      .max(1000000, "La quantité ne peut pas dépasser 1 000 000"),

    lowStockThreshold: z
      .number()
      .min(0, "Le seuil d'alerte ne peut pas être négatif")
      .max(10000, "Le seuil d'alerte ne peut pas dépasser 10 000"),

    weight: z
      .number()
      .min(0, "Le poids ne peut pas être négatif")
      .max(1000000, "Le poids ne peut pas dépasser 1 000 kg")
      .optional(),

    color: z
      .string()
      .max(50, "La couleur ne peut pas dépasser 50 caractères")
      .regex(
        /^[a-zA-Z0-9\s\-_#(),.À-ÿĀ-ž]*$/,
        "Format de couleur invalide - utilisez des lettres, chiffres, espaces et caractères de base",
      )
      .optional(),

    material: z
      .string()
      .max(100, "Le matériau ne peut pas dépasser 100 caractères")
      .refine(
        (val) => !val || !/[<>"'&]/.test(val),
        "Le matériau contient des caractères non autorisés",
      )
      .optional(),

    dimensions: z
      .string()
      .max(100, "Les dimensions ne peuvent pas dépasser 100 caractères")
      .refine(
        (val) => !val || !/[<>"'&]/.test(val),
        "Les dimensions contiennent des caractères non autorisés",
      )
      .optional(),

    seoTitle: z
      .string()
      .max(60, "Le titre SEO ne peut pas dépasser 60 caractères")
      .refine(
        (val) => !val || !/[<>"'&]/.test(val),
        "Le titre SEO contient des caractères non autorisés",
      )
      .optional(),

    seoDescription: z
      .string()
      .max(160, "La meta description ne peut pas dépasser 160 caractères")
      .refine(
        (val) => !val || !/[<>"'&]/.test(val),
        "La meta description contient des caractères non autorisés",
      )
      .optional(),

    seoKeywords: z
      .string()
      .max(255, "Les mots-clés SEO ne peuvent pas dépasser 255 caractères")
      .refine(
        (val) => !val || !/[<>"'&]/.test(val),
        "Les mots-clés SEO contiennent des caractères non autorisés",
      )
      .optional(),

    images: z
      .array(z.string())
      .min(1, "Au moins une image est requise")
      .max(10, "Maximum 10 images par produit"),
  })
  .refine(
    (data) => {
      // Validate price relationships
      if (data.comparePrice && data.comparePrice <= data.price) {
        return false;
      }
      return true;
    },
    {
      message: "Le prix barré doit être supérieur au prix de vente",
      path: ["comparePrice"],
    },
  )
  .refine(
    (data) => {
      // Validate cost vs selling price
      if (data.costPrice && data.costPrice > data.price) {
        return false;
      }
      return true;
    },
    {
      message: "Le prix d'achat ne peut pas être supérieur au prix de vente",
      path: ["costPrice"],
    },
  );

export type ProductFormData = z.infer<typeof productFormSchema>;

/**
 * Safe error formatting to prevent information disclosure
 */
export function formatValidationError(error: z.ZodError): string {
  const firstError = error.issues[0];
  return firstError?.message || "Données invalides";
}
