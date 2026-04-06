// filepath: src/app/(admin)/admin/communication/page.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AdminCommunicationTemplate } from "@/components/admin/templates/AdminCommunicationTemplate";

export default function AdminCommunicationPage() {
  const banner = useQuery(api.admin.queries.getVendorBanner);
  return <AdminCommunicationTemplate banner={banner} />;
}
