# PIXEL-MART — Claude Code Context

## Project Overview

**Pixel-Mart** is a multi-vendor e-commerce marketplace targeting West African markets (primarily Benin/Cotonou).

- **Currency**: XOF (Franc CFA) — all amounts stored in **centimes**
- **Users**: Customers, Vendors, Admins with full RBAC
- **Phase**: Phase 1 in progress (Phase 0 complete)

---

## Tech Stack

| Layer      | Technology               |
| ---------- | ------------------------ |
| Framework  | Next.js 14 (App Router)  |
| Database   | Convex                   |
| Auth       | Convex Auth (Better Auth)|
| Payments   | Moneroo (Mobile Money)   |
| UI         | shadcn/ui + Tailwind CSS |
| Email      | Resend + react-email     |
| PDF        | @react-pdf/renderer      |
| Testing    | Playwright + Vitest      |
| Package    | pnpm                     |

---

## Key Commands

```bash
# Development
pnpm dev                    # Start Next.js + Convex dev servers
pnpm convex dev            # Start Convex backend only

# Code Quality
pnpm lint                   # ESLint check
pnpm lint:fix              # Fix linting issues
pnpm format                # Prettier format
pnpm typecheck             # TypeScript strict check

# Testing
pnpm test                  # Run Vitest unit tests
pnpm test:e2e              # Run Playwright E2E tests

# Build & Deploy
pnpm build                 # Production build
pnpm convex deploy         # Deploy Convex to production
```

---

## Project Structure

```
pixelmart/
├── convex/                 # Backend (Convex functions)
│   ├── schema.ts          # Database schema (SINGLE SOURCE OF TRUTH)
│   ├── auth.ts            # Auth configuration
│   ├── http.ts            # HTTP routes (webhooks)
│   ├── crons.ts           # Scheduled jobs
│   ├── [domain]/          # Domain-driven folders
│   │   ├── queries.ts     # Read operations
│   │   ├── mutations.ts   # Write operations
│   │   └── helpers.ts     # Domain utilities
│   └── lib/               # Shared backend utilities
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── (auth)/        # Auth pages (login, register)
│   │   ├── (storefront)/  # Customer-facing pages
│   │   ├── (customer)/    # Customer account pages
│   │   ├── (vendor)/      # Vendor dashboard
│   │   └── (admin)/       # Admin panel
│   ├── components/        # UI components (Atomic Design)
│   │   ├── ui/            # shadcn/ui base components
│   │   ├── atoms/         # Basic building blocks
│   │   ├── molecules/     # Combined atoms
│   │   ├── organisms/     # Complex components
│   │   └── templates/     # Page layouts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities
│   ├── types/             # TypeScript types
│   └── providers/         # Context providers
└── e2e/                   # Playwright E2E tests
```

---

## Coding Conventions

### TypeScript
- Strict mode always on
- NO `any` type — use `unknown` + type guards
- Types derived from Convex schema: `type OrderStatus = Doc<"orders">["status"]`
- Zod for runtime validation

### Convex Functions
- **Queries** = read-only, reactive, cached
- **Mutations** = write to DB, transactional
- **Actions** = external API calls (NOT transactional)
- ⚠️ **NEVER** call external APIs inside mutations — use action → mutation pattern
- ⚠️ **NEVER** use `ctx.db` directly in `httpAction` — call via `ctx.runMutation`

### Components (Atomic Design)
- Atoms: `Button`, `Input`, `Badge` — no business logic
- Molecules: `SearchBar`, `CartItem` — combine atoms
- Organisms: `ProductGrid`, `OrderTimeline` — feature-complete sections
- Templates: Page layouts with slots

### Naming
- Components: PascalCase (`ProductCard.tsx`)
- Hooks: camelCase with `use` prefix (`useStore.ts`)
- Convex tables: snake_case (`product_variants`)
- Convex functions: camelCase (`getProducts`)

---

## Critical Business Rules

### F-01: Transaction Logging
Every balance change MUST create a transaction record in the same Convex mutation.

### F-02: Minimum Payout
Minimum payout: 655 XOF (100 centimes = 1 XOF). Fees deducted from amount.

### F-03: Balance Release
Balance credited only when `order.status === 'delivered'` AND `delivered_at > 48h`.

### F-04: Commission Calculation
```typescript
commission_amount = total_amount × commission_rate / 10000
// Example: 10000 XOF × 500 (5%) / 10000 = 500 XOF
```

