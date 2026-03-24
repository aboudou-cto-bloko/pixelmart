---
description: Review code for Pixel-Mart standards compliance
allowed-tools: [Read, Grep, Glob]
---

Review the code at $ARGUMENTS for compliance with Pixel-Mart standards:

## Check List

### TypeScript
- [ ] No `any` types — use `unknown` + type guards
- [ ] Types derived from Convex schema where applicable
- [ ] Strict null checks handled

### Convex Backend (if applicable)
- [ ] No external API calls in mutations
- [ ] No `ctx.db` in httpAction
- [ ] Transaction logging for balance changes
- [ ] Proper validation with `v.object()` validators
- [ ] Indexes used in queries

### React Components (if applicable)
- [ ] Correct Atomic Design layer (atom/molecule/organism/template)
- [ ] "use client" only when necessary
- [ ] Loading and error states handled
- [ ] No inline styles — Tailwind only
- [ ] shadcn/ui components used where available

### Business Rules
- [ ] Monetary values in centimes
- [ ] Order status transitions validated
- [ ] Commission calculations correct

### Clean Code
- [ ] Single responsibility per function
- [ ] Meaningful naming
- [ ] No magic numbers/strings
- [ ] No code duplication

## Output Format

For each issue found:
1. **Location**: File path and line number
2. **Issue**: What's wrong
3. **Fix**: Code snippet with the fix
4. **Severity**: 🔴 Critical / 🟡 Warning / 🟢 Suggestion
