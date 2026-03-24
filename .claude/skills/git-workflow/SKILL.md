---
name: git-workflow
description: |
  Use when working with Git operations, commits, branches, PRs, or CI/CD in Pixel-Mart.
  Triggers on: git commands, commit messages, branch creation, PR workflow, CI failures,
  merge conflicts, or deployment questions. Enforces trunk-based development and 
  conventional commits with commitlint.
allowed-tools: [Bash, Read, Write]
---

# Git Workflow for Pixel-Mart

## Branch Strategy (Trunk-Based)

```
main                    ← production (auto-deploys)
  └── feat/xxx          ← features (max 3 days)
  └── fix/xxx           ← bug fixes
  └── hotfix/xxx        ← emergency fixes
  └── schema/xxx        ← schema changes
  └── ui/xxx            ← UI only changes
  └── refactor/xxx      ← refactoring
```

## Branch Protection (ENFORCED)

- ❌ Direct pushes to `main` are **BLOCKED**
- ✅ Must create PR
- ✅ Must pass CI checks
- ✅ Must have valid PR title (conventional commit format)
- ✅ Squash merge only

## Commit Message Format (commitlint)

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | When | Example |
|------|------|---------|
| `feat` | New feature | `feat(products): add image gallery` |
| `fix` | Bug fix | `fix(checkout): prevent double submit` |
| `refactor` | Code change, no behavior change | `refactor(orders): extract status machine` |
| `ui` | UI/styling only | `ui(dashboard): add loading skeletons` |
| `schema` | Database schema | `schema(orders): add delivery_distance_km` |
| `api` | API routes | `api(webhooks): add Moneroo signature verification` |
| `config` | Config, deps | `config: upgrade to Next.js 14.2` |
| `docs` | Documentation | `docs: update API documentation` |
| `test` | Tests | `test(orders): add status transition tests` |
| `chore` | Maintenance | `chore: clean up unused imports` |
| `perf` | Performance | `perf(products): add database index` |

### Scopes

```
auth, users, stores, products, orders, payments, transactions,
payouts, reviews, coupons, messages, notifications, categories,
dashboard, storefront, checkout, analytics, admin, ads, delivery
```

### Examples

```bash
# Feature
feat(checkout): add delivery fee calculator with distance tiers

# Fix with body
fix(payments): handle Moneroo webhook timeout

Increase timeout to 30s and add retry logic for transient failures.

# Breaking change
feat(orders)!: change status field from string to enum

BREAKING CHANGE: Order status is now a strict enum type.
Migration required for existing orders.

# Multi-scope
feat(checkout,delivery): integrate address autocomplete with fee calculation
```

## Workflow Commands

### Start New Feature

```bash
git checkout main
git pull origin main
git checkout -b feat/feature-name
```

### Commit Changes

```bash
git add .
git commit -m "feat(scope): description"

# If commitlint fails, fix the message format
# Common errors:
# - Missing type: "add feature" → "feat(scope): add feature"
# - Wrong type: "feature(scope):" → "feat(scope):"
# - Missing scope for non-chore: "feat: add" → "feat(scope): add"
```

### Push and Create PR

```bash
git push origin feat/feature-name
# GitHub will show "Create Pull Request" link
```

### Rebase Before PR

```bash
git checkout main
git pull origin main
git checkout feat/feature-name
git rebase main

# If conflicts:
# 1. Fix conflicts in files
# 2. git add .
# 3. git rebase --continue

git push origin feat/feature-name --force-with-lease
```

### After PR Merged

```bash
git checkout main
git pull origin main
git branch -d feat/feature-name  # Delete local branch
```

## CI Pipeline (GitHub Actions)

Runs on every PR to `main`:

```yaml
jobs:
  quality:
    steps:
      - pnpm lint          # ESLint
      - pnpm format:check  # Prettier
      - pnpm typecheck     # TypeScript
      - pnpm test          # Vitest
      - pnpm build         # Next.js build
```

### CI Failure Fixes

| Error | Fix |
|-------|-----|
| ESLint error | `pnpm lint:fix` |
| Prettier error | `pnpm format` |
| TypeScript error | Fix type errors, no `any` |
| Test failure | Fix failing tests |
| Build failure | Check for missing imports, env vars |

## Pre-commit Hooks (Husky)

Automatically runs:
1. **commitlint** — Validates commit message
2. **lint-staged** — ESLint + Prettier on staged files

### Bypass (Emergency Only)

```bash
git commit -m "fix(critical): emergency fix" --no-verify
```

⚠️ Use sparingly — CI will still enforce checks on PR.

## Hotfix Flow

```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-name

# Fix the bug
git add .
git commit -m "fix(scope): critical bug description"
git push origin hotfix/critical-bug-name

# Create PR with "urgent" label
# Request immediate review
# Squash merge after approval
```
