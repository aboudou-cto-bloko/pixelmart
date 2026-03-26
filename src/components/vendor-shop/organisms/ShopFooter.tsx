// filepath: src/components/vendor-shop/organisms/ShopFooter.tsx

import Link from "next/link";
import { Phone, Mail, Globe, MessageCircle } from "lucide-react";

interface Contact {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
}

interface ShopFooterProps {
  storeName: string;
  storeSlug: string;
  contact?: Contact | null;
}

export function ShopFooter({ storeName, storeSlug, contact }: ShopFooterProps) {
  const basePath = `/shop/${storeSlug}`;
  const currentYear = new Date().getFullYear();

  const hasContact =
    contact &&
    (contact.phone ||
      contact.whatsapp ||
      contact.email ||
      contact.website ||
      contact.facebook ||
      contact.instagram);

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
            </ul>
          </div>

          {/* Contact */}
          {hasContact ? (
            <div>
              <h4 className="font-medium mb-3 text-sm">Nous contacter</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {contact.phone && (
                  <li>
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      <Phone className="size-3.5 shrink-0" />
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.whatsapp && (
                  <li>
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="size-3.5 shrink-0" />
                      WhatsApp
                    </a>
                  </li>
                )}
                {contact.email && (
                  <li>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      <Mail className="size-3.5 shrink-0" />
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact.website && (
                  <li>
                    <a
                      href={
                        contact.website.startsWith("http")
                          ? contact.website
                          : `https://${contact.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      <Globe className="size-3.5 shrink-0" />
                      Site web
                    </a>
                  </li>
                )}
                {contact.facebook && (
                  <li>
                    <a
                      href={
                        contact.facebook.startsWith("http")
                          ? contact.facebook
                          : `https://facebook.com/${contact.facebook}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      Facebook
                    </a>
                  </li>
                )}
                {contact.instagram && (
                  <li>
                    <a
                      href={
                        contact.instagram.startsWith("http")
                          ? contact.instagram
                          : `https://instagram.com/${contact.instagram.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            </div>
          ) : (
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
          )}

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
