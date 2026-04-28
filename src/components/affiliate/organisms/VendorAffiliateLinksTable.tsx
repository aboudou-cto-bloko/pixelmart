// filepath: src/components/affiliate/organisms/VendorAffiliateLinksTable.tsx

"use client";

import type { Id } from "../../../../convex/_generated/dataModel";
import { AffiliateLinkBadge } from "../molecules/AffiliateLinkBadge";
import { AffiliateCodeCard } from "../molecules/AffiliateCodeCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";

interface AffiliateLink {
  _id: Id<"affiliate_links">;
  code: string;
  is_active: boolean;
  commission_rate_bp: number;
  vendor_platform_commission_bp?: number;
  referral_count: number;
  expires_at?: number;
}

interface VendorAffiliateLinksTableProps {
  links: AffiliateLink[];
}

export function VendorAffiliateLinksTable({
  links,
}: VendorAffiliateLinksTableProps) {
  if (links.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground text-sm">
        Aucun lien de parrainage pour le moment. Contactez l&apos;admin pour en
        obtenir un.
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
            <TableHead>Code / Lien de parrainage</TableHead>
            <TableHead className="text-right">Taux parrain</TableHead>
            <TableHead className="text-right">Commission filleuls</TableHead>
            <TableHead className="text-right">Filleuls</TableHead>
            <TableHead>Expiration</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link._id}>
              <TableCell className="max-w-[280px]">
                <AffiliateCodeCard
                  code={link.code}
                  referral_url={`${siteUrl}/register?ref=${link.code}`}
                />
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {(link.commission_rate_bp / 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {link.vendor_platform_commission_bp !== undefined ? (
                  `${(link.vendor_platform_commission_bp / 100).toFixed(1)}%`
                ) : (
                  <span className="text-muted-foreground">Défaut</span>
                )}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
