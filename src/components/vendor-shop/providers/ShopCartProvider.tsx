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
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────

export interface ShopCartItem {
  cartItemId: string;
  productId: Id<"products">;
  variantId?: Id<"product_variants">;
  title: string;
  variantTitle?: string;
  slug: string;
  image: string;
  price: number; // centimes
  comparePrice?: number; // centimes
  storeId: Id<"stores">;
  storeName: string;
  storeSlug: string;
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
  addItem: (item: Omit<ShopCartItem, "cartItemId">) => Promise<void>;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  syncWithServer: () => Promise<{
    hasChanges: boolean;
    errors: string[];
    unavailableItems: string[];
  }>;
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

  const validateProductForCart = useMutation(
    api.cart.mutations.validateProductForCart,
  );

  const addItem = useCallback(
    async (newItem: Omit<ShopCartItem, "cartItemId">) => {
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
        const itemToAdd: ShopCartItem = {
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
      console.error("Shop cart validation failed:", error);
      return {
        hasChanges: false,
        errors: ["Erreur lors de la validation du panier"],
        unavailableItems: [],
      };
    }
  }, [items, validateCart]);

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
      syncWithServer,
    }),
    [
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getItemCount,
      syncWithServer,
    ],
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
