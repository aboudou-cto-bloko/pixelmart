// filepath: src/components/marketing/LandingNav.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PixelMartLogoSvg } from "./PixelMartLogoSvg";

export function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/landing" className="flex items-center">
          <PixelMartLogoSvg className="h-7 w-auto text-foreground" />
        </Link>

        <Button size="sm" asChild>
          <a href="#waitlist">Rejoindre la waitlist</a>
        </Button>
      </div>
    </header>
  );
}
