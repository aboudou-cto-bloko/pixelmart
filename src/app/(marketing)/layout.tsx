// filepath: src/app/(marketing)/layout.tsx
// Landing — refonte style Shopify. Sections alternées clair/sombre :
// chaque <Section> porte sa propre tonalité (le wrapper ne force plus `.dark`).

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0a0a] text-foreground antialiased">
      {children}
    </div>
  );
}
