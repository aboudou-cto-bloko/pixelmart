// filepath: src/lib/validation/store-settings.ts

import { z } from "zod";
import { sanitizeHTML } from "./product";

/**
 * File validation utilities
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

/**
 * Validate file before upload
 */
export async function validateImageFile(
  file: File,
): Promise<{ isValid: boolean; error?: string }> {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: "Le fichier est trop volumineux (max 5MB)",
    };
  }

  if (file.size === 0) {
    return { isValid: false, error: "Le fichier est vide" };
  }

  // MIME type check
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: "Format de fichier non supporté (JPEG, PNG, WebP uniquement)",
    };
  }

  // File signature validation (magic numbers)
  try {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    if (!isValidImageSignature(uint8Array)) {
      return {
        isValid: false,
        error: "Le fichier ne semble pas être une image valide",
      };
    }
  } catch {
    return { isValid: false, error: "Impossible de lire le fichier" };
  }

  return { isValid: true };
}

/**
 * Check file signature (magic numbers) to verify it's actually an image
 */
function isValidImageSignature(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;

  // JPEG signature: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return true;
  }

  // WebP signature: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return true;
  }

  return false;
}

/**
 * Store name validation - alphanumeric, spaces, hyphens, apostrophes, international chars
 */
const storeNameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff0-9\s'-]+$/;

/**
 * Hex color validation - accepts 3 or 6 digit hex colors
 */
const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Store settings validation schema
 */
export const storeSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .regex(storeNameRegex, "Le nom contient des caractères non autorisés")
    .refine((name) => name.trim().length >= 2, "Le nom ne peut pas être vide")
    .transform((name) => name.trim()),

  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .transform((desc) => (desc ? sanitizeHTML(desc.trim()) : ""))
    .optional(),

  primaryColor: z
    .string()
    .regex(hexColorRegex, "Format de couleur invalide (ex: #6366f1 ou #fff)")
    .refine((color) => {
      // Additional validation for common invalid colors
      const invalidColors = ["#000000", "#ffffff", "#fff", "#000"];
      return !invalidColors.includes(color.toLowerCase());
    }, "Veuillez choisir une couleur plus distinctive"),

  country: z
    .string()
    .length(2, "Code pays invalide")
    .regex(/^[A-Z]{2}$/, "Format de code pays invalide"),

  currency: z.enum(["XOF", "EUR", "USD"], {
    message: "Devise non supportée",
  }),
});

/**
 * Delivery settings validation schema
 */
export const deliverySettingsSchema = z
  .object({
    use_pixelmart_service: z.boolean(),
    has_storage_plan: z.boolean(),

    custom_pickup_lat: z
      .number()
      .min(-90, "Latitude invalide")
      .max(90, "Latitude invalide")
      .optional(),

    custom_pickup_lon: z
      .number()
      .min(-180, "Longitude invalide")
      .max(180, "Longitude invalide")
      .optional(),

    custom_pickup_label: z
      .string()
      .min(5, "L'adresse doit contenir au moins 5 caractères")
      .max(200, "L'adresse ne peut pas dépasser 200 caractères")
      .optional(),
  })
  .refine(
    (data) => {
      // delivery_only mode (service=true, storage=false) requires custom pickup
      const isDeliveryOnly = data.use_pixelmart_service && !data.has_storage_plan;
      if (isDeliveryOnly) {
        return (
          data.custom_pickup_lat !== undefined &&
          data.custom_pickup_lon !== undefined &&
          data.custom_pickup_label !== undefined
        );
      }
      return true;
    },
    {
      message: "L'adresse de retrait personnalisée est requise",
      path: ["custom_pickup_label"],
    },
  );

/**
 * Type definitions
 */
export type StoreSettingsData = z.infer<typeof storeSettingsSchema>;
export type DeliverySettingsData = z.infer<typeof deliverySettingsSchema>;

/**
 * Safe error messages for settings operations
 */
