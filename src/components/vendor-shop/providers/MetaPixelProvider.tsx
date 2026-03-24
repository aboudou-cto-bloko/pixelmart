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
}

// ─── Context ─────────────────────────────────────────────────

const MetaPixelContext = createContext<MetaPixelContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function MetaPixelProvider({
  children,
  pixelId,
  testEventCode,
}: MetaPixelProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    },
    [isReady, pixelId],
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
