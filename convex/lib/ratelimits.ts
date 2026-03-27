// filepath: convex/lib/ratelimits.ts
//
// Définitions centralisées des rate limits Pixel-Mart.
// Utilise @convex-dev/ratelimiter — toutes les limites sont ici, pas dans les mutations.
//
// Usage dans une mutation :
//   import { rateLimiter } from "./ratelimits";
//   await rateLimiter.limit(ctx, "createOrder", { key: userId, throws: true });

import { RateLimiter } from "@convex-dev/ratelimiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.ratelimiter, {
  // Commandes : max 5 par minute, fenêtre glissante
  createOrder: {
    kind: "token bucket",
    rate: 5,
    period: 60_000, // 1 min
    capacity: 5,
    shards: 2,
  },

  // Génération d'URL d'upload : max 20 par minute
  generateUploadUrl: {
    kind: "token bucket",
    rate: 20,
    period: 60_000,
    capacity: 20,
    shards: 2,
  },

  // Questions produit : max 10 par heure
  askQuestion: {
    kind: "fixed window",
    rate: 10,
    period: 3_600_000, // 1h
  },

  // Avis : max 5 par heure
  createReview: {
    kind: "fixed window",
    rate: 5,
    period: 3_600_000,
  },

  // Connexion (Better Auth le gère, mais on sécurise aussi les actions sensibles)
  sensitiveAction: {
    kind: "token bucket",
    rate: 10,
    period: 60_000,
    capacity: 10,
    shards: 1,
  },
});
