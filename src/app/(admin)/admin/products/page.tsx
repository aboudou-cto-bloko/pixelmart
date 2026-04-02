"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminProductsTemplate } from "@/components/admin/templates/AdminProductsTemplate";

export default function AdminProductsPage() {
  const products = useQuery(api.admin.queries.listAllProducts, {});
  return <AdminProductsTemplate products={products ?? []} />;
}
