// filepath: src/components/demo/templates/AdminDemoTemplate.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DemoInviteForm } from "../organisms/DemoInviteForm";
import { DemoAccountsTable } from "../organisms/DemoAccountsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { FlaskConical, Info } from "lucide-react";

export function AdminDemoTemplate() {
  const invites = useQuery(api.demo.queries.listInvites);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Comptes démo</h1>
          <p className="text-sm text-muted-foreground">
            Invitez des partenaires à tester Pixel-Mart dans un environnement
            sandbox isolé.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Les comptes démo sont des comptes vendeur dont les données (commandes,
          produits, transactions) sont isolées de la production. Les partenaires
          peuvent simuler des paiements et réinitialiser leurs données à tout
          moment via le bouton ci-dessous.
        </p>
      </div>

      {/* Create invite */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Envoyer une invitation</h2>
        <DemoInviteForm />
      </section>

      <Separator />

      {/* Invitations list */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Invitations envoyées</h2>
        {invites === undefined ? (
          <Skeleton className="h-[200px] rounded-xl" />
        ) : (
          <DemoAccountsTable invites={invites} />
        )}
      </section>
    </div>
  );
}
