// filepath: src/lib/format.ts

/**
 * Formate un montant en centimes vers une chaîne lisible.
 * Gère les devises africaines sans décimales (XOF, XAF, GNF, CDF).
 */
export function formatPrice(
  centimes: number,
  currency: string = "XOF",
): string {
  const amount = centimes / 100;
  const noDecimal = ["XOF", "XAF", "GNF", "CDF"];
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimal.includes(currency) ? 0 : 2,
    maximumFractionDigits: noDecimal.includes(currency) ? 0 : 2,
  }).format(amount);
}

/**
 * Formate un timestamp en date lisible.
 */
export function formatDate(
  timestamp: number,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(new Date(timestamp));
}

/**
 * Formate une date relative (il y a X heures/jours).
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return formatDate(timestamp, { hour: undefined, minute: undefined });
}
