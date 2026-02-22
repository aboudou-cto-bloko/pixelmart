// filepath: src/lib/validations/vendor.ts

import { z } from "zod";

export const vendorOnboardingSchema = z.object({
  store_name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(60, "Le nom ne peut pas dépasser 60 caractères")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-'.]+$/, "Caractères spéciaux non autorisés"),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .or(z.literal("")),
  country: z.enum(["BJ", "SN", "CI", "TG", "BF", "ML", "NE", "GN"], {
    required_error: "Sélectionnez un pays",
  }),
});

export type VendorOnboardingValues = z.infer<typeof vendorOnboardingSchema>;

export const SUPPORTED_COUNTRIES = [
  { code: "BJ", name: "Bénin", currency: "XOF" },
  { code: "SN", name: "Sénégal", currency: "XOF" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF" },
  { code: "TG", name: "Togo", currency: "XOF" },
  { code: "BF", name: "Burkina Faso", currency: "XOF" },
  { code: "ML", name: "Mali", currency: "XOF" },
  { code: "NE", name: "Niger", currency: "XOF" },
  { code: "GN", name: "Guinée", currency: "GNF" },
] as const;
