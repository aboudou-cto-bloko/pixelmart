// filepath: src/app/(admin)/admin/users/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminUsersTemplate } from "@/components/admin/templates/AdminUsersTemplate";

export default function AdminUsersPage() {
  const users = useQuery(api.admin.queries.listUsers);
  return <AdminUsersTemplate users={users ?? []} />;
}
