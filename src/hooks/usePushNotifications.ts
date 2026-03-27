// filepath: src/hooks/usePushNotifications.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

interface PushNotificationsState {
  supported: boolean;
  permissionState: PermissionState;
  isSubscribed: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  deviceCount: number;
  requestAndSubscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  toggleEnabled: (enabled: boolean) => Promise<void>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(): PushNotificationsState {
  const [supported, setSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>("default");
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const status = useQuery(api.push.queries.getStatus);
  const subscribeMutation = useMutation(api.push.mutations.subscribe);
  const unsubscribeMutation = useMutation(api.push.mutations.unsubscribe);
  const setEnabledMutation = useMutation(api.push.mutations.setEnabled);

  // Register service worker on mount
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    setSupported(true);
    setPermissionState(Notification.permission as PermissionState);

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        setSwRegistration(reg);
        const sub = await reg.pushManager.getSubscription();
        setCurrentSubscription(sub);
      })
      .catch((err) => {
        console.error("[push] SW registration failed:", err);
      });
  }, []);

  const requestAndSubscribe = useCallback(async () => {
    if (!swRegistration || !supported) return;
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PermissionState);

      if (permission !== "granted") return;

      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
      });

      setCurrentSubscription(sub);

      const json = sub.toJSON();
      await subscribeMutation({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        user_agent: navigator.userAgent.slice(0, 200),
      });
    } finally {
      setIsLoading(false);
    }
  }, [swRegistration, supported, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!currentSubscription) return;
    setIsLoading(true);
    try {
      await unsubscribeMutation({ endpoint: currentSubscription.endpoint });
      await currentSubscription.unsubscribe();
      setCurrentSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentSubscription, unsubscribeMutation]);

  const toggleEnabled = useCallback(
    async (enabled: boolean) => {
      await setEnabledMutation({ enabled });
    },
    [setEnabledMutation],
  );

  return {
    supported,
    permissionState,
    isSubscribed: !!currentSubscription,
    isEnabled: status?.enabled ?? true,
    isLoading,
    deviceCount: status?.deviceCount ?? 0,
    requestAndSubscribe,
    unsubscribe,
    toggleEnabled,
  };
}