### Order Status Transitions (STRICT)
```
pending → paid           (webhook confirmation)
paid → processing        (vendor confirms)
processing → shipped     (vendor adds tracking)
shipped → delivered      (confirmation or auto +7 days)
pending → cancelled      (customer, within 2h)
paid → cancelled         (customer, within 2h — auto refund)
processing → cancelled   (vendor only — auto refund)
paid/delivered → refunded (admin or vendor)

FORBIDDEN:
- delivered → cancelled
- shipped → paid
- refunded → any
- cancelled → any
```

---

## Commit Convention

```
type(scope): description

Types: feat, fix, refactor, ui, schema, api, config, docs, test, chore
Scopes: auth, users, stores, products, orders, payments, transactions,
        payouts, reviews, coupons, checkout, dashboard, admin, ads
```

Examples:
```
feat(products): add product creation form with image upload
fix(checkout): prevent double payment submission
schema(orders): add delivery distance tracking
```

---

## Git Workflow

### Branch Strategy (Trunk-Based)

```
main                    ← production (auto-deploys to Vercel + Convex)
  └── feat/xxx          ← feature branches (max 3 days)
  └── fix/xxx           ← bugfix branches
  └── hotfix/xxx        ← emergency production fixes
```

### Rules (ENFORCED)

1. **Direct pushes to `main` are BLOCKED** — branch protection enabled
2. **Always**: feature branch → PR → squash merge
3. **PR title = commit message** (validated by CI)
4. **Max 3 days** per feature branch — if longer, scope is too big
5. **Delete branch after merge**

### Daily Workflow

```bash
# Start work
git checkout main
git pull origin main
git checkout -b feat/checkout-delivery-calculator

# During work (commit frequently)
git add .
git commit -m "feat(checkout): add delivery distance calculation"
git push origin feat/checkout-delivery-calculator

# Before PR (rebase on latest main)
git checkout main
git pull origin main
git checkout feat/checkout-delivery-calculator
git rebase main
git push origin feat/checkout-delivery-calculator --force-with-lease

# Create PR on GitHub → Squash merge → Delete branch
```

### Pre-commit Hooks (Husky)

Automatically runs on each commit:
- **commitlint**: Validates commit message format
- **lint-staged**: ESLint + Prettier on staged files

### CI Pipeline (GitHub Actions)

Runs on every PR:
1. `pnpm lint` — ESLint check
2. `pnpm format:check` — Prettier check
3. `pnpm typecheck` — TypeScript strict
4. `pnpm test` — Vitest unit tests
5. `pnpm build` — Production build

### Branch Naming

```
feat/checkout-delivery-calculator
feat/vendor-analytics-dashboard
fix/order-status-transition-bug
fix/moneroo-webhook-timeout
hotfix/payment-double-charge
schema/ads-demand-multiplier
ui/product-card-skeleton
refactor/extract-delivery-helpers
```

---

## Current Focus (Phase 1)

### ✅ Completed
- Steps 1.1–1.10
- Storefront themes
- Reviews & ratings
- Ad space system (backend + frontend sections)
- Delivery system (geocoding + Haversine distance)
- Code quality (ESLint, Prettier, Husky, CI)

### 🔲 In Progress
- Step 1.5: Analytics dashboard
- Checkout page: Address autocomplete + delivery fee wiring
- Admin/vendor ad management pages

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema — all tables, indexes |
| `convex/http.ts` | Webhook routes (Moneroo payments) |
| `convex/crons.ts` | Scheduled jobs (ad lifecycle, balance release) |
| `src/app/layout.tsx` | Root layout with providers |
| `src/components/ui/` | shadcn/ui base components |
| `tailwind.config.ts` | Theme configuration |
| `.env.local` | Environment variables (NEVER commit) |

---

## External Integrations

### Moneroo (Payments)
- Webhook: `POST /api/webhooks/moneroo`
- Events: `payment.success`, `payment.failed`, `ad_payment.success`
- Always verify signature before processing

### Nominatim (Geocoding)
- Rate limit: 1 request/second
- Country restriction: `countrycodes=bj`
- Hook: `useAddressAutocomplete` with debounce

### Resend (Email)
- Templates in `src/components/emails/`
- Types: Order confirmation, payout, new review, etc.

---

## Do NOT

- ❌ Build Phase 2+ features (AI Layer) during Phase 1
- ❌ Store sensitive data client-side
- ❌ Call external APIs inside Convex mutations
- ❌ Skip input validation on financial operations
- ❌ Hardcode credentials or API keys
- ❌ Build custom UI when shadcn provides it
- ❌ Use CSS instead of Tailwind utilities
- ❌ Create local type definitions for schema-derived types
