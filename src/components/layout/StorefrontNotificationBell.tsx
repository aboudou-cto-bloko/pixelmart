// filepath: src/components/layout/StorefrontNotificationBell.tsx

"use client";

import Link from "next/link";
import {
  Bell,
  BellOff,
  Loader2,
  Smartphone,
  ShoppingBag,
  Tag,
} from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";

export function StorefrontNotificationBell() {
  const {
    supported,
    permissionState,
    isSubscribed,
    isEnabled,
    isLoading,
    deviceCount,
    requestAndSubscribe,
    unsubscribe,
    toggleEnabled,
  } = usePushNotifications();

  // Ne rien rendre si le navigateur ne supporte pas les push
  if (!supported) return null;

  // Dot d'invitation visible tant que l'utilisateur n'est pas abonné
  const showNudge = !isSubscribed && permissionState !== "denied";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="sr-only">Notifications</span>
          {showNudge && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-orange-500" />
          )}
          {isSubscribed && isEnabled && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-green-500" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-3 space-y-3">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Notifications push</p>
          {isSubscribed && (
            <Switch
              checked={isEnabled}
              onCheckedChange={toggleEnabled}
              aria-label="Activer les notifications push"
            />
          )}
        </div>

        {/* Permission refusée */}
        {permissionState === "denied" && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
            <BellOff className="size-3.5 shrink-0 mt-0.5" />
            <span>
              Permission refusée. Autorisez les notifications dans les
              paramètres de votre navigateur.
            </span>
          </div>
        )}

        {/* Pas encore abonné */}
        {!isSubscribed && permissionState !== "denied" && (
          <div className="space-y-2.5">
            <p className="text-xs text-muted-foreground">
              Activez les notifications pour recevoir en temps réel :
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <ShoppingBag className="size-3 shrink-0 text-primary" />
                Mises à jour de vos commandes
              </li>
              <li className="flex items-center gap-2">
                <Tag className="size-3 shrink-0 text-primary" />
                Promotions et offres exclusives
              </li>
            </ul>
            <Button
              onClick={requestAndSubscribe}
              disabled={isLoading}
              size="sm"
              className="w-full gap-2"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Bell className="size-3.5" />
              )}
              Activer les notifications
            </Button>
          </div>
        )}

        {/* Abonné */}
        {isSubscribed && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="size-3.5 shrink-0" />
              <span>
                {deviceCount} appareil{deviceCount !== 1 ? "s" : ""} enregistré
                {deviceCount !== 1 ? "s" : ""}
              </span>
              <Badge
                variant={isEnabled ? "default" : "secondary"}
                className="ml-auto text-[10px]"
              >
                {isEnabled ? "Actif" : "Désactivé"}
              </Badge>
            </div>
            {!isEnabled && (
              <p className="text-xs text-muted-foreground">
                Réactivez le switch ci-dessus pour recevoir les notifications.
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={unsubscribe}
              disabled={isLoading}
              className="w-full gap-2 text-destructive hover:text-destructive"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <BellOff className="size-3.5" />
              )}
              Désabonner cet appareil
            </Button>
          </div>
        )}

        <Separator />

        <Link
          href={ROUTES.CUSTOMER_ORDERS}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ShoppingBag className="size-3.5" />
          Voir mes commandes
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
