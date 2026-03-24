---
description: Create a new React component following Atomic Design
allowed-tools: [Read, Write, Grep, Glob, Bash]
---

Create a new component: $ARGUMENTS

## Classification Guide

### Atom (src/components/atoms/)
Use if:
- Single HTML element wrapper
- No state management
- No data fetching
- Pure presentation

Examples: `StatusBadge`, `CurrencyDisplay`, `StarRating`, `Avatar`, `Spinner`

### Molecule (src/components/molecules/)
Use if:
- Combines 2-4 atoms
- Minimal local state (hover, toggle)
- No direct data fetching
- Receives all data via props

Examples: `ProductCard`, `CartItem`, `SearchBar`, `ReviewCard`, `NotificationItem`

### Organism (src/components/organisms/)
Use if:
- Feature-complete section
- Can fetch data (useQuery)
- Complex state management
- Contains molecules and atoms

Examples: `ProductGrid`, `OrderTimeline`, `CheckoutForm`, `VendorSidebar`

### Template (src/components/templates/)
Use if:
- Page layout structure
- Defines content slots
- Handles responsive layout
- No business logic

Examples: `DashboardTemplate`, `StorefrontTemplate`, `AuthTemplate`

## Output

```typescript
// filepath: src/components/[level]/[ComponentName].tsx

// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Export
```

Include:
- TypeScript interface for props
- "use client" only if needed
- Loading skeleton (for organisms)
- Error handling (for organisms)
- Tailwind styling (no CSS)
- Proper accessibility (aria-labels, roles)
