// filepath: src/components/analytics/organisms/CustomerInsightsPanel.tsx

"use client";

import { Users, UserPlus, UserCheck, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "../atoms/EmptyState";
import { MetricValue } from "../atoms/MetricValue";
import { formatPrice } from "@/lib/utils";

interface CustomerInsightsData {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatRate: number;
  averageOrderValue: number;
  topCustomers: Array<{
    name: string;
    email: string;
    totalSpent: number;
    orderCount: number;
  }>;
}

interface CustomerInsightsPanelProps {
  data: CustomerInsightsData | null | undefined;
  currency?: string;
  isLoading?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CustomerInsightsPanel({
  data,
  currency = "XOF",
  isLoading,
}: CustomerInsightsPanelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="Aucune donnée client" />
        </CardContent>
      </Card>
    );
  }

  const miniStats = [
    {
      label: "Total clients",
      value: data.totalCustomers,
      icon: Users,
    },
    {
      label: "Nouveaux",
      value: data.newCustomers,
      icon: UserPlus,
    },
    {
      label: "Récurrents",
      value: data.returningCustomers,
      icon: UserCheck,
    },
    {
      label: "Taux récurrence",
      value: data.repeatRate,
      icon: Repeat,
      isPercent: true,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Insights clients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mini stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {miniStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <MetricValue
                value={stat.value}
                type={stat.isPercent ? "percent" : "number"}
                className="text-lg"
              />
            </div>
          ))}
        </div>

        {/* Top customers */}
        {data.topCustomers.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              Meilleurs clients
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Commandes</TableHead>
                  <TableHead className="text-right">Dépensé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topCustomers.map((customer) => (
                  <TableRow key={customer.email}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate hidden sm:block">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {customer.orderCount}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPrice(customer.totalSpent, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
