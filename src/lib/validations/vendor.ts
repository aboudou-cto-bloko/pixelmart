import { z } from "zod";
import { SUPPORTED_COUNTRIES, type CountryCode } from "@/constants/countries";

// Extraire les codes pays dynamiquement depuis la source de vérité
const countryCodes = SUPPORTED_COUNTRIES.map((c) => c.code) as [
  CountryCode,
  ...CountryCode[],
];

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
  country: z.enum(countryCodes, {
    message: "Sélectionnez un pays",
  }),
});

export type VendorOnboardingValues = z.infer<typeof vendorOnboardingSchema>;
