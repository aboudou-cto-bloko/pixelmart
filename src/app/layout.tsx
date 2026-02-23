// filepath: src/app/layout.tsx

import type { Metadata } from "next";
import { Poppins, Montserrat } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Pixel-Mart — Marketplace Multi-Vendeurs",
  description:
    "La marketplace africaine pour les entrepreneurs. Vendez vos produits, acceptez Mobile Money et cartes bancaires.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${montserrat.variable} antialiased`}
      >
        <ConvexClientProvider>
          <CartProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </TooltipProvider>
          </CartProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
