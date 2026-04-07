// filepath: src/components/affiliate/molecules/AffiliateCodeCard.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface AffiliateCodeCardProps {
  code: string;
  referral_url?: string;
}

export function AffiliateCodeCard({
  code,
  referral_url,
}: AffiliateCodeCardProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  async function copyToClipboard(text: string, type: "code" | "url") {
    await navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
    toast.success("Copié dans le presse-papiers");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
        <code className="flex-1 text-sm font-mono font-semibold tracking-wider text-foreground">
          {code}
        </code>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => copyToClipboard(code, "code")}
        >
          {copiedCode ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      {referral_url && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <span className="flex-1 truncate text-xs text-muted-foreground">
            {referral_url}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => copyToClipboard(referral_url, "url")}
          >
            {copiedUrl ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
