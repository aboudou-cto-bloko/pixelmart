// filepath: src/components/marketing/PixelMartLogoSvg.tsx
// Logo Pixel-Mart — SVG fidèle au fichier Pixel-Mart.png.
// Icône : M orange solide (polygone rempli) + anneau bleu par-dessus.
// Les deux pics du M remontent dans le centre transparent de l'anneau.

import { cn } from "@/lib/utils";

interface PixelMartLogoSvgProps {
  className?: string;
  /** Affiche uniquement l'icône (mark), sans le texte */
  markOnly?: boolean;
}

export function PixelMartLogoSvg({
  className,
  markOnly = false,
}: PixelMartLogoSvgProps) {
  // ── Mark seul ────────────────────────────────────────────────────────────────
  if (markOnly) {
    return (
      <svg
        viewBox="0 0 56 72"
        className={cn("h-10 w-auto", className)}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Pixel-Mart"
        fill="none"
      >
        {/* M orange — polygone solide, pics remontant dans l'anneau */}
        <path d="M5 70 L20 27 L28 44 L36 27 L51 70 Z" fill="#F97316" />
        {/* Anneau bleu — par-dessus le M, centre transparent */}
        <circle cx="28" cy="21" r="17" stroke="#38BDF8" strokeWidth="7" />
      </svg>
    );
  }

  // ── Logo complet avec wordmark ────────────────────────────────────────────────
  return (
    <svg
      viewBox="0 0 218 48"
      className={cn("h-9 w-auto", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pixel-Mart"
      fill="none"
    >
      {/* M orange — polygone solide, scalé pour 48px de hauteur */}
      <path d="M3 46 L13 18 L19 30 L25 18 L37 46 Z" fill="#F97316" />
      {/* Anneau bleu — par-dessus le M */}
      <circle cx="19" cy="14" r="11" stroke="#38BDF8" strokeWidth="5" />
      {/* Wordmark — currentColor s'adapte au thème */}
      <text
        x="50"
        y="32"
        fill="currentColor"
        fontFamily="Montserrat, 'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="18"
        letterSpacing="1"
      >
        PIXEL-MART
      </text>
    </svg>
  );
}
