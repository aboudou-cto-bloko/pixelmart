"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminStoresTemplate } from "@/components/admin/templates/AdminStoresTemplate";

export default function AdminStoresPage() {
  const stores = useQuery(api.admin.queries.listStores);
  return <AdminStoresTemplate stores={stores ?? []} />;
}
