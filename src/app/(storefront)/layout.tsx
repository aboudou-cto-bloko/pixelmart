import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Conteneur centré */}
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
