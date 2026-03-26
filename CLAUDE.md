# PIXEL-MART — Claude Code Context

## Project Overview

**Pixel-Mart** is a multi-vendor e-commerce marketplace targeting West African markets (primarily Benin/Cotonou).

- **Currency**: XOF (Franc CFA) — all amounts stored in **centimes** (1 XOF = 100 centimes)
- **Users**: Customers, Vendors, Admins, Agents with full RBAC
- **Phase**: Phase 1 in progress (Phase 0 complete)
- **Locale**: French (fr-FR / fr-BJ), UTC timestamps, Cotonou timezone

---

## Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Framework  | Next.js 15 (App Router)           |
| Database   | Convex (reactive, serverless)     |
| Auth       | Better Auth via Convex component  |
| Payments   | Moneroo (Mobile Money — West Africa) |
| UI         | shadcn/ui + Tailwind CSS v4       |
| Email      | Resend + react-email              |
| PDF        | @react-pdf/renderer               |
| Animation  | motion/react (Framer Motion v12)  |
| Testing    | Playwright + Vitest               |
| Package    | pnpm                              |

---

## Key Commands

```bash
# Development
pnpm dev                    # Start Next.js + Convex dev servers
pnpm convex dev             # Start Convex backend only

# Code Quality
pnpm lint                   # ESLint check
pnpm lint:fix               # Fix linting issues
pnpm format                 # Prettier format
pnpm typecheck              # TypeScript strict check

# Migrations
npx convex run migrations/ensureCentimes:run '{"dry_run": true}'
npx convex run migrations/ensureCentimes:run '{"dry_run": false}'

# Testing
pnpm test                   # Run Vitest unit tests
pnpm test:e2e               # Run Playwright E2E tests

# Build & Deploy
pnpm build                  # Production build
pnpm convex deploy          # Deploy Convex to production
```

---

## Project Structure

```
pixelmart/
├── convex/                    # Backend (Convex functions)
│   ├── schema.ts             # Database schema (SINGLE SOURCE OF TRUTH)
│   ├── auth.ts               # Auth + Better Auth config
│   ├── http.ts               # HTTP routes (webhooks only)
│   ├── crons.ts              # Scheduled jobs
│   ├── lib/
│   │   └── constants.ts      # Commission rates, delays, defaults
│   ├── migrations/           # One-off data migration scripts
│   ├── [domain]/
│   │   ├── queries.ts        # Read-only, reactive
│   │   ├── mutations.ts      # Writes (transactional)
│   │   ├── actions.ts        # External API calls (non-transactional)
│   │   └── helpers.ts        # Domain utilities (pure functions)
│   ├── emails/
│   │   └── send.ts           # Internal email actions (Resend)
│   └── notifications/
│       ├── send.ts           # Dual-channel dispatchers (email + in-app)
│       ├── mutations.ts      # Mark read/unread
│       ├── queries.ts        # List, count unread
│       └── helpers.ts        # NOTIFICATION_TYPES, status labels
├── emails/                    # React Email templates (rendered server-side)
│   ├── components/
│   │   └── Layout.tsx        # emailTheme, shared wrappers
│   ├── OrderConfirmation.tsx
│   ├── NewOrder.tsx
│   ├── OrderShipped.tsx
│   ├── OrderDelivered.tsx
│   ├── OrderCancelled.tsx
│   ├── OrderStatusUpdate.tsx
│   ├── LowStockAlert.tsx
│   ├── PayoutCompleted.tsx
│   ├── ReturnStatusUpdate.tsx
│   ├── NewReview.tsx
│   ├── VerifyEmail.tsx       # Handled by Better Auth
│   └── ResetPassword.tsx     # Handled by Better Auth
├── src/
│   ├── app/
│   │   ├── (auth)/           # /login, /register, /forgot-password
│   │   ├── (marketing)/      # /landing (public, no auth required)
│   │   ├── (storefront)/     # /shop/[slug], /search
│   │   ├── (customer)/       # /account, /orders, /cart
│   │   ├── (vendor)/         # /vendor/* (role: vendor | admin)
│   │   ├── (agent)/          # /agent/* (role: agent) — in progress
│   │   └── (admin)/          # /admin/* (role: admin)
│   ├── components/
│   │   ├── ui/               # shadcn/ui base components (DO NOT modify)
│   │   ├── atoms/            # Stateless primitives (no business logic)
│   │   ├── molecules/        # Composed atoms
│   │   ├── organisms/        # Feature-complete sections
│   │   ├── templates/        # Page layouts with slots
│   │   ├── marketing/        # Landing page components only
│   │   └── emails/           # Email sub-components (OrderItemsTable, etc.)
│   ├── hooks/
│   │   ├── useAddressAutocomplete.ts  # Nominatim geocoding + debounce
│   │   ├── useBulkSelection.ts        # Multi-select state
│   │   ├── useCart.ts                 # Cart operations
│   │   ├── useCurrentUser.ts          # Authenticated user
│   │   ├── useDeliveryBatchPDF.tsx    # PDF generation
│   │   ├── useInvoiceDownload.tsx     # Invoice PDF
│   │   ├── use-mobile.ts              # Viewport detection
│   │   ├── useNotifications.ts        # Notification stream
│   │   └── usePayouts.ts              # Payout operations
│   ├── lib/
│   │   ├── format.ts         # formatPrice(), formatDate(), formatRelativeTime()
│   │   └── utils.ts          # cn() and other generic utils
│   ├── types/                # App-level TypeScript types
│   └── providers/            # React context providers
└── e2e/                       # Playwright E2E tests
```

