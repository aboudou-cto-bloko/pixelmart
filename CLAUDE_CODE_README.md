# Claude Code Setup for Pixel-Mart

## Installation

```bash
# Option 1: Native installer (recommended - auto-updates)
curl -fsSL https://code.claude.com/install.sh | sh

# Option 2: Homebrew (macOS)
brew install claude-code

# Option 3: npm (legacy)
npm install -g @anthropic-ai/claude-code
```

## Authentication

```bash
# Login with your Claude Pro/Max subscription
claude auth login

# OR set API key (pay-as-you-go)
export ANTHROPIC_API_KEY="your-api-key"
```

## Usage

### Start a session

```bash
cd pixelmart
claude
```

### Resume last conversation

```bash
claude -c
```

### One-shot command

```bash
claude -p "explain the order status machine"
```

## Custom Commands

| Command | Description |
|---------|-------------|
| `/review <file>` | Code review against Pixel-Mart standards |
| `/fix-issue <description>` | Fix a bug from description |
| `/new-feature <name>` | Scaffold a new feature |
| `/add-component <name>` | Create a component (Atomic Design) |
| `/commit` | Generate conventional commit message |

### Examples

```
/review convex/orders/mutations.ts
/fix-issue checkout double submit on slow networks
/new-feature vendor analytics dashboard
/add-component OrderStatusBadge
/commit
```

## Skills (Auto-Activated)

| Skill | Triggers |
|-------|----------|
| `convex-patterns` | Working in `convex/` directory, backend code |
| `atomic-components` | Creating UI components, React code |
| `business-rules` | Orders, payments, commissions, balances |
| `git-workflow` | Commits, branches, PR, CI/CD |
| `testing-patterns` | Tests, Vitest, Playwright |
| `email-templates` | Emails, notifications, react-email |
| `moneroo-integration` | Payments, Mobile Money, webhooks |
| `delivery-system` | Delivery, geocoding, Nominatim, distance |
| `ads-system` | Ad spaces, bookings, promotions |

## Configuration Files

```
pixelmart/
├── CLAUDE.md              # Project context (always loaded)
├── .claudeignore          # Files excluded from context
└── .claude/
    ├── settings.json      # Shared settings (committed)
    ├── settings.local.json # Personal settings (gitignored)
    ├── commands/          # Custom slash commands
    │   ├── review.md          # /review <file>
    │   ├── fix-issue.md       # /fix-issue <description>
    │   ├── new-feature.md     # /new-feature <name>
    │   ├── add-component.md   # /add-component <name>
    │   └── commit.md          # /commit
    └── skills/            # Auto-triggered expertise
        ├── convex-patterns/       # Convex backend patterns
        ├── atomic-components/     # React Atomic Design
        ├── business-rules/        # Financial & order rules
        ├── git-workflow/          # Git + CI/CD workflow
        ├── testing-patterns/      # Vitest + Playwright
        ├── email-templates/       # react-email + Resend
        ├── moneroo-integration/   # Mobile Money payments
        ├── delivery-system/       # Geocoding + delivery fees
        └── ads-system/            # Ad spaces & bookings
```

## Tips

### Reference files with @

```
> Explain @convex/schema.ts
> Review @src/components/organisms/ProductGrid.tsx
```

### Run shell commands with !

```
> Check the current git status
!git status
```

### Multi-file operations

```
> Update all product components to use the new CurrencyDisplay atom
```

### Ask for explanations

```
> How does the balance release cron work?
> Explain the order status transitions
```

## Git Workflow (Enforced)

### Branch Rules
- ❌ Direct pushes to `main` are **BLOCKED**
- ✅ Always: `feat/xxx` branch → PR → squash merge
- ✅ PR title validated (conventional commit format)

### Quick Reference

```bash
# Start feature
git checkout main && git pull
git checkout -b feat/feature-name

# Commit (commitlint validates format)
git commit -m "feat(scope): description"

# Before PR
git checkout main && git pull
git checkout feat/feature-name
git rebase main
git push origin feat/feature-name --force-with-lease

# Create PR on GitHub → Squash merge → Delete branch
```

### CI Checks (All Must Pass)
1. `pnpm lint` — ESLint
2. `pnpm format:check` — Prettier  
3. `pnpm typecheck` — TypeScript
4. `pnpm test` — Vitest
5. `pnpm build` — Next.js build

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Stop Claude mid-response |
| `Escape` × 2 | Show message history |
| `Ctrl+V` | Paste image from clipboard |
| `Tab` | Accept suggestion |

## Troubleshooting

### Claude doesn't see my files

Check `.claudeignore` isn't excluding them:

```bash
cat .claudeignore
```

### Skills not triggering

List available skills:

```
/skills
```

### Session issues

```
/debug
```

### Check version

```bash
claude --version
```

### Update Claude Code

```bash
# Native install (auto-updates)
# Just restart to get updates

# Homebrew
brew upgrade claude-code

# npm
npm update -g @anthropic-ai/claude-code
```
