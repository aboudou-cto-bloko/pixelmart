import { HeaderNav } from "@/components/layout";
import { FooterFull } from "@/components/storefront/organisms";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderNav />
      <main className="flex-1">
        {/* Conteneur centré */}
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
      <FooterFull />
    </div>
  );
}
