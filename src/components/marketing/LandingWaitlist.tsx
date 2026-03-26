"use client";

// filepath: src/components/marketing/LandingWaitlist.tsx

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  CheckCircle2,
  Loader2,
  ArrowRight,
  Users,
  Store,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "./FadeIn";

const ROLES = [
  { value: "vendor" as const, label: "Je suis vendeur", icon: Store },
  { value: "customer" as const, label: "Je suis acheteur", icon: ShoppingBag },
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
    <section id="waitlist" className="relative overflow-hidden py-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <div className="container relative mx-auto max-w-xl px-4 text-center">
        <FadeIn className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Pré-lancement
          </p>
          <h2 className="mb-4 text-3xl font-black text-foreground md:text-4xl">
            Soyez parmi les premiers.
          </h2>
          <p className="text-sm text-muted-foreground">
            Inscrivez-vous à la waitlist. Accès anticipé, offres de lancement,
            et aucun spam — promis.
          </p>
        </FadeIn>

        {/* Count */}
        {count !== undefined && count > 0 && (
          <FadeIn className="mb-6 flex items-center justify-center gap-2">
            <Users className="size-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{count}</span>{" "}
              personne
              {count > 1 ? "s" : ""} inscrite{count > 1 ? "s" : ""}
            </span>
          </FadeIn>
        )}

        <FadeIn delay={0.1}>
          {success ? (
            <Card className="p-8 text-center ring-1 ring-green-500/20">
              <CardContent className="p-0 flex flex-col items-center gap-3">
                <CheckCircle2 className="size-10 text-green-400" />
                <h3 className="text-lg font-bold text-foreground">
                  {alreadyRegistered
                    ? "Déjà inscrit !"
                    : "Vous êtes sur la liste !"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {alreadyRegistered
                    ? "Cette adresse est déjà enregistrée. On vous contacte dès le lancement."
                    : "On vous contacte dès que Pixel-Mart est prêt. Partagez à vos amis commerçants."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-6">
              <CardContent className="p-0">
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  {/* Role selector */}
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                            role === r.value
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border/50 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
                          }`}
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

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading || !email}
                    className="gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        Rejoindre la waitlist
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-[11px] text-muted-foreground/50">
                    Pas de spam. Désabonnement en 1 clic.
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </FadeIn>
      </div>
    </section>
  );
}
