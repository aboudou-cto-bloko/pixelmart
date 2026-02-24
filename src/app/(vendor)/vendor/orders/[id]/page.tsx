// filepath: src/app/(vendor)/vendor/orders/[id]/page.tsx

"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { OrderDetailTemplate } from "@/components/orders/templates/OrderDetailTemplate";

interface Props {
  params: Promise<{ id: string }>;
}

export default function VendorOrderDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const order = useQuery(api.orders.queries.getOrderDetail, {
    orderId: id as Id<"orders">,
  });

  return (
    <OrderDetailTemplate
      order={order}
      onBack={() => router.push("/vendor/orders")}
    />
  );
}
