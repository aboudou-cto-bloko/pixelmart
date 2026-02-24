// filepath: src/constants/routes.ts

export const ROUTES = {
  // ---- Public (storefront) ----
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT: (slug: string) => `/products/${slug}`,
  CATEGORIES: "/products",
  CATEGORY: (slug: string) => `/categories/${slug}`,
  STORES: "/stores",
  STORE: (slug: string) => `/stores/${slug}`,
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDER_CONFIRMATION: "/checkout/confirmation",

  // ---- Auth ----
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // ---- Onboarding ----
  ONBOARDING_VENDOR: "/onboarding/vendor",

  // ---- Customer ----
  CUSTOMER_ORDERS: "/orders",
  CUSTOMER_ORDER: (id: string) => `/orders/${id}`,

  // ---- Vendor (préfixe /vendor/) ----
  VENDOR_DASHBOARD: "/vendor/dashboard",
  VENDOR_PRODUCTS: "/vendor/products",
  VENDOR_PRODUCTS_NEW: "/vendor/products/new",
  VENDOR_PRODUCT_EDIT: (id: string) => `/vendor/products/${id}/edit`,
  VENDOR_ORDERS: "/vendor/orders",
  VENDOR_ORDER: (id: string) => `/vendor/orders/${id}`,
  VENDOR_ANALYTICS: "/vendor/analytics",
  VENDOR_FINANCE: "/vendor/finance",
  VENDOR_FINANCE_INVOICES: "/vendor/finance/invoices",
  VENDOR_PAYOUTS: "/vendor/finance/payouts",
  VENDOR_STORE_SETTINGS: "/vendor/store/settings",
  VENDOR_SETTINGS: "/vendor/settings",
  VENDOR_SECURITY: "/vendor/settings/security",

  // ---- Admin (préfixe /admin/) ----
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_STORES: "/admin/stores",
  ADMIN_USERS: "/admin/users",
  ADMIN_CATEGORIES: "/admin/categories",
  ADMIN_PAYOUTS: "/admin/payouts",
  ADMIN_REPORTS: "/admin/reports",
} as const;
