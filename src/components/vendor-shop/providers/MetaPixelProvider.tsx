"use client";

// filepath: src/components/vendor-shop/providers/MetaPixelProvider.tsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────

interface MetaPixelContextValue {
  pixelId: string | null;
  isReady: boolean;
  trackEvent: (
    eventName: string,
    params?: Record<string, unknown>,
    eventId?: string,
  ) => void;
  generateEventId: () => string;
}

interface MetaPixelProviderProps {
  children: ReactNode;
  pixelId: string | null;
  testEventCode?: string | null;
  storeId?: Id<"stores"> | null;
}

// ─── Context ─────────────────────────────────────────────────

const MetaPixelContext = createContext<MetaPixelContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

const LOGGED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "InitiateCheckout",
  "Purchase",
]);

export function MetaPixelProvider({
  children,
  pixelId,
  testEventCode,
  storeId,
}: MetaPixelProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const logBrowserEvent = useMutation(
    api.analytics.mutations.logBrowserPixelEvent,
  );

  const generateEventId = useCallback((): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, unknown>, eventId?: string) => {
      if (!isReady || !pixelId) return;
      try {
        const fbq = (
          window as unknown as { fbq?: (...args: unknown[]) => void }
        ).fbq;
        if (fbq) {
          if (eventId) {
            fbq("track", eventName, params, { eventID: eventId });
          } else {
            fbq("track", eventName, params);
          }
        }
      } catch (error) {
        console.error("[Meta Pixel] Error tracking event:", error);
      }

      // Log vers Convex pour les analytics vendeur
      if (storeId && LOGGED_EVENTS.has(eventName)) {
        const typedEventName = eventName as
          | "PageView"
          | "ViewContent"
          | "InitiateCheckout"
          | "Purchase";
        logBrowserEvent({
          storeId,
          eventName: typedEventName,
          eventId,
          value: typeof params?.value === "number" ? params.value : undefined,
          currency:
            typeof params?.currency === "string" ? params.currency : undefined,
        }).catch(() => {
          // Silently ignore analytics errors
        });
      }
    },
    [isReady, pixelId, storeId, logBrowserEvent],
  );

  // PageView automatique sur chaque changement de route
  useEffect(() => {
    if (isReady && pixelId) {
      trackEvent("PageView");
    }
  }, [pathname, searchParams, isReady, pixelId, trackEvent]);

  if (!pixelId) {
    return (
      <MetaPixelContext.Provider
        value={{ pixelId: null, isReady: false, trackEvent, generateEventId }}
      >
        {children}
      </MetaPixelContext.Provider>
    );
  }

  return (
    <MetaPixelContext.Provider
      value={{ pixelId, isReady, trackEvent, generateEventId }}
    >
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            ${testEventCode ? `fbq('set', 'test_event_code', '${testEventCode}');` : ""}
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      {children}
    </MetaPixelContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useMetaPixel(): MetaPixelContextValue {
  const context = useContext(MetaPixelContext);
  if (!context) {
    throw new Error("useMetaPixel must be used within a MetaPixelProvider");
  }
  return context;
}
