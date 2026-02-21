export const ROUTES = {
  // Public
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT: (slug: string) => `/products/${slug}`,
  STORE: (slug: string) => `/store/${slug}`,
  CART: "/cart",
  CHECKOUT: "/checkout",

  // Auth
  LOGIN: "/login",
  REGISTER: "/register",

  // Vendor
  VENDOR_DASHBOARD: "/dashboard",
  VENDOR_PRODUCTS: "/products",
  VENDOR_PRODUCTS_NEW: "/products/new",
  VENDOR_PRODUCT_EDIT: (id: string) => `/products/${id}/edit`,
  VENDOR_ORDERS: "/orders",
  VENDOR_ORDER: (id: string) => `/orders/${id}`,
  VENDOR_FINANCE: "/finance",
  VENDOR_PAYOUTS: "/finance/payouts",
  VENDOR_STORE_SETTINGS: "/store/settings",
  VENDOR_SETTINGS: "/settings",
  VENDOR_SECURITY: "/settings/security",

  // Admin
  ADMIN_DASHBOARD: "/dashboard",
  ADMIN_STORES: "/stores",
  ADMIN_USERS: "/users",
  ADMIN_CATEGORIES: "/categories",
  ADMIN_PAYOUTS: "/payouts",
  ADMIN_REPORTS: "/reports",
} as const;
