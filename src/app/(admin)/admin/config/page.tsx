// filepath: src/app/(admin)/admin/config/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminConfigTemplate } from "@/components/admin/templates/AdminConfigTemplate";

export default function AdminConfigPage() {
  const config = useQuery(api.admin.queries.getPlatformConfig);
  return <AdminConfigTemplate config={config} />;
}
