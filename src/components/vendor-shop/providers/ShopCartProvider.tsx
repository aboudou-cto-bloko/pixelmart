"use client";

// filepath: src/components/vendor-shop/providers/ShopCartProvider.tsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────

export interface ShopCartItem {
  cartItemId: string;
  productId: string;
  variantId?: string;
  title: string;
  variantTitle?: string;
  slug: string;
  image: string;
  price: number; // centimes
  comparePrice?: number; // centimes
  quantity: number;
  maxQuantity: number;
  isDigital: boolean;
}

interface ShopCartState {
  items: ShopCartItem[];
  totalItems: number;
  totalAmount: number; // centimes
}

interface ShopCartActions {
  addItem: (item: Omit<ShopCartItem, "cartItemId">) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
}

type ShopCartContextValue = ShopCartState & ShopCartActions;

interface ShopCartProviderProps {
  children: ReactNode;
  storeSlug: string;
}

// ─── Storage helpers ──────────────────────────────────────────

function getStorageKey(storeSlug: string): string {
  return `pixelmart-shop-cart-${storeSlug}`;
}

function generateCartItemId(productId: string, variantId?: string): string {
  return variantId ? `${productId}__${variantId}` : productId;
}

function loadFromStorage(storeSlug: string): ShopCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(storeSlug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(storeSlug: string, items: ShopCartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(storeSlug), JSON.stringify(items));
  } catch {
    // Storage full or disabled — silent fail
  }
}

// ─── Context ─────────────────────────────────────────────────

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function ShopCartProvider({
  children,
  storeSlug,
}: ShopCartProviderProps) {
  // Lazy init : lit localStorage directement à la construction (SSR-safe grâce au guard interne)
  const [items, setItems] = useState<ShopCartItem[]>(() =>
    loadFromStorage(storeSlug),
  );

  // Ref pour skip le save au premier render (évite d'écraser le localStorage chargé)
  const isFirstRender = useRef(true);

  // Persistence : sauvegarde à chaque changement, sauf à l'init
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToStorage(storeSlug, items);
  }, [items, storeSlug]);

  // ── Actions ──

  const addItem = useCallback((newItem: Omit<ShopCartItem, "cartItemId">) => {
    setItems((prev) => {
      const cartItemId = generateCartItemId(
        newItem.productId,
        newItem.variantId,
      );
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = Math.min(
          existing.quantity + newItem.quantity,
          newItem.maxQuantity,
        );
        updated[existingIndex] = { ...existing, quantity: newQty };
        return updated;
      }

      return [...prev, { ...newItem, cartItemId }];
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
          : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  // ── Derived state ──

  const state = useMemo(
    (): ShopCartState => ({
      items,
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    [items],
  );

  const value = useMemo(
    () => ({
      ...state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemCount,
    }),
    [state, addItem, removeItem, updateQuantity, clearCart, getItemCount],
  );

  return (
    <ShopCartContext.Provider value={value}>
      {children}
    </ShopCartContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useShopCart(): ShopCartContextValue {
  const context = useContext(ShopCartContext);
  if (!context) {
    throw new Error("useShopCart must be used within a ShopCartProvider");
  }
  return context;
}
