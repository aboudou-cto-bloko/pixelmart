// filepath: convex/analytics/helpers.ts

// ──────────────────────────────────────────────
// Analytics utility functions
// ──────────────────────────────────────────────

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m";
export type Granularity = "day" | "week" | "month";

interface DateRange {
  start: number; // Unix ms
  end: number; // Unix ms
}

/**
 * Calculate current and previous date ranges for comparison.
 * Example: "30d" → current = last 30 days, previous = 30 days before that.
 */
export function getDateRanges(period: AnalyticsPeriod): {
  current: DateRange;
  previous: DateRange;
} {
  const now = Date.now();
  const msPerDay = 86_400_000;

  let durationMs: number;
  switch (period) {
    case "7d":
      durationMs = 7 * msPerDay;
      break;
    case "30d":
      durationMs = 30 * msPerDay;
      break;
    case "90d":
      durationMs = 90 * msPerDay;
      break;
    case "12m":
      durationMs = 365 * msPerDay;
      break;
  }

  return {
    current: { start: now - durationMs, end: now },
    previous: { start: now - 2 * durationMs, end: now - durationMs },
  };
}

/**
 * Calculate percentage change between two values.
 * Returns 0 if previous is 0 to avoid division by zero.
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Group a timestamp into a bucket key based on granularity.
 * Returns ISO date string: "2026-02-23" for day, "2026-W08" for week, "2026-02" for month.
 */
export function groupByDate(
  timestamp: number,
  granularity: Granularity,
): string {
  const date = new Date(timestamp);

  switch (granularity) {
    case "day":
      return date.toISOString().slice(0, 10); // "2026-02-23"

    case "week": {
      // ISO week number
      const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
      );
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
      );
      return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
    }

    case "month":
      return date.toISOString().slice(0, 7); // "2026-02"
  }
}

/**
 * Generate all date bucket keys between start and end for a given granularity.
 * Ensures chart has no gaps even for periods with zero data.
 */
export function generateDateBuckets(
  start: number,
  end: number,
  granularity: Granularity,
): string[] {
  const buckets = new Set<string>();
  const msPerDay = 86_400_000;

  let step: number;
  switch (granularity) {
    case "day":
      step = msPerDay;
      break;
    case "week":
      step = 7 * msPerDay;
      break;
    case "month":
      step = 30 * msPerDay; // approximate, we deduplicate with Set
      break;
  }

  let cursor = start;
  while (cursor <= end) {
    buckets.add(groupByDate(cursor, granularity));
    cursor += step;
  }
  // Always include the end bucket
  buckets.add(groupByDate(end, granularity));

  return Array.from(buckets).sort();
}

/**
 * Infer best granularity from period if not specified.
 */
export function inferGranularity(period: AnalyticsPeriod): Granularity {
  switch (period) {
    case "7d":
      return "day";
    case "30d":
      return "day";
    case "90d":
      return "week";
    case "12m":
      return "month";
  }
}

/**
 * Format a date bucket key for display.
 */
export function formatBucketLabel(
  bucket: string,
  granularity: Granularity,
): string {
  switch (granularity) {
    case "day": {
      const d = new Date(bucket);
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    }
    case "week":
      return bucket; // "2026-W08"
    case "month": {
      const [year, month] = bucket.split("-");
      const d = new Date(Number(year), Number(month) - 1);
      return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    }
  }
}
