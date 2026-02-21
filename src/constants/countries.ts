export const DEFAULT_CURRENCY = "XOF";
export const DEFAULT_COUNTRY = "BJ";
export const DEFAULT_LOCALE = "fr";

export const SUPPORTED_COUNTRIES = [
  { code: "BJ", name: "Bénin", currency: "XOF", locale: "fr" },
  { code: "SN", name: "Sénégal", currency: "XOF", locale: "fr" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", locale: "fr" },
  { code: "TG", name: "Togo", currency: "XOF", locale: "fr" },
  { code: "BF", name: "Burkina Faso", currency: "XOF", locale: "fr" },
  { code: "ML", name: "Mali", currency: "XOF", locale: "fr" },
  { code: "NE", name: "Niger", currency: "XOF", locale: "fr" },
  { code: "GN", name: "Guinée", currency: "GNF", locale: "fr" },
  { code: "CM", name: "Cameroun", currency: "XAF", locale: "fr" },
  { code: "GA", name: "Gabon", currency: "XAF", locale: "fr" },
  { code: "CD", name: "RD Congo", currency: "CDF", locale: "fr" },
  { code: "FR", name: "France", currency: "EUR", locale: "fr" },
  { code: "BE", name: "Belgique", currency: "EUR", locale: "fr" },
  { code: "CH", name: "Suisse", currency: "CHF", locale: "fr" },
  { code: "CA", name: "Canada", currency: "CAD", locale: "fr" },
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]["code"];
export type CurrencyCode = (typeof SUPPORTED_COUNTRIES)[number]["currency"];
