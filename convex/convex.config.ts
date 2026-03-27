import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import ratelimiter from "@convex-dev/ratelimiter/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(ratelimiter);

export default app;
