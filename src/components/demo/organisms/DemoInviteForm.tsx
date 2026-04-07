// filepath: src/components/demo/organisms/DemoInviteForm.tsx

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export function DemoInviteForm() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const createInvite = useMutation(api.demo.mutations.createInvite);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createInvite({ email, note: note || undefined });
      toast.success(`Invitation envoyée à ${email}`);
      setEmail("");
      setNote("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'envoi",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="demo-email">Email du partenaire</Label>
          <Input
            id="demo-email"
            type="email"
            placeholder="partenaire@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demo-note">
            Note{" "}
            <span className="text-muted-foreground font-normal">
              (optionnel)
            </span>
          </Label>
          <Input
            id="demo-note"
            type="text"
            placeholder="Créateur de tutoriels, partenaire..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Envoyer l&apos;invitation
      </Button>
    </form>
  );
}
