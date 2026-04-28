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
  const [ratePct, setRatePct] = useState<string>("3");
  const [platformRatePct, setPlatformRatePct] = useState<string>("");
  const [durationDays, setDurationDays] = useState<string>("");
  const [customCode, setCustomCode] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) {
      toast.error("Sélectionnez une boutique parrain");
      return;
    }

    const parsedPct = parseFloat(ratePct);
    if (isNaN(parsedPct) || parsedPct < 0.01 || parsedPct > 10) {
      toast.error("Le taux parrain doit être entre 0,01 % et 10 %");
      return;
    }
    const commissionRateBp = Math.round(parsedPct * 100);

    let vendorPlatformCommissionBp: number | undefined;
    if (platformRatePct.trim() !== "") {
      const parsedPlatformPct = parseFloat(platformRatePct);
      if (isNaN(parsedPlatformPct) || parsedPlatformPct <= 0) {
        toast.error("Le taux plateforme doit être supérieur à 0 %");
        return;
      }
      vendorPlatformCommissionBp = Math.round(parsedPlatformPct * 100);
    }

    setIsLoading(true);
    try {
      const result = await createLink({
        referrer_store_id: storeId as Id<"stores">,
        commission_rate_bp: commissionRateBp,
        vendor_platform_commission_bp: vendorPlatformCommissionBp,
        duration_days: durationDays ? parseInt(durationDays, 10) : undefined,
        custom_code: customCode.trim() || undefined,
      });
      toast.success(`Lien créé : ${result.code}`);
      setOpen(false);
      setStoreId("");
      setRatePct("3");
      setPlatformRatePct("");
      setDurationDays("");
      setCustomCode("");
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
            <Label>Taux de commission (%)</Label>
            <div className="relative">
              <Input
                type="number"
                min={0.01}
                max={10}
                step={0.01}
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
                placeholder="3"
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ce taux sera appliqué à chaque commande des vendeurs parrainés via
              ce lien (min 0,01 % — max 10 %).
            </p>
          </div>

          <div className="space-y-2">
            <Label>
              Commission plateforme pour les parrainés{" "}
              <span className="text-muted-foreground text-xs">
                (%, vide = taux par défaut du tier)
              </span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                min={0.01}
                step={0.01}
                value={platformRatePct}
                onChange={(e) => setPlatformRatePct(e.target.value)}
                placeholder="Ex : 3 (taux par défaut utilisé si vide)"
                className="pr-8"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Les vendeurs inscrits via ce lien paieront ce taux à la plateforme
              plutôt que le taux standard. Ne peut pas dépasser le taux par
              défaut configuré.
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

          <div className="space-y-2">
            <Label>
              Code personnalisé{" "}
              <span className="text-muted-foreground text-xs">
                (optionnel — lettres, chiffres, tirets)
              </span>
            </Label>
            <Input
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="PM-AFF-MONCODE (auto-généré si vide)"
              maxLength={30}
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
