// filepath: src/app/(admin)/admin/orders/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { AdminOrderDetailTemplate } from "@/components/admin/templates/AdminOrderDetailTemplate";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const order = useQuery(api.admin.queries.getAdminOrderDetail, {
    orderId: id as Id<"orders">,
  });

  return (
    <AdminOrderDetailTemplate order={order} onBack={() => router.push("/admin/orders")} />
  );
}
