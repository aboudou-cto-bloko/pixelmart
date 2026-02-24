// filepath: src/lib/csv-export.ts

/**
 * Génère et télécharge un fichier CSV depuis des données tabulaires.
 * @param filename - Nom du fichier sans extension
 * @param headers - En-têtes des colonnes
 * @param rows - Lignes de données (même ordre que headers)
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: string[][],
): void {
  const BOM = "\uFEFF"; // UTF-8 BOM pour Excel
  const separator = ";"; // Point-virgule pour compatibilité FR

  const headerLine = headers.join(separator);
  const dataLines = rows.map((row) =>
    row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(separator),
  );

  const csv = BOM + [headerLine, ...dataLines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(link.href);
}

/**
 * Formate un montant en centimes pour l'affichage CSV.
 */
export function formatCentimesForCsv(centimes: number): string {
  return (centimes / 100).toFixed(0);
}

/**
 * Formate un timestamp en date locale FR.
 */
export function formatDateForCsv(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
