// filepath: convex/affiliate/helpers.ts

/**
 * Génère un code affilié unique lisible (sans I, O, 0, 1 ambigus).
 * Ex : "PM-AFF-X7K2Q3"
 */
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAffiliateCode(): string {
  let code = "PM-AFF-";
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
