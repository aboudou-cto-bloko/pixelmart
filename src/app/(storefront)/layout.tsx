import { HeaderNav } from "@/components/layout";
import { FooterFull } from "@/components/storefront/organisms";
import { ChatwayScript } from "@/components/atoms/ChatwayScript";
import { ScrollToTop } from "@/components/atoms/ScrollToTop";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Passer au contenu principal
      </a>
      <HeaderNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <FooterFull />
      <ChatwayScript />
      <ScrollToTop />
    </div>
  );
}
