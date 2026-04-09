// filepath: src/components/marketing/LandingNav.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PixelMartLogoSvg } from "./PixelMartLogoSvg";

export function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/landing" className="flex items-center">
          <img
            src="/Pixel-Mart-1.png"
            alt="Pixel-Mart"
            className="h-35 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">S&apos;inscrire</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
