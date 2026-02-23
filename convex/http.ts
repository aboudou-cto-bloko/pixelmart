// filepath: convex/http.ts

import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { handleMonerooWebhook } from "./payments/webhooks";

const http = httpRouter();

// ── Auth routes (Better Auth) ──
authComponent.registerRoutes(http, createAuth);

// ── Moneroo payment webhook ──
http.route({
  path: "/webhooks/moneroo",
  method: "POST",
  handler: handleMonerooWebhook,
});

export default http;
