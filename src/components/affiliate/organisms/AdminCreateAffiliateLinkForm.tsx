// filepath: src/components/affiliate/organisms/AdminCreateAffiliateLinkForm.tsx

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function AdminCreateAffiliateLinkForm() {
  const createLink = useMutation(api.affiliate.mutations.createAffiliateLink);
  const stores = useQuery(api.admin.queries.listStores);

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storeId, setStoreId] = useState<string>("");
  const [rateBp, setRateBp] = useState<string>("300");
  const [durationDays, setDurationDays] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) {
      toast.error("Sélectionnez une boutique parrain");
      return;
    }

    const parsedRate = parseInt(rateBp, 10);
    if (isNaN(parsedRate) || parsedRate < 1 || parsedRate > 1000) {
      toast.error("Le taux doit être entre 0.01% et 10% (1–1000 bp)");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createLink({
        referrer_store_id: storeId as Id<"stores">,
        commission_rate_bp: parsedRate,
        duration_days: durationDays ? parseInt(durationDays, 10) : undefined,
      });
      toast.success(`Lien créé : ${result.code}`);
      setOpen(false);
      setStoreId("");
      setRateBp("300");
      setDurationDays("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la création",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau lien
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un lien affilié</DialogTitle>
          <DialogDescription>
            Le lien sera associé à la boutique parrain. Chaque inscription via
            ce lien génère des commissions pour cette boutique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Boutique parrain *</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une boutique" />
              </SelectTrigger>
              <SelectContent>
                {(stores ?? []).map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Taux de commission{" "}
              <span className="text-muted-foreground text-xs">
                (en basis points — 300 = 3%)
              </span>
            </Label>
            <Input
              type="number"
              min={1}
              max={1000}
              value={rateBp}
              onChange={(e) => setRateBp(e.target.value)}
              placeholder="300"
            />
            <p className="text-xs text-muted-foreground">
              Valeur affichée : {(parseInt(rateBp || "0", 10) / 100).toFixed(2)}
              %
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Durée{" "}
              <span className="text-muted-foreground text-xs">
                (jours, vide = illimité)
              </span>
            </Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="365"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le lien
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
