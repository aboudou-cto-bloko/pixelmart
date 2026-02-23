// filepath: src/components/checkout/AddressForm.tsx

"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_COUNTRIES } from "@/constants/countries";

export interface ShippingAddress {
  full_name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
}

interface AddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  errors?: Partial<Record<keyof ShippingAddress, string>>;
}

export function AddressForm({ address, onChange, errors }: AddressFormProps) {
  const update = useCallback(
    (field: keyof ShippingAddress, value: string) => {
      onChange({ ...address, [field]: value || undefined });
    },
    [address, onChange],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Nom complet */}
      <div className="sm:col-span-2">
        <Label htmlFor="full_name">
          Nom complet <span className="text-destructive">*</span>
        </Label>
        <Input
          id="full_name"
          value={address.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          placeholder="Aimé Doe"
          className={errors?.full_name ? "border-destructive" : ""}
        />
        {errors?.full_name && (
          <p className="text-xs text-destructive mt-1">{errors.full_name}</p>
        )}
      </div>

      {/* Téléphone */}
      <div className="sm:col-span-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          value={address.phone ?? ""}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+22961234567"
        />
      </div>

      {/* Adresse ligne 1 */}
      <div className="sm:col-span-2">
        <Label htmlFor="line1">
          Adresse <span className="text-destructive">*</span>
        </Label>
        <Input
          id="line1"
          value={address.line1}
          onChange={(e) => update("line1", e.target.value)}
          placeholder="Lot 42 Cité Gbégamey"
          className={errors?.line1 ? "border-destructive" : ""}
        />
        {errors?.line1 && (
          <p className="text-xs text-destructive mt-1">{errors.line1}</p>
        )}
      </div>

      {/* Adresse ligne 2 */}
      <div className="sm:col-span-2">
        <Label htmlFor="line2">Complément d&apos;adresse</Label>
        <Input
          id="line2"
          value={address.line2 ?? ""}
          onChange={(e) => update("line2", e.target.value)}
          placeholder="Appartement, étage, bâtiment…"
        />
      </div>

      {/* Ville */}
      <div>
        <Label htmlFor="city">
          Ville <span className="text-destructive">*</span>
        </Label>
        <Input
          id="city"
          value={address.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="Cotonou"
          className={errors?.city ? "border-destructive" : ""}
        />
        {errors?.city && (
          <p className="text-xs text-destructive mt-1">{errors.city}</p>
        )}
      </div>

      {/* Région / État */}
      <div>
        <Label htmlFor="state">Région / État</Label>
        <Input
          id="state"
          value={address.state ?? ""}
          onChange={(e) => update("state", e.target.value)}
          placeholder="Littoral"
        />
      </div>

      {/* Code postal */}
      <div>
        <Label htmlFor="postal_code">Code postal</Label>
        <Input
          id="postal_code"
          value={address.postal_code ?? ""}
          onChange={(e) => update("postal_code", e.target.value)}
          placeholder="00229"
        />
      </div>

      {/* Pays */}
      <div>
        <Label htmlFor="country">
          Pays <span className="text-destructive">*</span>
        </Label>
        <Select
          value={address.country}
          onValueChange={(val) => update("country", val)}
        >
          <SelectTrigger
            className={errors?.country ? "border-destructive" : ""}
          >
            <SelectValue placeholder="Sélectionner un pays" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.country && (
          <p className="text-xs text-destructive mt-1">{errors.country}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Valide l'adresse et retourne les erreurs.
 */
export function validateAddress(
  address: ShippingAddress,
): Partial<Record<keyof ShippingAddress, string>> | null {
  const errors: Partial<Record<keyof ShippingAddress, string>> = {};

  if (!address.full_name.trim()) {
    errors.full_name = "Le nom est requis";
  }
  if (!address.line1.trim()) {
    errors.line1 = "L'adresse est requise";
  }
  if (!address.city.trim()) {
    errors.city = "La ville est requise";
  }
  if (!address.country) {
    errors.country = "Le pays est requis";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
