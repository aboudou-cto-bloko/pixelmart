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
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
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

  const validateProductForCart = useMutation(
    api.cart.mutations.validateProductForCart,
  );

  const addItem = useCallback(
    async (newItem: Omit<CartItem, "cartItemId">) => {
      // Validate with server before adding
      const validatedItem = await validateProductForCart({
        productId: newItem.productId,
        variantId: newItem.variantId,
        quantity: newItem.quantity,
      });

      setItems((prev) => {
        const cartItemId = generateCartItemId(
          newItem.productId,
          newItem.variantId,
        );

        const existingIndex = prev.findIndex(
          (i) => i.cartItemId === cartItemId,
        );

        // Use server-validated data
        const itemToAdd: CartItem = {
          cartItemId,
          productId: validatedItem.productId,
          variantId: validatedItem.variantId,
          title: validatedItem.title,
          variantTitle: validatedItem.variantTitle,
          slug: validatedItem.slug,
          image: validatedItem.image,
          price: validatedItem.price,
          comparePrice: validatedItem.comparePrice,
          storeId: validatedItem.storeId,
          storeName: validatedItem.storeName,
          storeSlug: validatedItem.storeSlug,
          quantity: validatedItem.quantity,
          maxQuantity: validatedItem.maxQuantity,
          isDigital: validatedItem.isDigital,
        };

        if (existingIndex >= 0) {
          // Update quantity (cap at server-validated maxQuantity)
          const updated = [...prev];
          const existing = updated[existingIndex];
          const newQty = Math.min(
            existing.quantity + itemToAdd.quantity,
            itemToAdd.maxQuantity,
          );
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
            maxQuantity: itemToAdd.maxQuantity,
          };
          return updated;
        }

        // Add new item with validated data
        return [...prev, itemToAdd];
      });
    },
    [validateProductForCart],
  );

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

  const validateCart = useMutation(api.cart.mutations.validateCart);

  const syncWithServer = useCallback(async () => {
    if (items.length === 0)
      return { hasChanges: false, errors: [], unavailableItems: [] };

    try {
      const validation = await validateCart({
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          expectedPrice: item.price,
          expectedTitle: item.title,
        })),
      });

      if (validation.hasChanges || validation.unavailableItems.length > 0) {
        // Update cart with server data
        setItems((prevItems) => {
          const updatedItems = prevItems.filter(
            (item) => !validation.unavailableItems.includes(item.productId),
          );

          // Update items with current server data
          return updatedItems.map((item) => {
            const validated = validation.items.find(
              (v) =>
                v.productId === item.productId &&
                v.variantId === item.variantId,
            );

            if (validated) {
              return {
                ...item,
                price: validated.currentPrice,
                maxQuantity: validated.maxQuantity,
                quantity: Math.min(item.quantity, validated.maxQuantity),
                image: validated.image,
              };
            }

            return item;
          });
        });
      }

      return {
        hasChanges: validation.hasChanges,
        errors: validation.errors,
        unavailableItems: validation.unavailableItems,
      };
    } catch (error) {
      console.error("Cart validation failed:", error);
      return {
        hasChanges: false,
        errors: ["Erreur lors de la validation du panier"],
        unavailableItems: [],
      };
    }
  }, [items, validateCart]);

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
      syncWithServer,
    }),
    [
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      clearStore,
      getItemCount,
      syncWithServer,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
