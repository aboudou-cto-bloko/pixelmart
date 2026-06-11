// filepath: src/components/marketing/LandingFooter.tsx
// Footer — fond noir, séparateur net, liens légaux discrets.

import Link from "next/link";
import { ChatwayButton } from "@/components/atoms/ChatwayButton";
import { Section, Container } from "./LandingKit";

export function LandingFooter() {
  return (
    <Section tone="ink" className="border-t border-border py-12">
      <Container>
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <span
            role="img"
            aria-label="Pixel-Mart"
            className="block h-10 w-40 bg-no-repeat"
            style={{
              backgroundImage: "url(/Pixel-Mart-1.png)",
              backgroundSize: "auto 300%",
              backgroundPosition: "left center",
            }}
          />

          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              CGV
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Confidentialité
            </Link>
            <ChatwayButton className="transition-colors hover:text-foreground">
              Contact
            </ChatwayButton>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pixel-Mart · Bénin
          </p>
        </div>
      </Container>
    </Section>
  );
}
