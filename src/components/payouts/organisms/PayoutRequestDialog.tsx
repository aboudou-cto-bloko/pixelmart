// filepath: src/components/payouts/organisms/PayoutRequestDialog.tsx

"use client";

import { useState, useCallback, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
import { formatPrice } from "@/lib/format";

// ─── Méta des méthodes : champ requis + format numéro ──────

interface MethodMeta {
  field: "msisdn" | "account_number";
  label: string;
  example: string;
  currency: string;
}

const METHOD_META: Record<string, MethodMeta> = {
  mtn_bj: {
    field: "msisdn",
    label: "Numéro MTN",
    example: "22901XXXXXXXX",
    currency: "XOF",
  },
  moov_bj: {
    field: "msisdn",
    label: "Numéro Moov",
    example: "22901XXXXXXXX",
    currency: "XOF",
  },
  mtn_ci: {
    field: "msisdn",
    label: "Numéro MTN",
    example: "225XXXXXXXXX",
    currency: "XOF",
  },
  orange_ci: {
    field: "msisdn",
    label: "Numéro Orange",
    example: "225XXXXXXXXX",
    currency: "XOF",
  },
  wave_ci: {
    field: "msisdn",
    label: "Numéro Wave",
    example: "225XXXXXXXXX",
    currency: "XOF",
  },
  moov_ci: {
    field: "msisdn",
    label: "Numéro Moov",
    example: "225XXXXXXXXX",
    currency: "XOF",
  },
  djamo_ci: {
    field: "msisdn",
    label: "Numéro Djamo",
    example: "225XXXXXXXXX",
    currency: "XOF",
  },
  orange_sn: {
    field: "msisdn",
    label: "Numéro Orange",
    example: "221XXXXXXXXX",
    currency: "XOF",
  },
  wave_sn: {
    field: "msisdn",
    label: "Numéro Wave",
    example: "221XXXXXXXXX",
    currency: "XOF",
  },
  e_money_sn: {
    field: "msisdn",
    label: "Numéro E-Money",
    example: "221XXXXXXXXX",
    currency: "XOF",
  },
  freemoney_sn: {
    field: "msisdn",
    label: "Numéro Free Money",
    example: "221XXXXXXXXX",
    currency: "XOF",
  },
  djamo_sn: {
    field: "msisdn",
    label: "Numéro Djamo",
    example: "221XXXXXXXXX",
    currency: "XOF",
  },
  togocel: {
    field: "msisdn",
    label: "Numéro Togocel",
    example: "228XXXXXXXXX",
    currency: "XOF",
  },
  moov_tg: {
    field: "msisdn",
    label: "Numéro Moov",
    example: "228XXXXXXXXX",
    currency: "XOF",
  },
  orange_ml: {
    field: "msisdn",
    label: "Numéro Orange",
    example: "223XXXXXXXXX",
    currency: "XOF",
  },
  mtn_gh: {
    field: "msisdn",
    label: "Numéro MTN",
    example: "233XXXXXXXXX",
    currency: "GHS",
  },
  tigo_gh: {
    field: "msisdn",
    label: "Numéro Tigo",
    example: "233XXXXXXXXX",
    currency: "GHS",
  },
  vodafone_gh: {
    field: "msisdn",
    label: "Numéro Vodafone",
    example: "233XXXXXXXXX",
    currency: "GHS",
  },
  mtn_ng: {
    field: "msisdn",
    label: "Numéro MTN",
    example: "234XXXXXXXXX",
    currency: "NGN",
  },
  airtel_ng: {
    field: "msisdn",
    label: "Numéro Airtel",
    example: "234XXXXXXXXX",
    currency: "NGN",
  },
  mpesa_ke: {
    field: "msisdn",
    label: "Numéro M-Pesa",
    example: "254XXXXXXXXX",
    currency: "KES",
  },
  mtn_cm: {
    field: "msisdn",
    label: "Numéro MTN",
    example: "237XXXXXXXXX",
    currency: "XAF",
  },
  orange_cm: {
    field: "msisdn",
    label: "Numéro Orange",
    example: "237XXXXXXXXX",
    currency: "XAF",
  },
  eu_mobile_cm: {
    field: "msisdn",
    label: "Numéro EU Mobile",
    example: "237XXXXXXXXX",
    currency: "XAF",
  },
  moneroo_payout_demo: {
    field: "account_number",
    label: "Numéro de compte test",
    example: "1XXXXXXXXX",
    currency: "USD",
  },
};

// ─── Fallback static list (used if Moneroo API is unreachable) ─

const FALLBACK_METHODS: Record<string, Array<{ id: string; name: string }>> = {
  BJ: [
    { id: "mtn_bj", name: "MTN Mobile Money" },
    { id: "moov_bj", name: "Moov Money" },
  ],
  CI: [
    { id: "mtn_ci", name: "MTN Mobile Money" },
    { id: "orange_ci", name: "Orange Money" },
    { id: "wave_ci", name: "Wave" },
    { id: "moov_ci", name: "Moov Money" },
  ],
  SN: [
    { id: "orange_sn", name: "Orange Money" },
    { id: "wave_sn", name: "Wave" },
  ],
  TG: [{ id: "togocel", name: "Togocel Money" }],
  GN: [{ id: "orange_gn", name: "Orange Money Guinea" }],
  ML: [{ id: "orange_ml", name: "Orange Money Mali" }],
  BF: [{ id: "orange_bf", name: "Orange Money Burkina" }],
  NE: [{ id: "airtel_ne", name: "Airtel Money Niger" }],
};

// ─── Types ───────────────────────────────────────────────────

interface MonerooMethod {
  id: string;
  name: string;
  country?: string;
  logo?: string;
  active?: boolean;
  type?: string;
}

type PayoutMethod = "mobile_money" | "bank_transfer" | "paypal";

interface PayoutRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
  currency: string;
  storeCountry?: string;
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

const NO_DECIMAL = ["XOF", "XAF", "GNF", "CDF"];

// ─── Component ───────────────────────────────────────────────

export function PayoutRequestDialog({
  open,
  onOpenChange,
  balance,
  currency,
  storeCountry = "BJ",
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

  // Moneroo methods
  const fetchMethods = useAction(api.payouts.actions.listPayoutMethods);
  const [monerooMethods, setMonerooMethods] = useState<MonerooMethod[] | null>(
    null,
  );
  const [methodsLoading, setMethodsLoading] = useState(false);

  useEffect(() => {
    if (!open || monerooMethods !== null) return;
    setMethodsLoading(true);
    fetchMethods({})
      .then((result) => {
        if (!result) return;
        const country = storeCountry.toUpperCase();
        // Filtrer par pays ET par devise (cohérence avec le solde du vendeur)
        const byCountry = result.filter(
          (m) =>
            m.active !== false &&
            (!m.country || m.country.toUpperCase() === country),
        );
        const byCurrency = byCountry.filter(
          (m) => !METHOD_META[m.id] || METHOD_META[m.id].currency === currency,
        );
        setMonerooMethods(
          byCurrency.length > 0
            ? byCurrency
            : byCountry.length > 0
              ? byCountry
              : result.filter((m) => m.active !== false),
        );
      })
      .catch(() => {})
      .finally(() => setMethodsLoading(false));
  }, [open, fetchMethods, storeCountry, currency, monerooMethods]);

  // Providers shown in selector: live Moneroo data or static fallback
  const providers: MonerooMethod[] =
    monerooMethods ??
    (FALLBACK_METHODS[storeCountry.toUpperCase()] ?? FALLBACK_METHODS.BJ).map(
      (m) => ({ id: m.id, name: m.name }),
    );

  // Computed
  const isNoDecimal = NO_DECIMAL.includes(currency);
  const amountCentimes = isNoDecimal
    ? Math.round(parseFloat(amountInput) || 0)
    : Math.round((parseFloat(amountInput) || 0) * 100);
  const fee = calculateFee(amountCentimes, method);
  const netAmount = amountCentimes - fee;

  // Validation
  const errors: string[] = [];
  if (amountCentimes > 0 && amountCentimes < minAmount) {
    errors.push(`Montant minimum : ${formatPrice(minAmount, currency)}`);
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
    setMonerooMethods(null);
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

      toast.success(`${formatPrice(netAmount, currency)} en cours d'envoi.`);

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
            Solde disponible : {formatPrice(balance, currency)}
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
              min={isNoDecimal ? minAmount : minAmount / 100}
              max={isNoDecimal ? balance : balance / 100}
              step="1"
              placeholder={`Min. ${isNoDecimal ? minAmount : minAmount / 100}`}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
            />
            {amountCentimes > 0 && amountCentimes <= balance && (
              <button
                type="button"
                onClick={() =>
                  setAmountInput(String(isNoDecimal ? balance : balance / 100))
                }
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
                {methodsLoading ? (
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border text-sm text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Chargement des opérateurs…
                  </div>
                ) : (
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un opérateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            {p.logo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.logo}
                                alt={p.name}
                                className="h-4 w-4 rounded-sm object-contain"
                              />
                            )}
                            {p.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                {(() => {
                  const meta = provider ? METHOD_META[provider] : undefined;
                  const label = meta?.label ?? "Numéro de téléphone";
                  const example = meta?.example ?? "XXXXXXXXXXXX";
                  return (
                    <>
                      <Label htmlFor="phone">{label}</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={example}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Format international sans espace ni +&nbsp;:{" "}
                        <span className="font-mono">{example}</span>
                      </p>
                    </>
                  );
                })()}
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
                  <span>{formatPrice(amountCentimes, currency)}</span>
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
                  <span>-{formatPrice(fee, currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Vous recevrez</span>
                  <span className="text-emerald-500">
                    {formatPrice(Math.max(0, netAmount), currency)}
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
