// filepath: src/components/finance/molecules/InvoiceVendorInfoForm.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export interface VendorInvoiceInfo {
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
}

interface InvoiceVendorInfoFormProps {
  onSubmit: (info: VendorInvoiceInfo) => void;
  isLoading?: boolean;
  /** Pré-remplissage depuis les saisies précédentes (localStorage) */
  defaultValues?: Partial<VendorInvoiceInfo>;
}

const STORAGE_KEY = "pixelmart_vendor_invoice_info";

function loadSaved(): Partial<VendorInvoiceInfo> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToLocal(info: VendorInvoiceInfo): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // silently fail
  }
}

export function InvoiceVendorInfoForm({
  onSubmit,
  isLoading,
  defaultValues,
}: InvoiceVendorInfoFormProps) {
  const saved = defaultValues ?? loadSaved();

  const [contactEmail, setContactEmail] = useState(saved.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(saved.contactPhone ?? "");
  const [address, setAddress] = useState(saved.address ?? "");
  const [city, setCity] = useState(saved.city ?? "");

  const handleSubmit = () => {
    const info: VendorInvoiceInfo = {
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      address: address.trim(),
      city: city.trim(),
    };
    saveToLocal(info);
    onSubmit(info);
  };

  const isValid = contactEmail.trim().length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ces informations apparaîtront sur la facture PDF. Elles sont
        sauvegardées localement pour vos prochaines factures.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Email de contact *
          </label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="facturation@maboutique.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Téléphone
          </label>
          <Input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+229 61 23 45 67"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Adresse
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Lot 42, Cité Gbégamey"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Ville
          </label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Cotonou"
          />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!isValid || isLoading} size="sm">
        <FileText className="mr-1.5 h-3.5 w-3.5" />
        {isLoading ? "Génération..." : "Générer la facture PDF"}
      </Button>
    </div>
  );
}
