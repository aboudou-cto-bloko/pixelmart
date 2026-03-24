---
description: Fix a bug or implement from issue description
allowed-tools: [Read, Write, Grep, Glob, Bash]
---

Fix the issue described: $ARGUMENTS

## Process

1. **Understand the Issue**
   - What is the expected behavior?
   - What is the current behavior?
   - What are the reproduction steps?

2. **Locate the Problem**
   - Search the codebase for relevant files
   - Identify the root cause

3. **Implement the Fix**
   - Make minimal, focused changes
   - Follow Pixel-Mart coding standards
   - Add/update tests if applicable

4. **Verify**
   - TypeScript compiles without errors
   - Existing tests still pass
   - The issue is resolved

## Output

1. **Root Cause**: Brief explanation
2. **Files Changed**: List with descriptions
3. **Code Changes**: Full diff-style output
4. **Commit Message**: Following convention

```
fix(scope): brief description

Fixes: #issue_number (if applicable)
```

5. **Testing Notes**: How to verify the fix
