import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Auto-confirmation livraison : shipped > 7 jours → delivered
crons.interval(
  "auto confirm delivery",
  { hours: 6 },
  internal.orders.mutations.autoConfirmDelivery,
);

export default crons;
