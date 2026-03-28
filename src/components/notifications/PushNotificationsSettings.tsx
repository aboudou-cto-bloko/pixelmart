// filepath: src/components/notifications/PushNotificationsSettings.tsx

"use client";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff, Loader2, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PushNotificationsSettings() {
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

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" />
            Notifications push
          </CardTitle>
          <CardDescription>
            Votre navigateur ne supporte pas les notifications push.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4" />
              Notifications push
            </CardTitle>
            <CardDescription>
              Recevez des alertes instantanées même quand le site est fermé
            </CardDescription>
          </div>
          {isSubscribed && (
            <Switch
              checked={isEnabled}
              onCheckedChange={toggleEnabled}
              aria-label="Activer les notifications push"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Permission denied */}
        {permissionState === "denied" && (
          <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <BellOff className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Permission refusée</p>
              <p className="text-xs mt-0.5 text-muted-foreground">
                Autorisez les notifications dans les paramètres de votre
                navigateur pour activer cette fonctionnalité.
              </p>
            </div>
          </div>
        )}

        {/* Not subscribed yet */}
        {!isSubscribed && permissionState !== "denied" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Activez les notifications push pour recevoir en temps réel :
            </p>
            <ul className="text-sm space-y-1.5 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                Nouvelles commandes
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                Mises à jour de statut
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                Questions et avis clients
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary shrink-0" />
                Alertes de stock faible
              </li>
            </ul>
            <Button
              onClick={requestAndSubscribe}
              disabled={isLoading}
              size="sm"
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Bell className="size-4" />
              )}
              Activer les notifications
            </Button>
          </div>
        )}

        {/* Subscribed */}
        {isSubscribed && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {deviceCount} appareil{deviceCount !== 1 ? "s" : ""} enregistré
                {deviceCount !== 1 ? "s" : ""}
              </span>
              <Badge
                variant={isEnabled ? "default" : "secondary"}
                className="text-xs"
              >
                {isEnabled ? "Actif" : "Désactivé"}
              </Badge>
            </div>

            {!isEnabled && (
              <p className="text-xs text-muted-foreground">
                Les notifications push sont désactivées. Activez-les avec le
                bouton ci-dessus.
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={unsubscribe}
              disabled={isLoading}
              className="gap-2 text-destructive hover:text-destructive"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BellOff className="size-4" />
              )}
              Désabonner cet appareil
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
