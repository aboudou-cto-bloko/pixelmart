// filepath: src/app/(admin)/admin/dashboard/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminDashboardTemplate } from "@/components/admin/templates/AdminDashboardTemplate";

export default function AdminDashboardPage() {
  const stats = useQuery(api.admin.queries.getPlatformStats);
  return <AdminDashboardTemplate stats={stats} />;
}
