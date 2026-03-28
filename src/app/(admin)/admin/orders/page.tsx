// filepath: src/app/(admin)/admin/orders/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminOrdersTemplate } from "@/components/admin/templates/AdminOrdersTemplate";

export default function AdminOrdersPage() {
  const orders = useQuery(api.admin.queries.listOrders, {});
  return <AdminOrdersTemplate orders={orders ?? []} />;
}
