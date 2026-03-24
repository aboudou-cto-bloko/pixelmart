// filepath: src/components/vendor-shop/organisms/ShopFooter.tsx

import Link from "next/link";

interface ShopFooterProps {
  storeName: string;
  storeSlug: string;
}

export function ShopFooter({ storeName, storeSlug }: ShopFooterProps) {
  const basePath = `/shop/${storeSlug}`;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold mb-3">{storeName}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Votre boutique en ligne de confiance.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Navigation</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={basePath}
                  className="hover:text-foreground transition-colors"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/products`}
                  className="hover:text-foreground transition-colors"
                >
                  Produits
                </Link>
              </li>
              <li>
                <Link
                  href={`${basePath}/cart`}
                  className="hover:text-foreground transition-colors"
                >
                  Panier
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  CGV
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Plateforme */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Plateforme</h4>
            <p className="text-sm text-muted-foreground">
              Propulsé par{" "}
              <Link
                href="/"
                className="hover:underline"
                style={{ color: "var(--shop-primary, #6366f1)" }}
              >
                Pixel-Mart
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          © {currentYear} {storeName}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
