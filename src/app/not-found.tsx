import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchX, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <p className="text-5xl font-black text-foreground">404</p>
        <h1 className="text-2xl font-bold text-foreground">Page introuvable</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link href="/">
          <Home className="h-4 w-4" />
          Retour à l&apos;accueil
        </Link>
      </Button>
    </div>
  );
}