---

## Coding Conventions

### TypeScript

- Strict mode always on — NO `any`, use `unknown` + type guards
- Types derived from schema: `type OrderStatus = Doc<"orders">["status"]`
- Zod for runtime validation at system boundaries (forms, webhooks)
- `_i` prefix for intentionally unused array index params: `.map((item, _i) => ...)`

### Convex Functions

- **Queries** — read-only, reactive, auto-cached. Never mutate state.
- **Mutations** — transactional writes. Never call external APIs.
- **Actions** — external API calls (Moneroo, Resend, Nominatim). NOT transactional.
- **Internal** — prefix `internal.` to restrict to backend-only calls.
- ⚠️ **NEVER** call external APIs inside mutations — always action → `ctx.runMutation`
- ⚠️ **NEVER** use `ctx.db` inside `httpAction` — call via `ctx.runMutation` / `ctx.runQuery`
- Background jobs: `ctx.scheduler.runAfter(0, internal.domain.actions.foo, args)`

### Convex File Pattern (per domain)

```typescript
// queries.ts — always export named query functions
export const getById = query({ args: { id: v.id("table") }, handler: async (ctx, args) => { ... } });

// mutations.ts — validate auth first, then business rules, then write
export const create = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Non authentifié");
    // ... business logic
    // F-01: balance changes MUST create a transaction in the same mutation
    await ctx.db.insert("transactions", { ... });
    await ctx.db.patch(storeId, { balance: newBalance });
  }
});
```

### HTML Sanitization (server-side, in Convex)

Applied to all vendor-supplied HTML (product descriptions, store descriptions):

```typescript
function sanitizeHTML(html: string): string {
  // Removes <script>, on* attributes, javascript: protocols
  // Whitelist: p, br, strong, b, em, i, u
}
```

### Components (Atomic Design)

- **Atoms** — `Button`, `Input`, `Badge` — no business logic, no Convex calls
- **Molecules** — `SearchBar`, `CartItem` — compose atoms, may accept callbacks
- **Organisms** — `ProductGrid`, `OrderTimeline` — self-contained sections with data fetching
- **Templates** — full page layouts, delegate all data to organisms
- **Pages** (`app/**/page.tsx`) — minimal: pass searchParams/params to templates only

### Page Pattern (vendor dashboard)

```tsx
// page.tsx — Server Component, minimal
export default function DeliveryPage() {
  return <DeliveryTemplate />;
}

// Template — Client Component, owns state + queries
"use client";
export function DeliveryTemplate() {
  const stats = useQuery(api.delivery.queries.getDeliveryStats, {});
  return ( /* full layout */ );
}
```

### Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase + `use` prefix | `useNotifications.ts` |
| Convex tables | snake_case | `product_variants` |
| Convex functions | camelCase | `getProducts` |
| Routes/folders | kebab-case | `vendor/finance/invoices` |
| Constants | SCREAMING_SNAKE | `MIN_CENTIMES`, `BALANCE_RELEASE_DELAY_MS` |

---

## Money — The Only Rule That Matters

```
DB / Convex          → centimes (integer)
Moneroo webhook      → raw XOF × 100 → centimes  (data.currency === "XOF" ? data.amount * 100 : data.amount)
Display (client)     → formatPrice(centimes, "XOF") → "1 500 FCFA"  (NO division for XOF)
Email templates      → pre-formatted strings passed as props
Commission           → total_amount × commission_rate / 10_000
```

