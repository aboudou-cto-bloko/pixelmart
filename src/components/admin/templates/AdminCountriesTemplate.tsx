// filepath: src/components/admin/templates/AdminCountriesTemplate.tsx

"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Globe, CreditCard, Smartphone } from "lucide-react";
import { SUPPORTED_COUNTRIES } from "@/constants/countries";
import { PAYMENT_METHODS } from "@/constants/paymentMethods";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────

// DB overrides: countryCode → is_active (undefined = active by default)
type CountryConfigMap = Record<string, boolean>;

interface Props {
  config: CountryConfigMap | undefined;
}

// ─── Currency group colours ───────────────────────────────────

const CURRENCY_COLORS: Record<string, string> = {
  XOF: "bg-green-100 text-green-700 border-green-300",
  XAF: "bg-teal-100 text-teal-700 border-teal-300",
  GNF: "bg-orange-100 text-orange-700 border-orange-300",
  CDF: "bg-yellow-100 text-yellow-700 border-yellow-300",
  EUR: "bg-blue-100 text-blue-700 border-blue-300",
  CHF: "bg-indigo-100 text-indigo-700 border-indigo-300",
  CAD: "bg-purple-100 text-purple-700 border-purple-300",
};

// ─── Main Template ────────────────────────────────────────────

export function AdminCountriesTemplate({ config }: Props) {
  const setCountryActive = useMutation(api.admin.mutations.setCountryActive);

  // Group countries by currency
  const byCurrency = SUPPORTED_COUNTRIES.reduce<
    Record<string, typeof SUPPORTED_COUNTRIES[number][]>
  >((acc, c) => {
    if (!acc[c.currency]) acc[c.currency] = [];
    acc[c.currency].push(c);
    return acc;
  }, {});

  const activeCount = SUPPORTED_COUNTRIES.filter(
    (c) => config?.[c.code] !== false,
  ).length;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Pays & Devises
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeCount}/{SUPPORTED_COUNTRIES.length} pays actifs — toggle pour
            désactiver un marché
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Globe className="size-3.5" />
          {Object.keys(byCurrency).length} devises
        </Badge>
      </div>

      {/* Currency zones */}
      <div className="space-y-4">
        {Object.entries(byCurrency).map(([currency, countries]) => {
          const activeCurrencyCount = countries.filter(
            (c) => config?.[c.code] !== false,
          ).length;

          return (
            <Card key={currency}>
              <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center gap-3">
                <Badge className={CURRENCY_COLORS[currency] ?? "bg-gray-100 text-gray-700"}>
                  {currency}
                </Badge>
                <CardTitle className="text-sm font-medium flex-1">
                  {activeCurrencyCount}/{countries.length} actifs
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {countries.map((country) => {
                    const isActive = config?.[country.code] !== false;
                    const methods = PAYMENT_METHODS.filter((m) =>
                      (m.countries as readonly string[]).includes(country.code),
                    );

                    return (
                      <div
                        key={country.code}
                        className={`flex flex-col gap-2 rounded-lg border p-3 transition-opacity ${
                          isActive ? "" : "opacity-50"
                        }`}
                      >
                        {/* Country header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg select-none">
                              {countryFlag(country.code)}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {country.name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {country.code}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={isActive}
                            onCheckedChange={(v) =>
                              setCountryActive({
                                country_code: country.code,
                                is_active: v,
                              })
                            }
                          />
                        </div>

                        {/* Payment methods */}
                        {methods.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {methods.map((m) => (
                              <Badge
                                key={m.id}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 gap-0.5"
                              >
                                {m.type === "mobile_money" ? (
                                  <Smartphone className="size-2.5" />
                                ) : (
                                  <CreditCard className="size-2.5" />
                                )}
                                {m.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info note */}
      <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-medium">Note</p>
        <p className="text-xs mt-1">
          Désactiver un pays masque ce marché dans le sélecteur de pays et
          désactive les méthodes de paiement associées. Les méthodes de paiement
          sont gérées par Moneroo et ne peuvent pas être ajoutées ici — cette
          liste reflète les intégrations disponibles.
        </p>
      </div>
    </div>
  );
}

// ─── Flag helper (Regional Indicator emoji) ──────────────────

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}
