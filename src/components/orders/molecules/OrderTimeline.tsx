// filepath: src/components/orders/molecules/OrderTimeline.tsx

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { TimelineStep } from "../atoms/TimelineStep";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderTimelineProps {
  orderId: Id<"orders">;
}

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const events = useQuery(api.orders.events.getTimeline, { orderId });

  if (events === undefined) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun événement enregistré.
      </p>
    );
  }

  return (
    <div>
      {events.map((event, i) => (
        <TimelineStep
          key={event._id}
          type={event.type as Parameters<typeof TimelineStep>[0]["type"]}
          description={event.description}
          actorType={
            event.actorType as "system" | "customer" | "vendor" | "admin"
          }
          createdAt={event.createdAt}
          isLast={i === events.length - 1}
        />
      ))}
    </div>
  );
}
