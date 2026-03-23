// filepath: src/components/storefront/organisms/FooterFull.tsx

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";

const FOOTER_LINKS = {
  marketplace: {
    title: "Pixel-Mart",
    links: [
      { label: "À propos", href: "/about" },
      { label: "Devenir vendeur", href: "/onboarding/vendor" },
      { label: "Contact", href: "/contact" },
      { label: "Blog", href: "/blog" },
    ],
  },
  categories: {
    title: "Top Catégories",
    links: [
      { label: "Électronique", href: "/categories/electronique" },
      { label: "Mode", href: "/categories/mode" },
      { label: "Maison", href: "/categories/maison" },
      { label: "Beauté", href: "/categories/beaute" },
    ],
  },
  customer: {
    title: "Aide",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Livraison", href: "/shipping" },
      { label: "Retours", href: "/returns-policy" },
      { label: "Conditions d'utilisation", href: "/terms" },
    ],
  },
  partner: {
    title: "Partenaire",
    links: [
      { label: "Centre vendeur", href: ROUTES.VENDOR_DASHBOARD },
      { label: "Publicité", href: "/vendor/ads" },
      { label: "Affiliation", href: "/affiliate" },
      { label: "API", href: "/developers" },
    ],
  },
};

const PAYMENT_METHODS = [
  { name: "MTN MoMo", logo: "📱" },
  { name: "Orange Money", logo: "🟠" },
  { name: "Wave", logo: "🌊" },
  { name: "Flooz", logo: "💳" },
  { name: "Visa", logo: "💳" },
];

export function FooterFull() {
  return (
    <footer className="force-dark-theme">
      {/* Main footer */}
      <div className="container px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="text-xl font-bold">
              <span className="text-primary">Pixel</span>-Mart
            </Link>
            <p className="text-sm text-background/60 leading-relaxed">
              La marketplace africaine pour les entrepreneurs. Vendez vos
              produits, acceptez Mobile Money.
            </p>
            <div className="space-y-2 text-sm text-background/60">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" />
                <span>Cotonou, Bénin</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" />
                <span>+229 XX XX XX XX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" />
                <span>contact@pixel-mart-bj.com</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3 pt-2">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.values(FOOTER_LINKS).map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/80">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-background/10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} Pixel-Mart. Tous droits réservés.
          </p>

          {/* Payment methods */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-background/40 mr-1">Paiements :</span>
            {PAYMENT_METHODS.map((method) => (
              <span key={method.name} title={method.name} className="text-lg">
                {method.logo}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
