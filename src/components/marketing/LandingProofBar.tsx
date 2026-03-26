// filepath: src/components/marketing/LandingProofBar.tsx

import { ShieldCheck, Zap, Lock, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FadeIn } from "./FadeIn";

const PROOFS = [
  { icon: ShieldCheck, label: "Paiements sécurisés HMAC-SHA256" },
  { icon: Zap, label: "Temps réel — Convex" },
  { icon: Lock, label: "Données chiffrées AES-256" },
  { icon: MapPin, label: "Conçu pour le Bénin" },
];

export function LandingProofBar() {
  return (
    <FadeIn direction="none">
      <div className="border-y border-border/40 bg-card/30 py-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {PROOFS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={p.label} className="flex items-center gap-8">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <Icon className="size-3.5 text-muted-foreground/40" />
                    {p.label}
                  </div>
                  {i < PROOFS.length - 1 && (
                    <Separator
                      orientation="vertical"
                      className="h-3.5 hidden sm:block"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
