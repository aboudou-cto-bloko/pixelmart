import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en centimes vers un prix lisible
 *
 * XOF: 150000 centimes → "1 500 FCFA" (pas de décimales)
 * EUR: 1500 centimes → "15,00 €"
 */
export function formatPrice(
  centimes: number,
  currency: string = "XOF",
  locale: string = "fr-FR",
): string {
  const amount = centimes / 100;

  // XOF/XAF have 0 decimal places
  const noDecimalCurrencies = ["XOF", "XAF", "GNF", "CDF"];
  const minimumFractionDigits = noDecimalCurrencies.includes(currency) ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(amount);
}

/**
 * Formate une date timestamp (Unix ms) en date lisible
 */
export function formatDate(
  timestamp: number,
  locale: string = "fr-FR",
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

/**
 * Génère un slug URL-safe à partir d'un string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
