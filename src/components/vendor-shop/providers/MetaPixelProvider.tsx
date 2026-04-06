"use client";

// filepath: src/components/vendor-shop/providers/MetaPixelProvider.tsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  MetaPixel,
  useMetaPixel as useAdkitPixel,
} from "@adkit.so/meta-pixel-next";
import type { StandardEvent } from "@adkit.so/meta-pixel-next";
import { usePathname, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

// ─── Constants ────────────────────────────────────────────────

const ALL_EVENTS: string[] = [
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
];

const LOGGABLE_EVENTS = new Set<string>([
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
]);

// ─── Types ────────────────────────────────────────────────────

interface MetaPixelContextValue {
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
  enabledEvents?: string[] | null;
  storeId?: Id<"stores"> | null;
  /** @deprecated testEventCode n'est pas supporté par @adkit.so/meta-pixel-next */
  testEventCode?: string | null;
}

// ─── Context ──────────────────────────────────────────────────

const MetaPixelContext = createContext<MetaPixelContextValue | null>(null);

const generateEventId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

function noop() {}

// ─── Inner provider (must live inside <MetaPixel>) ────────────

function InnerPixelProvider({
  children,
  storeId,
  enabledEvents,
}: {
  children: ReactNode;
  storeId?: Id<"stores"> | null;
  enabledEvents: string[];
}) {
  const meta = useAdkitPixel();
  const logBrowserEvent = useMutation(
    api.analytics.mutations.logBrowserPixelEvent,
  );
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mountedRef = useRef(false);

  // Log PageView to Convex on every route change (library fires fbq automatically)
  useEffect(() => {
    if (!storeId || !enabledEvents.includes("PageView")) return;
    // Skip initial mount log — library already fires the initial PageView via autoTrackPageView
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    logBrowserEvent({
      storeId,
      eventName: "PageView",
      eventId: undefined,
      value: undefined,
      currency: undefined,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const trackEvent = useCallback(
    (eventName: string, params?: Record<string, unknown>, eventId?: string) => {
      if (!enabledEvents.includes(eventName)) return;

      if (meta.isLoaded()) {
        meta.track(
          eventName as StandardEvent,
          params,
          eventId ? { eventID: eventId } : undefined,
        );
      }

      // Log non-PageView events to Convex (PageView logged separately via route-change effect)
      if (
        storeId &&
        LOGGABLE_EVENTS.has(eventName) &&
        eventName !== "PageView"
      ) {
        const typedName = eventName as
          | "ViewContent"
          | "AddToCart"
          | "InitiateCheckout"
          | "Purchase";
        logBrowserEvent({
          storeId,
          eventName: typedName,
          eventId,
          value: typeof params?.value === "number" ? params.value : undefined,
          currency:
            typeof params?.currency === "string" ? params.currency : undefined,
        }).catch(() => {});
      }
    },
    [meta, enabledEvents, storeId, logBrowserEvent],
  );

  return (
    <MetaPixelContext.Provider value={{ trackEvent, generateEventId }}>
      {children}
    </MetaPixelContext.Provider>
  );
}

// ─── Public provider ──────────────────────────────────────────

export function MetaPixelProvider({
  children,
  pixelId,
  enabledEvents,
  storeId,
}: MetaPixelProviderProps) {
  const resolved = enabledEvents ?? ALL_EVENTS;

  if (!pixelId) {
    return (
      <MetaPixelContext.Provider value={{ trackEvent: noop, generateEventId }}>
        {children}
      </MetaPixelContext.Provider>
    );
  }

  const pageViewEnabled = resolved.includes("PageView");

  return (
    <MetaPixel
      pixelId={pixelId}
      trackPageViews={pageViewEnabled}
      debug={process.env.NODE_ENV === "development"}
      enableLocalhost={process.env.NODE_ENV === "development"}
    >
      <InnerPixelProvider storeId={storeId} enabledEvents={resolved}>
        {children}
      </InnerPixelProvider>
    </MetaPixel>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useMetaPixel(): MetaPixelContextValue {
  const context = useContext(MetaPixelContext);
  if (!context) {
    throw new Error("useMetaPixel must be used within a MetaPixelProvider");
  }
  return context;
}
