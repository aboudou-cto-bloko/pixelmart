# Pixel-Mart — Session Handoff Document

**Branch:** `feat/product-page`
**Based on:** `origin/main` (`fecb389`)
**Last updated:** Session with Kurt (kurtdegla)

---

## What This Branch Is About

Amazon-style product page improvements + store delivery/pickup system.
All work is on `feat/product-page`, ahead of `origin/main` by 8 commits.

---

## Completed Work (already committed)

### 1. Product Specs (custom key/value)
- New `convex/product_specs/` module — `queries.ts` + `mutations.ts`
- New table `product_specs` in schema: `{ product_id, store_id, key, value, sort_order }`
- New **"Caractéristiques"** tab in `ProductForm` (edit mode only) — inline add/edit/delete/reorder
- Display on product page as a clean bordered table (alternating rows)
- **Note:** `color`, `material`, `dimensions` were originally added as fixed fields but were replaced by this flexible custom specs system. Those fixed fields were removed.

### 2. Q&A System
- New table `product_questions` in schema:
  ```
  product_id, store_id, author_id, source: "customer"|"vendor",
  body, is_published, vendor_answer, answered_at
  ```
- `convex/questions/queries.ts` — `listByProduct` (public), `listByProductForVendor`, `listByStore`, `listByCurrentUser`
- `convex/questions/mutations.ts` — `ask`, `addVendorQA`, `answer`, `editAnswer`, `editQuestion`, `remove`, `setPublished`
- `src/components/questions/ProductQASection.tsx` — public storefront section (customer ask form + vendor badge)
- `src/components/questions/VendorQAManager.tsx` — full management UI inside `ProductForm` Q&R tab (add Q&A pairs, answer pending questions, edit/delete, hide/show)
- **Important fix:** `VendorQAManager` uses `<div>` not `<form>` to avoid nested form HTML error (it lives inside `ProductForm`'s `<form>`)

### 3. Image Categorization
- `image_roles: v.optional(v.array(v.string()))` added to `products` schema (parallel array to `images`)
- Roles: `"main" | "usage" | "zoom" | "detail" | "lifestyle"` — defined in `src/constants/imageRoles.ts`
- `ProductImageUpload` — role selector (`Select`) below each image tile; drag-drop reorder keeps roles in sync; `onChange` now emits `(images, roles)` together
- `ProductGallery` — role badge on thumbnails + overlay label on main image
- `ProductForm` — `imageRoles` in `FormState`; sent to create/update mutations

### 4. Store Delivery System
**Schema changes on `stores`:**
```
use_pixelmart_service: v.optional(v.boolean())
custom_pickup_lat:     v.optional(v.number())
custom_pickup_lon:     v.optional(v.number())
custom_pickup_label:   v.optional(v.string())
has_storage_plan:      v.optional(v.boolean())
```

**Three delivery modes (CRITICAL — understand this before touching delivery code):**

| Mode | `use_pixelmart_service` | `custom_pickup_*` | `has_storage_plan` | Meaning |
|------|------------------------|-------------------|-------------------|---------|
| A | `true` | null (uses default) | `true` | Pixel-Mart stores & delivers |
| B | `true` | custom address set | `false` | Pixel-Mart delivers, vendor stores |
| C | `false` | null (cleared) | `false` | Vendor handles everything |

**Derivation rule (used in mutations):**
```typescript
has_storage_plan = use_pixelmart_service === true && custom_pickup_lat === undefined
```

**`use_own_delivery` does NOT exist as a field** — it was considered and dropped. Mode C (`use_pixelmart_service = false`) IS "own delivery" implicitly.

**Backend:**
- `convex/stores/mutations.ts` — `updateDeliverySettings` enforces 3-mode logic, auto-derives `has_storage_plan`, blocks if active orders exist
- `convex/stores/queries.ts` — `hasPendingOrders` query (used by settings UI to disable delivery card)
- `convex/users/mutations.ts` — `becomeVendor` accepts 4 delivery args, auto-derives `has_storage_plan`

**Frontend:**
- `src/constants/pickup.ts` — `PIXELMART_WAREHOUSE = { lat: 6.3592, lon: 2.4364, label: "SOBEBRA, Zone Industrielle, Cotonou, Bénin" }`
- `src/components/maps/LocationPicker.tsx` — Leaflet + OpenStreetMap + Nominatim search. `readOnly` prop for product page mini-map. Uses `cancelled` flag to fix React StrictMode "Map container already initialized" error.
- `src/app/onboarding/vendor/page.tsx` — Now 4 steps (was 3). New Step 3 "Livraison" with 3 radio options + `LocationPicker` for mode B.
- `src/app/(vendor)/vendor/store/settings/page.tsx` — Delivery card uses 3-mode radio selector (not a toggle). Yellow lock banner + disabled when `hasPendingOrders = true`.
- `src/app/(storefront)/products/[slug]/page.tsx` — Delivery section shows dynamic mini read-only map: SOBEBRA for mode A, custom pin for mode B, plain text for mode C.

**The `DELIVERY_MODES` constant is DUPLICATED** in both onboarding and settings pages. It should be extracted to `src/constants/deliveryModes.ts` — this is a known cleanup TODO.

### 5. SEO Keywords
- `seo_keywords: v.optional(v.string())` on products schema
- In `create` + `update` mutations
- Input in ProductForm SEO tab (255 chars, "never shown to customers")

### 6. Bug Fixes
- `src/app/(vendor)/vendor/store/settings/page.tsx` — was using Convex storageIds directly as `<Image src>`. Fixed by renaming to `logoStorageId`/`bannerStorageId` and resolving via `useQuery(api.files.queries.getUrl)`
- Leaflet StrictMode crash — `cancelled` flag in `LocationPicker` useEffect
- Nested `<form>` in `VendorQAManager` — replaced with `<div>`

---

## Active TODO List

### Phase 2 — Storage Pricing Display (NEXT UP)

| # | Task | File |
|---|------|------|
| 6 | Create `calculateStorageFee(weightGrams?, stock)` | `src/lib/storageFee.ts` (new) |
| 7 | Per-product fee badge in vendor product list | product list component |
| 8 | Live fee estimate in product form pricing tab | `ProductForm.tsx` |
| 9 | Monthly total in vendor settings billing card | store settings page |

**Storage pricing formula:**

Heavy products (weight ≥ 5,000g):
- 5kg – 25kg → **5,000 XOF flat**
- > 25kg → **5,000 + 250 × (kg − 25) XOF**

Light products (weight < 5,000g):
- stock ≤ 50 → **100 XOF × stock**
- stock > 50 → **5,000 + 60 × (stock − 50) XOF**

All values are monthly fees per product, in XOF (not centimes — display only).

### Phase 3 — Checkout & Billing (Later, do not implement yet)

| # | Task |
|---|------|
| 10 | Checkout: skip Pixel-Mart delivery fee if mode C |
| 11 | Checkout: use correct pickup coordinates for delivery distance calc |
| 12 | Gate mode B behind `has_storage_plan = true` (storage subscription required) |
| 13 | Storage billing subscription management page |
| 14 | Monthly storage invoice cron |

---

## Known Pending Cleanups

1. **Extract `DELIVERY_MODES` constant** from both `onboarding/vendor/page.tsx` and `vendor/store/settings/page.tsx` into `src/constants/deliveryModes.ts`
2. **`formatPrice` question** — unresolved. User reported raw centimes showing in UI. The `formatPrice` functions in `src/lib/utils.ts` and `src/lib/format.ts` do NOT divide by 100 for XOF currencies (intentional per current design). If prices look wrong, check the call site — make sure `formatPrice(value, currency)` is called and not raw `{value}`.
3. **`vendor/settings/page.tsx` vs `vendor/store/settings/page.tsx`** — two settings pages exist. The nav links to `vendor/store/settings` (the active one). `vendor/settings` is legacy but still accessible via `ROUTES.VENDOR_SETTINGS`. Should be consolidated eventually.

---

## Key Architecture Decisions Made This Session

### Why `use_own_delivery` was dropped
It was exactly `!use_pixelmart_service`. Having both would be redundant. Mode C (`use_pixelmart_service = false`) semantically means "vendor handles own delivery."

### Why `has_storage_plan` is stored (not computed)
Although it's derivable, it's stored because:
- Future billing gate needs to query it efficiently
- Phase 3 will allow `has_storage_plan` to be independently managed (vendor subscribes/unsubscribes)
- Current value is always auto-derived by mutations — never set manually by frontend

### Why product specs are flexible (not fixed fields)
`color`, `material`, `dimensions` were added as fixed schema fields initially, then replaced by a flexible `product_specs` table (key/value pairs with sort order). This matches real-world products better — a shoe has "Pointure", a phone has "RAM", a shirt has "Tissu".

### Convex `questions` vs `reviews` design difference
Reviews require a verified purchase (`order_id` mandatory). Questions do not — any authenticated user can ask. Vendor can also seed Q&A pairs directly (`source: "vendor"`).

---

## Files Changed on This Branch (vs main)

```
convex/
  _generated/api.d.ts          ← regenerated
  product_specs/
    mutations.ts                ← NEW
    queries.ts                  ← NEW
  products/
    mutations.ts                ← image_roles, seo_keywords added
    queries.ts                  ← owner_id + delivery fields in getBySlug store object
  questions/
    mutations.ts                ← NEW
    queries.ts                  ← NEW
  schema.ts                     ← product_specs, product_questions, image_roles,
                                   seo_keywords, store delivery fields, has_storage_plan
  stores/
    mutations.ts                ← updateDeliverySettings (3-mode), hasPendingOrders
    queries.ts                  ← hasPendingOrders

src/
  app/
    (storefront)/products/[slug]/page.tsx   ← specs table, Q&A section, dynamic delivery map
    (vendor)/vendor/
      settings/page.tsx                     ← delivery card (legacy, kept)
      store/settings/page.tsx               ← delivery card (3-mode radio), storageId fix
  components/
    maps/
      LocationPicker.tsx                    ← NEW (Leaflet + Nominatim)
    products/
      ProductForm.tsx                       ← imageRoles, specs tab, Q&R tab, seoKeywords
      ProductGallery.tsx                    ← imageRoles prop + badges
      ProductImageUpload.tsx                ← role selector, onChange(images, roles)
    questions/
      ProductQASection.tsx                  ← NEW
      VendorQAManager.tsx                   ← NEW
      index.ts                              ← NEW
  constants/
    imageRoles.ts                           ← NEW
    pickup.ts                               ← NEW (PIXELMART_WAREHOUSE constant)

next.config.ts                              ← unpkg.com added to image domains (Leaflet icons)
package.json / pnpm-lock.yaml               ← react-leaflet + leaflet + @types/leaflet added
```

---

## Git State

```
Branch:           feat/product-page
Ahead of main by: 8 commits
Remote:           origin/feat/product-page (pushed and up to date)
TypeScript:       clean (npx tsc --noEmit passes)
```

**To continue:**
```bash
cd /home/kurtdegla/pixelmart
git checkout feat/product-page
git pull origin main
git rebase main   # if main has new commits
pnpm install      # if package.json changed
```

**Next task:** Phase 2 item #6 — create `src/lib/storageFee.ts` with `calculateStorageFee(weightGrams?, stock)`.

---

## Important Project Context

- **Currency:** XOF — all DB amounts in centimes (100 centimes = 1 XOF). `formatPrice(centimes, "XOF")` handles display.
- **Convex:** All DB reads = queries, all writes = mutations. Never call external APIs inside mutations.
- **Commit scopes:** `auth, users, stores, products, orders, payments, transactions, payouts, reviews, coupons, messages, notifications, categories, dashboard, storefront, checkout, analytics, admin, ads, delivery`
- **Branch protection:** Direct pushes to `main` are blocked. Always PR → squash merge.
- **Leaflet in Next.js:** Must be imported dynamically (`import("leaflet")`) to avoid SSR crash. LocationPicker already handles this.
- **Vendor nav:** Links to `/vendor/store/settings` (NOT `/vendor/settings`). Always add vendor-facing features to `store/settings/page.tsx`.