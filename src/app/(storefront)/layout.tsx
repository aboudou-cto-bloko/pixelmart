import { HeaderNav } from "@/components/layout";
import { FooterFull } from "@/components/storefront/organisms";
import { ChatwayScript } from "@/components/atoms/ChatwayScript";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderNav />
      <main className="flex-1">{children}</main>
      <FooterFull />
      <ChatwayScript />
    </div>
  );
}
