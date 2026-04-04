// filepath: src/components/storefront/organisms/NewsletterBar.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
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
      toast.error("Email invalide");
      return;
    }
    setIsLoading(true);
    try {
      const result = await subscribe({ email });
      if (result.alreadySubscribed) {
        toast.info("Vous êtes déjà inscrit à notre newsletter.");
      } else {
        setSubmitted(true);
        toast.success("Inscription confirmée !");
      }
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="bg-primary text-primary-foreground py-8">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mail className="size-6 shrink-0" />
          <div>
            <p className="font-bold text-lg">
              Inscrivez-vous & obtenez{" "}
              <span className="text-yellow-300">10% de réduction</span> sur
              votre première commande
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="flex items-center gap-2 text-sm">
            <Check className="size-4" />
            Merci !
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 w-full sm:w-64"
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="secondary"
              className="shrink-0"
              disabled={isLoading}
            >
              S&apos;inscrire
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
