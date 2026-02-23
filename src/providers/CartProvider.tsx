// filepath: src/providers/CartProvider.tsx

"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, CartState, CartActions, CartStore } from "@/types/cart";

const STORAGE_KEY = "pixelmart_cart";

function generateCartItemId(productId: string, variantId?: string): string {
  return variantId ? `${productId}__${variantId}` : productId;
}

function groupByStore(items: CartItem[]): CartStore[] {
  const storeMap = new Map<string, CartStore>();

  for (const item of items) {
    const key = item.storeId;
    if (!storeMap.has(key)) {
      storeMap.set(key, {
        storeId: item.storeId,
        storeName: item.storeName,
        storeSlug: item.storeSlug,
        items: [],
        subtotal: 0,
      });
    }
    const store = storeMap.get(key)!;
    store.items.push(item);
    store.subtotal += item.price * item.quantity;
  }

  return Array.from(storeMap.values());
}

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or disabled — silent fail
  }
}

// ─── Context ─────────────────────────────────────────────────
export const CartContext = createContext<(CartState & CartActions) | null>(
  null,
);

// ─── Provider ────────────────────────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadFromStorage);
  const [hydrated, setHydrated] = useState(() => typeof window !== "undefined");

  // Persist to localStorage on change (skip SSR)
  useEffect(() => {
    if (hydrated) {
      saveToStorage(items);
    }
  }, [items, hydrated]);

  // Persist to localStorage on change
  useEffect(() => {
    if (hydrated) {
      saveToStorage(items);
    }
  }, [items, hydrated]);

  // ── Actions ──

  const addItem = useCallback((newItem: Omit<CartItem, "cartItemId">) => {
    setItems((prev) => {
      const cartItemId = generateCartItemId(
        newItem.productId,
        newItem.variantId,
      );

      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);

      if (existingIndex >= 0) {
        // Update quantity (cap at maxQuantity)
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = Math.min(
          existing.quantity + newItem.quantity,
          newItem.maxQuantity,
        );
        updated[existingIndex] = { ...existing, quantity: newQty };
        return updated;
      }

      // Add new item
      return [...prev, { ...newItem, cartItemId }];
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(cartItemId);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
            : item,
        ),
      );
    },
    [removeItem],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const clearStore = useCallback((storeId: string) => {
    setItems((prev) => prev.filter((i) => i.storeId !== storeId));
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  // ── Derived state ──

  const state = useMemo((): CartState => {
    const stores = groupByStore(items);
    return {
      items,
      stores,
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  }, [items]);

  const value = useMemo(
    () => ({
      ...state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      clearStore,
      getItemCount,
    }),
    [
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      clearStore,
      getItemCount,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
