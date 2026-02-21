// filepath: src/app/page.tsx

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Pixel-Mart</h1>
        <p className="text-muted-foreground text-lg">
          Marketplace Multi-Vendeurs — Phase 0 Bootstrap
        </p>
        <div className="flex gap-2 justify-center text-sm text-muted-foreground">
          <span>Next.js 14</span>
          <span>•</span>
          <span>Convex</span>
          <span>•</span>
          <span>Better Auth</span>
          <span>•</span>
          <span>shadcn/ui</span>
        </div>
      </div>
    </main>
  );
}
