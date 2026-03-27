// filepath: src/app/layout.tsx

import type { Metadata } from "next";
import { Poppins, Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { CartProvider } from "@/providers/CartProvider";
import { Toaster } from "sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pixel-mart.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pixel-Mart — Marketplace Multi-Vendeurs",
    template: "%s | Pixel-Mart",
  },
  description:
    "La marketplace africaine pour les entrepreneurs. Vendez vos produits, acceptez Mobile Money et cartes bancaires.",
  keywords: [
    "marketplace",
    "e-commerce",
    "Bénin",
    "Afrique de l'Ouest",
    "Mobile Money",
    "achat en ligne",
    "vente en ligne",
    "FCFA",
  ],
  authors: [{ name: "Pixel-Mart" }],
  creator: "Pixel-Mart",
  publisher: "Pixel-Mart",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "Pixel-Mart",
    title: "Pixel-Mart — Marketplace Multi-Vendeurs",
    description:
      "La marketplace africaine pour les entrepreneurs. Vendez vos produits, acceptez Mobile Money et cartes bancaires.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pixel-Mart — Marketplace Multi-Vendeurs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel-Mart — Marketplace Multi-Vendeurs",
    description:
      "La marketplace africaine pour les entrepreneurs. Vendez vos produits, acceptez Mobile Money et cartes bancaires.",
    images: ["/og-image.png"],
    creator: "@pixelmart",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pixel-Mart",
  url: siteUrl,
  logo: `${siteUrl}/icons/icon-512.png`,
  description:
    "La marketplace africaine pour les entrepreneurs. Vendez vos produits, acceptez Mobile Money et cartes bancaires.",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "French",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body
        className={`${poppins.variable} ${montserrat.variable} antialiased`}
      >
        <ConvexClientProvider>
          <ThemeProvider>
            <CartProvider>
              <TooltipProvider>
                {children}
                <Toaster richColors position="bottom-right" />
              </TooltipProvider>
            </CartProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
