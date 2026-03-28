// filepath: src/components/storefront/organisms/FooterFull.tsx

import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/constants/routes";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
  </svg>
);

const FOOTER_LINKS = {
  marketplace: {
    title: "Pixel-Mart",
    links: [
      { label: "À propos", href: "/landing" },
      { label: "Devenir vendeur", href: "/onboarding/vendor" },
      { label: "Contact", href: "/contact" },
    ],
  },
  categories: {
    title: "Top Catégories",
    links: [
      { label: "Électronique", href: "/categories/electronique" },
      { label: "Mode", href: "/categories/mode" },
      { label: "Maison & Déco", href: "/categories/maison-deco" },
      { label: "Beauté & Santé", href: "/categories/beaute-sante" },
    ],
  },
  customer: {
    title: "Aide",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Conditions d'utilisation", href: "/terms" },
      { label: "Confidentialité", href: "/privacy" },
    ],
  },
  partner: {
    title: "Partenaire",
    links: [
      { label: "Centre vendeur", href: ROUTES.VENDOR_DASHBOARD },
      { label: "Publicité", href: "/vendor/ads" },
    ],
  },
};

const PAYMENT_METHODS = [
  { name: "MTN MoMo", src: "/mtn.png" },
  { name: "Orange Money", src: "/orange.png" },
  { name: "Wave", src: "/wave.png" },
  { name: "Visa", src: "/visa.png" },
  { name: "Moov", src: "/moov.png" },
];

const SOCIAL_LINKS = [
  {
    icon: Facebook,
    href: "https://www.facebook.com/share/1crz3ZGXJF/?mibextid=wwXIfr",
    label: "Facebook",
  },
  {
    icon: TikTokIcon,
    href: "https://www.tiktok.com/@pixelmart_bj?_r=1&_t=ZS-951VJKlmyGG",
    label: "TikTok",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/pixelmart_bj?igsh=dGN1eDNieDFvejM4",
    label: "Instagram",
  },
];

export function FooterFull() {
  return (
    <footer className="bg-[#0a0a0a] text-white">
      {/* Top accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

      {/* Main footer */}
      <div className="container mx-auto px-4 py-14 md:py-16">
        <div className="grid gap-10 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column — full width on mobile, centered */}
          <div className="col-span-2 lg:col-span-1 flex flex-col items-center text-center lg:items-start lg:text-left space-y-5">
            <Link href="/" className="inline-block">
              <Image
                src="/Pixel-Mart-1.png"
                alt="Pixel-Mart"
                width={140}
                height={40}
                className="object-contain"
                priority
              />
            </Link>

            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              La marketplace africaine pour les entrepreneurs. Vendez vos
              produits, acceptez Mobile Money.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-center lg:justify-start gap-3 text-white/60 hover:text-white/90 transition-colors">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span>Cotonou, Bénin</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3 text-white/60 hover:text-white/90 transition-colors">
                <Phone className="size-4 shrink-0 text-primary" />
                <span>+229 XX XX XX XX</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-3 text-white/60 hover:text-white/90 transition-colors">
                <Mail className="size-4 shrink-0 text-primary" />
                <span>contact@pixel-mart-bj.com</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-2 pt-1 justify-center lg:justify-start">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-9 items-center justify-center rounded-full border border-white/10 text-white/50 hover:border-primary hover:text-primary transition-all duration-200"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns — 1 col each on mobile (2×2 grid), 1 col on desktop */}
          {Object.values(FOOTER_LINKS).map((section) => (
            <div
              key={section.title}
              className="col-span-1 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
                {section.title}
              </h3>
              <ul className="space-y-3">
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

      <Separator className="bg-white/5" />

      {/* Bottom bar */}
      <div className="container mx-auto px-4 py-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/30 text-center sm:text-left">
            © {new Date().getFullYear()} Pixel-Mart. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs text-white/30">Paiements acceptés :</span>
            <div className="flex items-center gap-2">
              {PAYMENT_METHODS.map((method) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={method.name}
                  src={method.src}
                  alt={method.name}
                  title={method.name}
                  width={28}
                  height={28}
                  className="h-7 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