export const SETTINGS_ERROR_MESSAGES: Record<string, string> = {
  // File upload errors
  UPLOAD_FAILED: "Erreur lors de l'upload. Veuillez réessayer.",
  FILE_TOO_LARGE: "Le fichier est trop volumineux (max 5MB)",
  INVALID_FILE_TYPE: "Format de fichier non supporté",
  INVALID_FILE_SIGNATURE: "Le fichier ne semble pas être une image valide",
  FILE_EMPTY: "Le fichier est vide",
  FILE_READ_ERROR: "Impossible de lire le fichier",

  // Settings errors
  SAVE_FAILED: "Erreur lors de la sauvegarde. Veuillez réessayer.",
  INVALID_STORE_NAME: "Nom de boutique invalide",
  INVALID_DESCRIPTION: "Description invalide",
  INVALID_COLOR: "Format de couleur invalide",
  INVALID_COUNTRY: "Pays non supporté",
  INVALID_CURRENCY: "Devise non supportée",
  INVALID_LOCATION: "Adresse de retrait invalide",

  // Rate limiting
  TOO_MANY_REQUESTS:
    "Trop de tentatives. Veuillez patienter quelques instants.",
  UPLOAD_COOLDOWN: "Veuillez attendre avant d'uploader à nouveau",
  SAVE_COOLDOWN: "Veuillez attendre avant de sauvegarder à nouveau",

  // Authorization
  UNAUTHORIZED: "Vous n'êtes pas autorisé à effectuer cette action",
  STORE_NOT_FOUND: "Boutique introuvable",
  PENDING_ORDERS:
    "Impossible de modifier ces paramètres avec des commandes en cours",

  // Generic fallback
  UNKNOWN_ERROR: "Une erreur inattendue est survenue. Veuillez réessayer.",
};

/**
 * Get safe error message for display
 */
export function getSafeSettingsErrorMessage(error: unknown): string {
  if (!error) return SETTINGS_ERROR_MESSAGES.UNKNOWN_ERROR;

  // Type guard for error-like objects
  const isErrorLike = (
    err: unknown,
  ): err is { code?: string; type?: string; message?: string } =>
    typeof err === "object" && err !== null;

  if (!isErrorLike(error)) {
    return SETTINGS_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Check if error has a known code/type
  const errorCode = error.code || error.type || error.message;

  // Map specific error codes to safe messages
  if (errorCode && SETTINGS_ERROR_MESSAGES[errorCode]) {
    return SETTINGS_ERROR_MESSAGES[errorCode];
  }

  // Handle specific error patterns
  if (error.message && error.message.toLowerCase().includes("file")) {
    if (error.message.toLowerCase().includes("size")) {
      return SETTINGS_ERROR_MESSAGES.FILE_TOO_LARGE;
    }
    if (error.message.toLowerCase().includes("type")) {
      return SETTINGS_ERROR_MESSAGES.INVALID_FILE_TYPE;
    }
    return SETTINGS_ERROR_MESSAGES.UPLOAD_FAILED;
  }

  if (error.message && error.message.toLowerCase().includes("unauthorized")) {
    return SETTINGS_ERROR_MESSAGES.UNAUTHORIZED;
  }

  if (error.message && error.message.toLowerCase().includes("name")) {
    return SETTINGS_ERROR_MESSAGES.INVALID_STORE_NAME;
  }

  if (error.message && error.message.toLowerCase().includes("color")) {
    return SETTINGS_ERROR_MESSAGES.INVALID_COLOR;
  }

  // Generic fallback for security
  return SETTINGS_ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private static lastActions: Map<string, number> = new Map();

  static checkRateLimit(
    action: string,
    cooldownMs: number,
  ): { allowed: boolean; remainingTime?: number } {
    const now = Date.now();
    const lastTime = this.lastActions.get(action) || 0;
    const timeSinceLastAction = now - lastTime;

    if (timeSinceLastAction < cooldownMs) {
      return {
        allowed: false,
        remainingTime: cooldownMs - timeSinceLastAction,
      };
    }

    this.lastActions.set(action, now);
    return { allowed: true };
  }

  static formatRemainingTime(remainingMs: number): string {
    const seconds = Math.ceil(remainingMs / 1000);
    return `${seconds} seconde${seconds > 1 ? "s" : ""}`;
  }
}
