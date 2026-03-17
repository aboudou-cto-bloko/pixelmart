// filepath: commitlint.config.ts
import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "ui",
        "schema",
        "api",
        "config",
        "docs",
        "test",
        "chore",
        "perf",
      ],
    ],
    "scope-enum": [
      2,
      "always",
      [
        "auth",
        "users",
        "stores",
        "products",
        "orders",
        "payments",
        "transactions",
        "payouts",
        "reviews",
        "coupons",
        "messages",
        "notifications",
        "categories",
        "dashboard",
        "storefront",
        "checkout",
        "analytics",
        "admin",
        "ai",
        "ads",
        "themes",
        "deps",
        "ci",
      ],
    ],
    "scope-empty": [2, "never"],
    "subject-case": [0], // désactivé — permet ESLint, TypeScript, PR, XOF etc.
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
    "body-leading-blank": [1, "always"],
    "footer-leading-blank": [1, "always"],
  },
};

export default config;
