// filepath: src/types/cart.ts

import type { Id } from "../../convex/_generated/dataModel";

/** Item dans le panier — snapshot des données au moment de l'ajout */
export interface CartItem {
  /** ID unique dans le panier (productId + variantId) */
  cartItemId: string;

  productId: Id<"products">;
  variantId?: Id<"product_variants">;

  /** Snapshot au moment de l'ajout (affichage sans re-fetch) */
  title: string;
  variantTitle?: string;
  slug: string;
  image: string;
  price: number; // centimes — prix unitaire (variant price si applicable)
  comparePrice?: number;

  /** Boutique */
  storeId: Id<"stores">;
  storeName: string;
  storeSlug: string;

  /** Quantité */
  quantity: number;

  /** Stock max dispo au moment de l'ajout */
  maxQuantity: number;

  /** Digital product */
  isDigital: boolean;
}

export interface CartStore {
  storeId: Id<"stores">;
  storeName: string;
  storeSlug: string;
  items: CartItem[];
  subtotal: number; // centimes
}

export interface CartState {
  items: CartItem[];
  /** Items groupés par boutique */
  stores: CartStore[];
  /** Nombre total d'articles */
  totalItems: number;
  /** Sous-total global en centimes */
  totalAmount: number;
}

export interface CartActions {
  addItem: (item: Omit<CartItem, "cartItemId">) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  clearStore: (storeId: string) => void;
  getItemCount: () => number;
}
