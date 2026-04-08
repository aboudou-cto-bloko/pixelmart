// filepath: src/app/(admin)/admin/affiliation/[linkId]/page.tsx

"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { AffiliateLinkBadge } from "@/components/affiliate/molecules/AffiliateLinkBadge";
import { AffiliateCodeCard } from "@/components/affiliate/molecules/AffiliateCodeCard";
import { AdminCommissionsTable } from "@/components/affiliate/organisms/AdminCommissionsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/constants/routes";

export default function AdminAffiliateLinkDetailPage() {
  const { linkId } = useParams<{ linkId: string }>();
  const link = useQuery(api.affiliate.queries.getAffiliateLinkDetail, {
    link_id: linkId as Id<"affiliate_links">,
  });
  const commissions = useQuery(api.affiliate.queries.listCommissionsAdmin, {
    paginationOpts: { numItems: 50, cursor: null },
    referrer_store_id: link?.referrer_store_id as Id<"stores"> | undefined,
  });

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pixel-mart-bj.com"
  ).replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href={ROUTES.ADMIN_AFFILIATION}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Détail du lien affilié</h1>
      </div>

      {link === undefined ? (
        <Skeleton className="h-[180px] rounded-xl" />
      ) : link === null ? (
        <p className="text-muted-foreground">Lien introuvable.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Informations</h2>
              <AffiliateLinkBadge is_active={link.is_active} />
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Code & lien
                </p>
                <AffiliateCodeCard
                  code={link.code}
                  referral_url={`${siteUrl}/register?ref=${link.code}`}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Boutique parrain</span>
                <span className="font-medium">
                  {link.referrer_store_name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé par</span>
                <span className="font-medium">
                  {link.created_by_name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taux</span>
                <span className="font-mono font-medium">
                  {(link.commission_rate_bp / 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filleuls</span>
                <span className="font-medium">{link.referral_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiration</span>
                <span className="font-medium">
                  {link.expires_at ? formatDate(link.expires_at) : "Illimité"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-5 space-y-3">
            <h2 className="font-semibold">
              Boutiques filleules ({link.referlee_stores?.length ?? 0})
            </h2>
            {link.referlee_stores && link.referlee_stores.length > 0 ? (
              <ul className="space-y-1">
                {link.referlee_stores.map(
                  (s) =>
                    s && (
                      <li
                        key={s._id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {s.name}
                      </li>
                    ),
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune boutique filleule.
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Commissions générées</h2>
        {commissions ? (
          <AdminCommissionsTable commissions={commissions.page} />
        ) : (
          <Skeleton className="h-[200px] rounded-xl" />
        )}
      </div>
    </div>
  );
}
