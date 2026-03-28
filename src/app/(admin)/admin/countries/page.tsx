// filepath: src/app/(admin)/admin/countries/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminCountriesTemplate } from "@/components/admin/templates/AdminCountriesTemplate";

export default function AdminCountriesPage() {
  const config = useQuery(api.admin.queries.listCountryConfig);
  return <AdminCountriesTemplate config={config} />;
}