**XOF special case**: `formatPrice` does NOT divide by 100 for XOF/XAF/GNF/CDF — these currencies have no minor unit in common usage. The raw centimes value IS the FCFA display value (1500 centimes = 1500 FCFA shown, not 15 FCFA).

```typescript
// src/lib/format.ts
export function formatPrice(centimes: number, currency = "XOF"): string {
  const NO_DECIMAL = ["XOF", "XAF", "GNF", "CDF"];
  const amount = NO_DECIMAL.includes(currency) ? centimes : centimes / 100;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

// convex/emails/send.ts
function formatAmount(centimes: number, currency: string): string {
  const amount = centimes / 100;  // emails always divide (display convention)
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}
```

---

## Notification Architecture

Every user-facing event triggers a **dual-channel dispatch** from `convex/notifications/send.ts`:

```typescript
// Pattern: internalAction calling runMutation (in-app) + Resend (email)
export const notifyXxx = internalAction({
  args: { ... },
  handler: async (ctx, args) => {
    // 1. In-app
    await ctx.runMutation(internal.notifications.mutations.create, {
      user_id, type, title, body, link, channels: ["email"], sent_via: ["email"],
    });
    // 2. Email (dynamic import)
    const { render } = await import("@react-email/render");
    const { XxxTemplate } = await import("../../emails/XxxTemplate");
    const html = await render(<XxxTemplate {...props} />);
    await ctx.runAction(internal.emails.send.sendRaw, { to, subject, html });
  }
});
```

**Notification types** (schema `notifications.type` field):

| Type | Audience | Email |
|------|----------|-------|
| `order_new` | Vendor | ✅ |
| `order_status` | Customer | ✅ |
| `low_stock` | Vendor | ✅ |
| `payment` | Vendor | ✅ |
| `new_review` | Vendor | ✅ |
| `return_status` | Vendor + Customer | ✅ |
| `system` | Any | ❌ |
| `promo` | Any | ❌ |
| `storage_received` | Agent + Admin | ❌ |
| `storage_validated` | Vendor | ✅ |
| `storage_rejected` | Vendor | ✅ |
| `storage_invoice` | Vendor | ✅ |
| `storage_debt_deducted` | Vendor | ✅ |
| `payout_failed` | Vendor | ✅ |
| `ad_payment_failed` | Vendor | ✅ |

---

## Webhook Architecture (`convex/http.ts` → `convex/payments/webhooks.ts`)

Single Moneroo endpoint dispatches by `event.type`:

| `event.type` | Handler | Status |
|---|---|---|
| `payment.success` | `confirmPayment` | ✅ |
| `payment.failed` | `failPayment` | ✅ |
| `ad_payment.success` | `confirmAdPayment` | ✅ |
| `ad_payment.failed` | `failAdPayment` | ✅ |
| `payout.completed` | `confirmPayout` | ✅ |
| `payout.failed` | `failPayout` | ✅ |
| `storage_payment.success` | `confirmStoragePayment` | ✅ |
| `storage_payment.failed` | `failStoragePayment` | ✅ |

Always verify signature: `verifyMonerooSignature(req, secret)` before any processing.

---

## Critical Business Rules

### F-01: Transaction Logging
Every balance change (credit or debit) **MUST** create a `transactions` record **in the same mutation**, before the balance patch.

### F-02: Minimum Payout
655 XOF minimum (stored as 65500 centimes). Fees deducted from gross amount. Net amount must remain > 0.

### F-03: Balance Release
Balance credited only when `order.status === "delivered"` AND `delivered_at` is older than 48h. Enforced by cron.

### F-04: Commission Calculation
```typescript
commission_amount = Math.round(total_amount * commission_rate / 10_000)
// Example: 1_000_000 centimes × 500 bp / 10_000 = 50_000 centimes (500 XOF)
```

### F-05: Storage Debt Priority
When a vendor requests a payout, outstanding `storage_debt` is deducted **first** from the gross payout amount, before fee calculation.

### F-06: Storage Blocking
A vendor with `fee_status: "unpaid"` on any `storage_invoice` older than 30 days cannot withdraw their physical products.

### Order Status Transitions (STRICT)
```
pending → paid              (Moneroo webhook: payment.success)
paid → processing           (vendor action)
processing → shipped        (vendor adds tracking)
shipped → delivered         (customer confirmation OR auto +7 days cron)
pending → cancelled         (customer, within 2h of creation)
paid → cancelled            (customer, within 2h — triggers auto-refund)
processing → cancelled      (vendor only — triggers auto-refund)
paid/delivered → refunded   (admin or vendor)

FORBIDDEN: delivered→cancelled, shipped→paid, refunded→any, cancelled→any
```

