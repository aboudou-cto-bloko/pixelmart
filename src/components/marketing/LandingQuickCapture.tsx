"use client";

// filepath: src/components/marketing/LandingQuickCapture.tsx
// Formulaire de capture email rapide — réutilisable dans Hero et CTA mid-page.
// Role par défaut : "vendor". Dédupliqué côté backend.

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowRight, CheckCircle2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LandingQuickCaptureProps {
  className?: string;
  layout?: "inline" | "stacked";
  placeholder?: string;
  cta?: string;
  showCount?: boolean;
}

export function LandingQuickCapture({
  className,
  layout = "inline",
  placeholder = "votre@email.com",
  cta = "S'inscrire à la newsletter",
  showCount = true,
}: LandingQuickCaptureProps) {
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);
  const count = useQuery(api.waitlist.getWaitlistCount);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading || success || !email) return;

    setError(null);
    setIsLoading(true);

    try {
      await joinWaitlist({ email: email.trim(), role: "vendor" });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur s'est produite.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle2 className="size-4" />
          <span className="font-medium">Vous êtes sur la liste !</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Inscription confirmée. Partagez à vos amis commerçants.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          layout === "inline"
            ? "flex items-center gap-2"
            : "flex flex-col gap-2",
        )}
      >
        <Input
          type="email"
          required
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(
            "h-11 border-border/50 bg-card/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/50",
            layout === "inline" && "min-w-[220px] max-w-xs",
          )}
        />
        <Button
          type="submit"
          disabled={isLoading || !email}
          size="lg"
          className="shrink-0 gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {cta}
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {showCount && count !== undefined && count > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span>
            <span className="font-semibold text-foreground">{count}</span>{" "}
            abonné{count > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
