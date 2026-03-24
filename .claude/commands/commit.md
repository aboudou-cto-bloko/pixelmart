---
description: Generate a conventional commit message for staged changes
allowed-tools: [Bash, Read]
---

## Context

- Current status: !`git status`
- Current diff: !`git diff --staged`
- Current branch: !`git branch --show-current`

## Commit Convention

```
type(scope): description

[optional body - WHY not WHAT]
```

### Types
| Type | When |
|------|------|
| feat | New user-facing feature |
| fix | Bug fix |
| refactor | Code restructuring, no behavior change |
| ui | UI/styling changes |
| schema | Database schema changes |
| api | API route changes |
| config | Configuration, env, dependencies |
| docs | Documentation |
| test | Tests |
| chore | Maintenance, tooling |
| perf | Performance improvements |

### Scopes
```
auth, users, stores, products, orders, payments, transactions,
payouts, reviews, coupons, messages, notifications, categories,
dashboard, storefront, checkout, analytics, admin, ads, delivery
```

## Generate

Based on the staged changes above, generate the appropriate commit message.

Output format:
```
git commit -m "type(scope): description"
```

Or for multi-line:
```
git commit -m "type(scope): description

Body explaining why this change was made."
```
