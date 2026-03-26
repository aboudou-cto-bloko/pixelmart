// filepath: src/app/(marketing)/layout.tsx

import { BackgroundColumns } from "@/components/marketing/BackgroundColumns";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark relative min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
      {/* Colonnes de texte subliminal — fixées derrière tout le contenu */}
      <BackgroundColumns />

      {/* Contenu de la page — z-10 pour passer devant les colonnes */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
