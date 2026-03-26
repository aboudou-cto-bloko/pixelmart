// filepath: src/components/marketing/LandingFooter.tsx

import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/30 py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <img src="/Pixel-Mart.png" alt="Pixel-Mart" className="h-25 w-auto" />

          <div className="flex gap-6 text-xs text-muted-foreground/50">
            <Link
              href="/terms"
              className="transition-colors hover:text-muted-foreground"
            >
              CGV
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-muted-foreground"
            >
              Confidentialité
            </Link>
            <a
              href="mailto:hello@pixelmart.bj"
              className="transition-colors hover:text-muted-foreground"
            >
              Contact
            </a>
          </div>

          <p className="text-xs text-muted-foreground/35">
            © {new Date().getFullYear()} Pixel-Mart. Bénin
          </p>
        </div>
      </div>
    </footer>
  );
}
