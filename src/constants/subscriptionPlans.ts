export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Gratuit",
    price: 0, // centimes
    commission_rate: 500, // basis points = 5%
    features: ["Jusqu'à 50 produits", "Dashboard de base", "Support email"],
    limits: {
      max_products: 50,
      max_images_per_product: 5,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 2900, // 29€ en centimes
    commission_rate: 300, // 3%
    features: [
      "Produits illimités",
      "Analytics avancés",
      "Support prioritaire",
      "Personnalisation vitrine",
    ],
    limits: {
      max_products: Infinity,
      max_images_per_product: 10,
    },
  },
  business: {
    id: "business",
    name: "Business",
    price: 9900, // 99€ en centimes
    commission_rate: 200, // 2%
    features: [
      "Tout Pro +",
      "API accès",
      "Manager multi-staff",
      "Export données",
      "Support dédié",
    ],
    limits: {
      max_products: Infinity,
      max_images_per_product: 20,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS;
