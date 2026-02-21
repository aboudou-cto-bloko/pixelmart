import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant en centimes vers un prix lisible
 * @param centimes - Montant en centimes (ex: 1500 = 15.00€)
 * @param currency - Code devise ISO (EUR, XOF, USD)
 * @param locale - Locale pour le formatage (fr, en)
 */
export function formatPrice(
  centimes: number,
  currency: string = "EUR",
  locale: string = "fr-FR",
): string {
  const amount = centimes / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "XOF" ? 0 : 2,
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
