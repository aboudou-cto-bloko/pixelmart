---
description: Scaffold a new feature following Pixel-Mart architecture
allowed-tools: [Read, Write, Grep, Glob, Bash]
---

Create a new feature: $ARGUMENTS

## Process

### 1. Scope Analysis
- What domain does this belong to? (products, orders, payments, etc.)
- Is this Phase 0 or Phase 1 scope? (reject if Phase 2+)
- What existing code can be reused?

### 2. Backend (if needed)

```
convex/[domain]/
├── queries.ts      # Add new query functions
├── mutations.ts    # Add new mutation functions
└── helpers.ts      # Add helper utilities
```

- Define validators with `v.object()`
- Add indexes if new queries needed
- Follow transaction logging rules for financial operations

### 3. Frontend

Determine component level:
- **Atom**: Basic building block (no business logic)
- **Molecule**: Combined atoms (minimal state)
- **Organism**: Feature section (can fetch data)
- **Template**: Page layout

```
src/components/[level]/[ComponentName].tsx
```

### 4. Page (if needed)

```
src/app/(group)/[route]/page.tsx
```

- Server Component by default
- Add loading.tsx and error.tsx

### 5. Types

```typescript
// src/types/[domain].ts or derive from Convex
import { Doc } from "@convex/_generated/dataModel";
type NewType = Doc<"table">["field"];
```

## Output

1. **Files to Create**: Full list with paths
2. **Schema Changes**: If any (for schema.ts)
3. **Code**: Complete, copy-paste ready code for each file
4. **Commit Message**: 

```
feat(scope): brief description
```

5. **Next Steps**: What to do after scaffolding