### Storage Request Status Transitions
```
pending_drop_off → received     (agent: scans code + enters measurements)
received → in_stock             (admin: validates + generates invoice)
received → rejected             (admin: rejects with reason)
in_stock → [stays]              (terminal until product withdrawn)
```

---

## Roles & Access Control

| Role | Space | Guard |
|------|-------|-------|
| `customer` | `/account`, `/orders`, `/cart` | `AuthGuard roles={["customer", "vendor", "admin"]}` |
| `vendor` | `/vendor/*` | `AuthGuard roles={["vendor", "admin"]}` |
| `agent` | `/agent/*` | `AuthGuard roles={["agent", "admin"]}` |
| `admin` | `/admin/*` | `AuthGuard roles={["admin"]}` |

Middleware enforces at the edge (cookie check). `AuthGuard` is a second layer in the layout.

---

## Email Templates

All templates live in `/emails/`, rendered server-side via `@react-email/render`.
Props always receive **pre-formatted strings** for amounts (never raw centimes in templates).

| Template | Trigger | Recipient |
|----------|---------|-----------|
| `OrderConfirmation` | `payment.success` webhook | Customer |
| `NewOrder` | `payment.success` webhook | Vendor |
| `OrderShipped` | Vendor marks shipped | Customer |
| `OrderDelivered` | Status → delivered | Customer |
| `OrderCancelled` | Any cancellation | Customer |
| `OrderStatusUpdate` | Status → processing | Customer |
| `LowStockAlert` | Stock < threshold | Vendor |
| `PayoutCompleted` | `payout.completed` webhook | Vendor |
| `ReturnStatusUpdate` | Return status change | Vendor + Customer |
| `NewReview` | Review published | Vendor |
| `StorageRequestReceived` | Request created | Vendor |
| `StorageValidated` | Admin validates | Vendor |
| `StorageRejected` | Admin rejects | Vendor |
| `StorageInvoiceCreated` | Invoice generated | Vendor |
| `StorageDebtDeducted` | Debt deducted on payout | Vendor |

---

## Vendor Dashboard Pages

| Route | Purpose |
|-------|---------|
| `/vendor/dashboard` | KPI overview |
| `/vendor/orders` | Order list + management |
| `/vendor/orders/[id]` | Order detail |
| `/vendor/orders/returns` | Return requests |
| `/vendor/products` | Product catalog |
| `/vendor/products/new` | Create product |
| `/vendor/products/[id]/edit` | Edit product |
| `/vendor/delivery` | Delivery batches |
| `/vendor/delivery/[id]` | Batch detail |
| `/vendor/storage` | Storage requests + stock — **TODO** |
| `/vendor/finance` | Finance overview |
| `/vendor/finance/payouts` | Payout management |
| `/vendor/finance/invoices` | Invoice history |
| `/vendor/billing` | Storage billing & usage — **TODO** |
| `/vendor/ads` | Ad space management |
| `/vendor/store/settings` | Store settings |
| `/vendor/store/theme` | Store theme |
| `/vendor/store/meta` | Meta Pixel config |
| `/vendor/settings` | Account settings |
| `/vendor/settings/security` | 2FA settings |
| `/vendor/notifications` | Notification center |

---

## Storage Module (Phase A + B — Done ✅)

### New Tables
- `storage_requests` — vendor request lifecycle (pending_drop_off → received → in_stock/rejected)
- `storage_invoices` — fees billed after validation (centimes)
- `storage_debt` — cumulative monthly debt per store

### Storage Fee Tiers (centimes)
```typescript
// convex/lib/constants.ts
STORAGE_FEE_PER_UNIT     = 10_000  // 100 XOF/unit
STORAGE_FEE_BULK_UNIT    = 6_000   // 60 XOF/unit if qty > 50
STORAGE_FEE_MEDIUM_KG    = 500_000 // 5 000 XOF flat for 5–25 kg
STORAGE_FEE_HEAVY_BASE   = 500_000 // 5 000 XOF base for >25 kg
STORAGE_FEE_HEAVY_PER_KG = 25_000  // 250 XOF per kg above 25
```

### Storage Code Format
`PM-{3-digit-sequential}` e.g. `PM-102`. Generated on request creation. Written physically on the package by the vendor.

