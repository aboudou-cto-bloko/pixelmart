"use client";

// filepath: src/components/marketing/LandingWaitlist.tsx
// Capture newsletter — section sombre. Logique Convex conservée (joinWaitlist + count).

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  Store,
  ShoppingBag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Section, Container, Eyebrow, Heading, Lead } from "./LandingKit";
import { FadeIn } from "./FadeIn";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "vendor" as const, label: "Je vends", icon: Store },
  { value: "customer" as const, label: "J'achète", icon: ShoppingBag },
];

export function LandingWaitlist() {
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);
  const count = useQuery(api.waitlist.getWaitlistCount);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"vendor" | "customer">("vendor");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading || success) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await joinWaitlist({
        email: email.trim(),
        name: name.trim() || undefined,
        role,
      });
      if (result.alreadyRegistered) setAlreadyRegistered(true);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur s'est produite.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Section tone="dark" className="py-24 md:py-32">
      <Container className="max-w-2xl text-center">
        <FadeIn className="flex flex-col items-center gap-5">
          <Eyebrow>Newsletter</Eyebrow>
          <Heading size="md">Restez dans la boucle.</Heading>
          <Lead className="max-w-md">
            Conseils e-commerce, nouveautés Pixel-Mart, offres exclusives. Aucun
            spam.
          </Lead>
        </FadeIn>

        {count !== undefined && count > 0 && (
          <FadeIn className="mt-6">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{count}</span>{" "}
              abonné{count > 1 ? "s" : ""} déjà inscrit{count > 1 ? "s" : ""}
            </span>
          </FadeIn>
        )}

        <FadeIn delay={0.1} className="mt-10">
          {success ? (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8">
              <CheckCircle2 className="size-9 text-primary" />
              <h3 className="font-heading text-lg font-semibold tracking-[-0.01em] text-foreground">
                {alreadyRegistered
                  ? "Déjà inscrit !"
                  : "Inscription confirmée !"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {alreadyRegistered
                  ? "Cette adresse est déjà enregistrée."
                  : "Bienvenue. Partagez à vos amis commerçants."}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-border bg-card p-6 text-left"
            >
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                        role === r.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {r.label}
                    </button>
                  );
                })}
              </div>

              <Input
                type="text"
                placeholder="Votre prénom (optionnel)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
              <Input
                type="email"
                required
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={isLoading || !email}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold tracking-[-0.01em] text-black transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    S&apos;inscrire
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                Pas de spam. Désabonnement en 1 clic.
              </p>
            </form>
          )}
        </FadeIn>
      </Container>
    </Section>
  );
}
