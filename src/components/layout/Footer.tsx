import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const FOOTER_LINKS = {
  marketplace: [
    { label: "Catalogue", href: ROUTES.PRODUCTS },
    { label: "Boutiques", href: ROUTES.STORES },
  ],
  vendor: [
    { label: "Devenir vendeur", href: ROUTES.ONBOARDING_VENDOR },
    { label: "Tarifs", href: "/pricing" },
    { label: "Guide vendeur", href: "/guide" },
  ],
  support: [
    { label: "Centre d'aide", href: "/help" },
    { label: "Contact", href: "/contact" },
    { label: "CGV", href: "/terms" },
    { label: "Confidentialité", href: "/privacy" },
  ],
} as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold text-primary">Pixel</span>
              <span className="text-xl font-bold">-Mart</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              La marketplace africaine pour les entrepreneurs. Vendez vos
              produits, acceptez Mobile Money et cartes bancaires.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Marketplace</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.marketplace.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vendeurs */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Vendeurs</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.vendor.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Support</h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Pixel-Mart. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