### Impact on Orders
`orders.items[].storage_code?: string` — populated at order creation if the product is stored at the Pixel-Mart warehouse. Shown in delivery recap and livreur emails.

---

## Commit Convention

```
type(scope): description (imperative, lowercase, no period)

Types:   feat | fix | refactor | ui | schema | api | config | docs | test | chore
Scopes:  auth | users | stores | products | orders | payments | transactions |
         payouts | reviews | coupons | checkout | dashboard | admin | ads |
         storage | agent | billing | notifications | emails | storefront
```

**Examples:**
```
schema(storage): add storage_requests, storage_invoices, storage_debt tables
feat(storage): implement vendor storage request creation and tracking
feat(agent): add warehouse reception interface with code scanner
feat(billing): add vendor billing and usage dashboard page
fix(webhook): handle storage_payment events in Moneroo handler
feat(notifications): add storage lifecycle notification dispatchers
```

---

## Git Workflow

### Branch Strategy (Trunk-Based)
```
main                    ← production (protected, auto-deploys)
  └── feat/xxx          ← feature branches (max 3 days)
  └── fix/xxx           ← bugfix branches
  └── hotfix/xxx        ← emergency fixes (direct PR, fast review)
  └── schema/xxx        ← schema-only changes
```

### Rules
1. **Direct pushes to `main` are BLOCKED** — branch protection enabled
2. feature branch → PR → squash merge → delete branch
3. PR title = final commit message (validated by CI commitlint)
4. Max 3 days per branch — scope too big if longer

### Pre-commit Hooks (Husky + lint-staged)
- **commitlint** — validates type/scope/format
- **lint-staged** — ESLint + Prettier on staged files only

### CI Pipeline (GitHub Actions on every PR)
1. `pnpm lint`
2. `pnpm format:check`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

---

## External Integrations

### Moneroo (Payments)
- Webhook: `POST /webhooks/moneroo` (Convex HTTP route)
- Signature verified via `verifyMonerooSignature` before any processing
- Amount conversion: `data.currency === "XOF" ? data.amount * 100 : data.amount`
- Payment types: `payment.*` | `ad_payment.*` | `payout.*` | `storage_payment.*`

### Nominatim (Geocoding)
- Rate limit: 1 req/sec — always debounce in `useAddressAutocomplete`
- Country restriction: `countrycodes=bj`
- Returns lat/lon stored on orders for delivery distance calculation

### Resend (Email)
- Templates: `/emails/*.tsx` (React Email)
- Sender: configured in env (`RESEND_FROM_EMAIL`)
- All sends go through `internal.emails.send.*` actions

### Better Auth
- Session cookie: `better-auth.session_token` (HTTP-only)
- Secure variant: `__Secure-better-auth.session_token`
- Routes auto-registered via `authComponent.registerRoutes(http, createAuth)`

---

## Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | All DB tables — single source of truth |
| `convex/http.ts` | Webhook routing (Moneroo + Better Auth) |
| `convex/payments/webhooks.ts` | Moneroo event handlers |
| `convex/notifications/send.ts` | Dual-channel notification dispatchers |
| `convex/emails/send.ts` | Resend email actions |
| `convex/lib/constants.ts` | All backend constants (fees, delays, rates) |
| `convex/migrations/ensureCentimes.ts` | Safety migration — verify all amounts in centimes |
| `src/lib/format.ts` | `formatPrice()`, `formatDate()`, `formatRelativeTime()` |
| `src/middleware.ts` | Preview gate + auth gate |
| `src/app/(vendor)/layout.tsx` | Vendor shell: AuthGuard + Sidebar + Breadcrumb |
| `tailwind.config.ts` | Theme + design tokens |

---

## Do NOT

- ❌ Build Phase 2+ features (AI recommendations, ML pricing) in Phase 1
- ❌ Store sensitive data client-side (tokens, secrets)
- ❌ Call external APIs inside Convex mutations — use actions
- ❌ Use `ctx.db` directly in `httpAction` — use `ctx.runMutation`/`ctx.runQuery`
- ❌ Skip signature verification on webhooks
- ❌ Skip input validation on any financial operation
- ❌ Hardcode credentials or API keys — always use env vars
- ❌ Build custom UI components when shadcn/ui provides one
- ❌ Use inline CSS — Tailwind utilities only
- ❌ Create local type aliases for schema-derived types — use `Doc<"table">["field"]`
- ❌ Divide centimes by 100 for XOF display — raw centimes = FCFA value
- ❌ Push directly to `main`
