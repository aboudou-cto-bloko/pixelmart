// filepath: convex/lib/format.ts

const NO_DECIMAL = ["XOF", "XAF", "GNF", "CDF"];

/**
 * Formate un montant en centimes en texte lisible côté Convex (Node/Edge).
 * Pour XOF/XAF/GNF/CDF : centimes = valeur d'affichage (aucune division).
 * Pour EUR et autres : centimes ÷ 100.
 */
export function formatAmountText(centimes: number, currency: string): string {
  if (NO_DECIMAL.includes(currency)) {
    const label = currency === "XOF" ? "FCFA" : currency;
    return `${centimes.toLocaleString("fr-FR")} ${label}`;
  }
  return `${(centimes / 100).toFixed(2)} ${currency}`;
}
