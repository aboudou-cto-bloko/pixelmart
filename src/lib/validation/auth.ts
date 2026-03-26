// filepath: src/lib/validation/auth.ts

import { z } from "zod";

/**
 * Validate name format - only letters, spaces, apostrophes, hyphens
 * Supports French and international characters
 */
const nameRegex = /^[a-zA-ZÀ-ÿĀ-žА-я\u4e00-\u9fff\s'-]+$/;

/**
 * Strong password validation - requires:
 * - At least 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>[\]\\`~;+=_-])/;

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(254, "L'email est trop long")
    .email("Format d'email invalide")
    .toLowerCase()
    .refine(
      (email) => !email.includes("+"),
      "Les alias email ne sont pas autorisés",
    ),

  password: z
    .string()
    .min(1, "Le mot de passe est requis")
    .max(128, "Le mot de passe est trop long"),
});

/**
 * Registration form validation schema
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom ne peut pas dépasser 100 caractères")
      .regex(nameRegex, "Le nom contient des caractères non autorisés")
      .refine((name) => name.trim().length >= 2, "Le nom ne peut pas être vide")
      .transform((name) => name.trim()),

    email: z
      .string()
      .min(1, "L'email est requis")
      .max(254, "L'email est trop long")
      .email("Format d'email invalide")
      .toLowerCase()
      .refine(
        (email) => !email.includes("+"),
        "Les alias email ne sont pas autorisés",
      )
      .refine(
        (email) => !email.endsWith(".test"),
        "Email de test non autorisé",
      ),

    password: z
      .string()
      .min(12, "Le mot de passe doit contenir au moins 12 caractères")
      .max(128, "Le mot de passe ne peut pas dépasser 128 caractères")
      .regex(
        strongPasswordRegex,
        "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial",
      ),

    confirmPassword: z
      .string()
      .min(1, "La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .max(254, "L'email est trop long")
    .email("Format d'email invalide")
    .toLowerCase(),
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z
  .object({
    password: z
      .string()
      .min(12, "Le mot de passe doit contenir au moins 12 caractères")
      .max(128, "Le mot de passe ne peut pas dépasser 128 caractères")
      .regex(
        strongPasswordRegex,
        "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial",
      ),

    confirmPassword: z
      .string()
      .min(1, "La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

/**
 * Type definitions
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PasswordResetRequestData = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;

/**
 * Safe error message mapping for auth errors
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Registration errors
  EMAIL_ALREADY_EXISTS: "Cet email est déjà utilisé",
  WEAK_PASSWORD: "Le mot de passe ne respecte pas les critères de sécurité",
  INVALID_EMAIL: "Format d'email invalide",
  USER_CREATION_FAILED: "Erreur lors de la création du compte",

  // Login errors
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
  EMAIL_NOT_VERIFIED: "Email non vérifié. Vérifiez votre boîte de réception.",
  ACCOUNT_LOCKED:
    "Compte temporairement verrouillé après plusieurs tentatives de connexion échouées",
  TOO_MANY_REQUESTS:
    "Trop de tentatives. Veuillez réessayer dans quelques minutes.",

  // Password reset errors
  USER_NOT_FOUND: "Aucun compte associé à cet email",
  INVALID_TOKEN: "Lien de réinitialisation invalide ou expiré",
  TOKEN_EXPIRED: "Lien de réinitialisation expiré",

  // Generic fallback
  UNKNOWN_ERROR: "Une erreur inattendue est survenue. Veuillez réessayer.",
};

/**
 * Get safe error message for display
 */
export function getSafeErrorMessage(error: unknown): string {
  if (!error) return AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;

  // Type guard for error-like objects
  const isErrorLike = (
    err: unknown,
  ): err is {
    code?: string;
    type?: string;
    message?: string;
    status?: number;
  } => typeof err === "object" && err !== null;

  if (!isErrorLike(error)) {
    return AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // Check if error has a known code/type
  const errorCode = error.code || error.type || error.message;

  // Map specific error codes to safe messages
  if (errorCode && AUTH_ERROR_MESSAGES[errorCode]) {
    return AUTH_ERROR_MESSAGES[errorCode];
  }

  // Handle specific error patterns
  if (error.status === 403) {
    return AUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED;
  }

  if (error.status === 429) {
    return AUTH_ERROR_MESSAGES.TOO_MANY_REQUESTS;
  }

  if (error.message && error.message.toLowerCase().includes("email")) {
    return AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
  }

  if (error.message && error.message.toLowerCase().includes("password")) {
    return AUTH_ERROR_MESSAGES.WEAK_PASSWORD;
  }

  // Generic fallback for security
  return AUTH_ERROR_MESSAGES.UNKNOWN_ERROR;
}
