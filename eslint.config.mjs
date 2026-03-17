// filepath: eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // ─── ERRORS (bloquants, zero tolérance) ───────────────────────
      "@typescript-eslint/no-explicit-any": "error",
      "no-debugger": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],

      // ─── WARNINGS (dette technique — à résorber par fichier) ──────
      // Non-null assertions : légitimes dans certains patterns Convex
      // mais à remplacer progressivement par des guards explicites
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Unused vars : imports morts à nettoyer au fil des PR
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Type imports : auto-fixable, warn pour ne pas bloquer les commits
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],

      // Console : warn — les console.log de debug doivent partir
      "no-console": ["warn", { allow: ["warn", "error"] }],

      "prefer-const": "error",
    },
  },

  // ─── Ignores ────────────────────────────────────────────────────────
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "convex/_generated/**",
      // shadcn/ui — composants générés, on ne les touche pas
      "src/components/ui/**",
      "commitlint.config.ts",
      "eslint.config.mjs",
      "next.config.ts",
      "postcss.config.mjs",
    ],
  },
);
