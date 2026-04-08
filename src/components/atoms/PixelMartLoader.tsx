// filepath: src/components/atoms/PixelMartLoader.tsx

import { cn } from "@/lib/utils";
import Image from "next/image";

interface PixelMartLoaderProps {
  /** Centre le loader en plein écran avec fond `background` */
  fullscreen?: boolean;
  /** Taille du logo en px (défaut : 64) */
  size?: number;
  className?: string;
}

/**
 * Loader brandé Pixel-Mart.
 * Utilise le logo clair en mode light et le logo sombre en mode dark.
 * Animation "breathing" — scale + opacity cyclique.
 */
export function PixelMartLoader({
  fullscreen = false,
  size = 64,
  className,
}: PixelMartLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullscreen && "fixed inset-0 z-50 bg-background",
        className,
      )}
      role="status"
      aria-label="Chargement…"
    >
      <div className="animate-pm-breathe">
        {/* Logo sombre — mode light */}
        <Image
          src="/Pixel-Mart.svg"
          alt="Pixel-Mart"
          width={size}
          height={size}
          priority
          className="dark:hidden"
        />
        {/* Logo clair — mode dark */}
        <Image
          src="/Pixel-Mart-1.svg"
          alt="Pixel-Mart"
          width={size}
          height={size}
          priority
          className="hidden dark:block"
        />
      </div>
    </div>
  );
}
