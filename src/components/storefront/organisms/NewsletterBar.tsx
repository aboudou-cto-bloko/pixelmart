// filepath: src/components/storefront/organisms/NewsletterBar.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";

export function NewsletterBar() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const subscribe = useMutation(api.newsletter.mutations.subscribe);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Adresse email invalide.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await subscribe({ email });
      if (result.alreadySubscribed) {
        toast.info("Vous êtes déjà inscrit à notre newsletter.");
      } else {
        setSubmitted(true);
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-xl text-center space-y-4">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="size-10 text-primary" />
              <p className="font-semibold text-lg">
                Merci pour votre inscription !
              </p>
              <p className="text-sm text-muted-foreground">
                Vous recevrez nos actualités et offres exclusives directement
                dans votre boîte mail.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="size-5 text-primary" />
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Restez informé</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Inscrivez-vous pour recevoir nos nouveautés et offres
                  exclusives.
                </p>
              </div>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-2 mt-2"
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1"
                  disabled={isLoading}
                  aria-label="Adresse email"
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="sm:shrink-0"
                >
                  {isLoading ? "Envoi…" : "S'inscrire"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Pas de spam. Désabonnement possible à tout moment.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
