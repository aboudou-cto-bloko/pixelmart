// filepath: src/app/(storefront)/contact/page.tsx

import { MessageCircle } from "lucide-react";
import { ChatwayButton } from "@/components/atoms/ChatwayButton";

export default function ContactPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20">
        <div className="container px-4 text-center max-w-2xl mx-auto">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            Contact
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            On est à votre écoute
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Une question, un problème ou une suggestion ? Notre équipe répond
            en direct via notre chat.
          </p>
        </div>
      </section>

      {/* Chat CTA */}
      <section className="container px-4 py-20">
        <div className="max-w-lg mx-auto text-center">
          <div className="rounded-2xl border bg-card p-12 space-y-6">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Chat en direct</h2>
              <p className="text-muted-foreground">
                Notre équipe est disponible pour vous aider immédiatement.
                Cliquez pour démarrer une conversation.
              </p>
            </div>
            <ChatwayButton className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              <MessageCircle className="h-4 w-4" />
              Démarrer une conversation
            </ChatwayButton>
          </div>
        </div>
      </section>
    </main>
  );
}
