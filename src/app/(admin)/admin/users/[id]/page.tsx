// filepath: src/app/(admin)/admin/users/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { AdminUserDetailTemplate } from "@/components/admin/templates/AdminUserDetailTemplate";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useQuery(api.admin.queries.getAdminUserDetail, {
    userId: id as Id<"users">,
  });

  return (
    <AdminUserDetailTemplate user={user} onBack={() => router.push("/admin/users")} />
  );
}
