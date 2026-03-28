"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminPayoutsTemplate } from "@/components/admin/templates/AdminPayoutsTemplate";

export default function AdminPayoutsPage() {
  const pending = useQuery(api.admin.queries.listPendingPayouts);
  const history = useQuery(api.admin.queries.listAllPayouts);
  return (
    <AdminPayoutsTemplate pending={pending ?? []} history={history ?? []} />
  );
}
