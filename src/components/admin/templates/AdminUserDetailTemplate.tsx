// filepath: src/components/admin/templates/AdminUserDetailTemplate.tsx
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShoppingBag,
  Store,
  Calendar,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, formatDate } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────

type OrderStatus =
  | "pending" | "paid" | "processing" | "shipped" | "delivered"
  | "cancelled" | "refunded" | "ready_for_delivery" | "delivery_failed";

type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface UserOrder {
  _id: string;
  order_number: string;
  store_name: string;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  _creationTime: number;
}

interface AdminUserDetail {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_banned: boolean;
  is_verified: boolean;
  avatar_url: string | null;
  _creationTime: number;
  last_login_at: number | null;
  orders: UserOrder[];
  store: {
    _id: string;
    name: string;
    slug: string;
    status: string;
    subscription_tier: string;
  } | null;
}

interface Props {
  user: AdminUserDetail | null | undefined;
  onBack: () => void;
}

// ─── Badge styles ─────────────────────────────────────────────

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending:            "bg-amber-100 text-amber-700 border-amber-300",
  paid:               "bg-blue-100 text-blue-700 border-blue-300",
  processing:         "bg-violet-100 text-violet-700 border-violet-300",
  shipped:            "bg-cyan-100 text-cyan-700 border-cyan-300",
  delivered:          "bg-green-100 text-green-700 border-green-300",
  cancelled:          "bg-red-100 text-red-700 border-red-300",
  refunded:           "bg-slate-100 text-slate-700 border-slate-300",
  ready_for_delivery: "bg-pink-100 text-pink-700 border-pink-300",
  delivery_failed:    "bg-rose-100 text-rose-700 border-rose-300",
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:            "En attente",
  paid:               "Payée",
  processing:         "En préparation",
  shipped:            "Expédiée",
  delivered:          "Livrée",
  cancelled:          "Annulée",
  refunded:           "Remboursée",
  ready_for_delivery: "Prête à livrer",
  delivery_failed:    "Échec livraison",
};

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  pending:  "bg-amber-100 text-amber-700 border-amber-300",
  paid:     "bg-green-100 text-green-700 border-green-300",
  failed:   "bg-red-100 text-red-700 border-red-300",
  refunded: "bg-slate-100 text-slate-700 border-slate-300",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending:  "En attente",
  paid:     "Payé",
  failed:   "Échoué",
  refunded: "Remboursé",
};

const ROLE_LABELS: Record<string, string> = {
  customer: "Client",
  vendor:   "Vendeur",
  admin:    "Admin",
  agent:    "Agent",
  finance:  "Finance",
  logistics: "Logistique",
  developer: "Développeur",
  marketing: "Marketing",
};

// ─── Template ────────────────────────────────────────────────

export function AdminUserDetailTemplate({ user, onBack }: Props) {
  if (user === undefined) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Utilisateur introuvable.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          Retour aux utilisateurs
        </Button>
      </div>
    );
  }

  const totalSpend = user.orders
    .filter((o) => o.payment_status === "paid")
    .reduce((s, o) => s + o.total_amount, 0);

  const deliveredCount = user.orders.filter((o) => o.status === "delivered").length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight">{user.name}</h1>
            <Badge variant="secondary" className="capitalize">
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
            {user.is_banned && (
              <Badge variant="destructive" className="gap-1">
                <ShieldAlert className="size-3" />
                Banni
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ID : <span className="font-mono">{user._id}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/users`}>
            Gérer dans la liste
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — profile + store */}
        <div className="space-y-4">
          {/* Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <a
                href={`mailto:${user.email}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{user.email}</span>
              </a>
              {user.phone ? (
                <a
                  href={`tel:${user.phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{user.phone}</span>
                </a>
              ) : (
                <p className="text-xs text-muted-foreground pl-5">
                  Pas de téléphone renseigné
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <Calendar className="size-3.5 shrink-0" />
                <span>Inscrit le {formatDate(user._creationTime)}</span>
              </div>
              {user.last_login_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" />
                  <span>Dernière connexion {formatDate(user.last_login_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Statistiques commandes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total commandes</span>
                <span className="font-semibold">{user.orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livrées</span>
                <span className="font-semibold text-green-600">{deliveredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dépenses totales</span>
                <span className="font-semibold">
                  {formatPrice(totalSpend, "XOF")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Store (if vendor) */}
          {user.store && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Store className="size-4 text-muted-foreground" />
                  Boutique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{user.store.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize text-xs">
                    {user.store.subscription_tier}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${user.store.status === "active" ? "text-green-600" : "text-muted-foreground"}`}
                  >
                    {user.store.status}
                  </Badge>
                </div>
                <Link
                  href="/admin/stores"
                  className="text-xs text-primary hover:underline"
                >
                  Voir dans les boutiques
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingBag className="size-4 text-muted-foreground" />
                Commandes ({user.orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {user.orders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Aucune commande
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° commande</TableHead>
                        <TableHead>Boutique</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.orders.map((order) => (
                        <TableRow
                          key={order._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            window.location.assign(`/admin/orders/${order._id}`)
                          }
                        >
                          <TableCell className="font-mono text-xs font-semibold">
                            {order.order_number}
                          </TableCell>
                          <TableCell className="text-sm">
                            {order.store_name}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium whitespace-nowrap">
                            {formatPrice(order.total_amount, order.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge className={ORDER_STATUS_STYLES[order.status]}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={PAYMENT_STATUS_STYLES[order.payment_status]}>
                              {PAYMENT_STATUS_LABELS[order.payment_status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(order._creationTime)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
