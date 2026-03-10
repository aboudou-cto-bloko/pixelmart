// filepath: src/components/storefront/organisms/NewsletterBar.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
import { toast } from "sonner";

export function NewsletterBar() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Email invalide");
      return;
    }
    // TODO: Sauvegarder l'email (Convex mutation ou Mailchimp)
    setSubmitted(true);
    toast.success("Inscription confirmée !");
  }

  return (
    <section className="bg-primary text-primary-foreground py-8">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
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
            />
            <Button type="submit" variant="secondary" className="shrink-0">
              S&apos;inscrire
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
