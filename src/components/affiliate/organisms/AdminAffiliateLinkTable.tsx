// filepath: src/components/affiliate/organisms/AdminAffiliateLinkTable.tsx

"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AffiliateLinkBadge } from "../molecules/AffiliateLinkBadge";
import { AffiliateCodeCard } from "../molecules/AffiliateCodeCard";
import { ToggleLeft, ToggleRight, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDate } from "@/lib/format";

interface AffiliateLink {
  _id: Id<"affiliate_links">;
  code: string;
  is_active: boolean;
  commission_rate_bp: number;
  referral_count: number;
  expires_at?: number;
  referrer_store_name?: string | null;
}

interface AdminAffiliateLinkTableProps {
  links: AffiliateLink[];
}

export function AdminAffiliateLinkTable({
  links,
}: AdminAffiliateLinkTableProps) {
  const toggleLink = useMutation(api.affiliate.mutations.toggleAffiliateLink);

  async function handleToggle(linkId: Id<"affiliate_links">, current: boolean) {
    try {
      await toggleLink({ link_id: linkId, is_active: !current });
      toast.success(current ? "Lien désactivé" : "Lien activé");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  if (links.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
        Aucun lien affilié créé.
      </div>
    );
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pixel-mart-bj.com"
  ).replace(/\/$/, "");

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code / Lien</TableHead>
            <TableHead>Boutique parrain</TableHead>
            <TableHead className="text-right">Taux</TableHead>
            <TableHead className="text-right">Filleuls</TableHead>
            <TableHead>Expiration</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link._id}>
              <TableCell className="max-w-[200px]">
                <AffiliateCodeCard
                  code={link.code}
                  referral_url={`${siteUrl}/onboarding/vendor?ref=${link.code}`}
                />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {link.referrer_store_name ?? "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {(link.commission_rate_bp / 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {link.referral_count}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {link.expires_at ? formatDate(link.expires_at) : "Illimité"}
              </TableCell>
              <TableCell>
                <AffiliateLinkBadge is_active={link.is_active} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggle(link._id, link.is_active)}
                  >
                    {link.is_active ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/admin/affiliation/${link._id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
