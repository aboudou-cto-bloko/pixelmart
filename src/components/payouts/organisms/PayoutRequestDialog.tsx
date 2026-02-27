// filepath: src/components/payouts/organisms/PayoutRequestDialog.tsx

"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Moneroo Provider Options ────────────────────────────────

const MOBILE_MONEY_PROVIDERS = [
  { code: "mtn_bj", label: "MTN Mobile Money (Bénin)" },
  { code: "moov_bj", label: "Moov Money (Bénin)" },
  { code: "mtn_ci", label: "MTN Mobile Money (Côte d'Ivoire)" },
  { code: "orange_ci", label: "Orange Money (Côte d'Ivoire)" },
  { code: "wave_ci", label: "Wave (Côte d'Ivoire)" },
  { code: "wave_sn", label: "Wave (Sénégal)" },
  { code: "orange_sn", label: "Orange Money (Sénégal)" },
  { code: "togocel", label: "Togocel Money (Togo)" },
];

// ─── Types ───────────────────────────────────────────────────

type PayoutMethod = "mobile_money" | "bank_transfer" | "paypal";

interface PayoutRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  currency: string;
  minAmount: number;
  onSubmit: (args: {
    amount: number;
    payoutMethod: PayoutMethod;
    payoutDetails: {
      provider: string;
      account_name?: string;
      account_number?: string;
      bank_code?: string;
      phone_number?: string;
    };
  }) => Promise<unknown>;
}

// ─── Fee Calculation (mirror backend) ────────────────────────

function calculateFee(amount: number, method: string): number {
  switch (method) {
    case "mobile_money":
      return Math.max(100, Math.round(amount * 0.01));
    case "bank_transfer":
      return Math.max(500, Math.round(amount * 0.015));
    case "paypal":
      return Math.round(amount * 0.02);
    default:
      return 0;
  }
}

function formatAmount(centimes: number, currency: string): string {
  const value = centimes / 100;
  if (currency === "XOF") {
    return `${value.toLocaleString("fr-FR")} FCFA`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(value);
}

// ─── Component ───────────────────────────────────────────────

export function PayoutRequestDialog({
  open,
  onOpenChange,
  balance,
  currency,
  minAmount,
  onSubmit,
}: PayoutRequestDialogProps) {
  // Form state
  const [method, setMethod] = useState<PayoutMethod>("mobile_money");
  const [provider, setProvider] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed
  const amountCentimes = Math.round((parseFloat(amountInput) || 0) * 100);
  const fee = calculateFee(amountCentimes, method);
  const netAmount = amountCentimes - fee;

  // Validation
  const errors: string[] = [];
  if (amountCentimes > 0 && amountCentimes < minAmount) {
    errors.push(`Montant minimum : ${minAmount / 100} ${currency}`);
  }
  if (amountCentimes > balance) {
    errors.push("Montant supérieur au solde disponible");
  }
  if (method === "mobile_money" && !provider) {
    errors.push("Sélectionnez un opérateur");
  }
  if (method === "mobile_money" && !phoneNumber) {
    errors.push("Numéro de téléphone requis");
  }
  if (method === "bank_transfer" && (!accountName || !accountNumber)) {
    errors.push("Nom et numéro de compte requis");
  }

  const isValid =
    amountCentimes >= minAmount &&
    amountCentimes <= balance &&
    errors.length === 0;

  const resetForm = useCallback(() => {
    setMethod("mobile_money");
    setProvider("");
    setPhoneNumber("");
    setAccountName("");
    setAccountNumber("");
    setBankCode("");
    setAmountInput("");
    setIsSubmitting(false);
  }, []);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payoutDetails: {
        provider: string;
        account_name?: string;
        account_number?: string;
        bank_code?: string;
        phone_number?: string;
      } = {
        provider:
          method === "mobile_money"
            ? provider
            : method === "bank_transfer"
              ? "bank"
              : "paypal",
      };

      if (method === "mobile_money") {
        payoutDetails.phone_number = phoneNumber;
      } else if (method === "bank_transfer") {
        payoutDetails.account_name = accountName;
        payoutDetails.account_number = accountNumber;
        if (bankCode) payoutDetails.bank_code = bankCode;
      }

      await onSubmit({
        amount: amountCentimes,
        payoutMethod: method,
        payoutDetails,
      });

      toast.success(`${formatAmount(netAmount, currency)} en cours d'envoi.`);

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de traiter le retrait",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetForm();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Demander un retrait</DialogTitle>
          <DialogDescription>
            Solde disponible : {formatAmount(balance, currency)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="payout-amount">
              Montant ({currency === "XOF" ? "FCFA" : currency})
            </Label>
            <Input
              id="payout-amount"
              type="number"
              min={minAmount / 100}
              max={balance / 100}
              step="1"
              placeholder={`Min. ${minAmount / 100}`}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
            />
            {amountCentimes > 0 && amountCentimes <= balance && (
              <button
                type="button"
                onClick={() => setAmountInput(String(balance / 100))}
                className="text-xs text-primary hover:underline"
              >
                Retirer tout le solde
              </button>
            )}
          </div>

          {/* Méthode */}
          <div className="space-y-2">
            <Label>Méthode de retrait</Label>
            <Select
              value={method}
              onValueChange={(v) => {
                setMethod(v as PayoutMethod);
                setProvider("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                {/*<SelectItem value="bank_transfer">Virement bancaire</SelectItem>
               <SelectItem value="paypal">PayPal</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Money : opérateur + téléphone */}
          {method === "mobile_money" && (
            <>
              <div className="space-y-2">
                <Label>Opérateur</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOBILE_MONEY_PROVIDERS.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+229 XX XX XX XX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Bank Transfer : nom + IBAN + code
            {method === "bank_transfer" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="account-name">Nom du titulaire</Label>
                  <Input
                    id="account-name"
                    placeholder="Nom complet"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-number">Numéro de compte / IBAN</Label>
                  <Input
                    id="account-number"
                    placeholder="BJ00 0000 0000 0000 0000"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-code">Code banque (optionnel)</Label>
                  <Input
                    id="bank-code"
                    placeholder="Code SWIFT / BIC"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                  />
                </div>
              </>
            )}*/}

          {/* Fee preview */}
          {amountCentimes > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Montant brut</span>
                  <span>{formatAmount(amountCentimes, currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>
                    Frais (
                    {method === "mobile_money"
                      ? "1%"
                      : method === "bank_transfer"
                        ? "1,5%"
                        : "2%"}
                    )
                  </span>
                  <span>-{formatAmount(fee, currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Vous recevrez</span>
                  <span className="text-emerald-500">
                    {formatAmount(Math.max(0, netAmount), currency)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Errors */}
          {amountInput && errors.length > 0 && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="space-y-0.5">
                {errors.map((e) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer le retrait
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
