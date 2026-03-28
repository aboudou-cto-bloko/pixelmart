// filepath: src/app/(admin)/admin/categories/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminCategoriesTemplate } from "@/components/admin/templates/AdminCategoriesTemplate";

export default function AdminCategoriesPage() {
  const categories = useQuery(api.categories.queries.list);
  return <AdminCategoriesTemplate categories={categories ?? []} />;
}
