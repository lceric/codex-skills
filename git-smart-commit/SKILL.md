---
name: git-smart-commit
description: Generate and optionally apply Conventional Commits messages from current git changes. Use when Codex needs to inspect staged or pending diffs, classify commit type (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert), enforce commit formatting rules, add a suitable scope, and ensure no AI attribution appears in commit content.
---

# Git Smart Commit

## Use This Workflow

1. Inspect change state with `git status --porcelain=v1`.
2. Prefer staged changes for commit generation.
3. If no staged changes exist, decide whether to stage all with `git add -A`.
4. Generate a Conventional Commits header: `type(scope): subject`.
5. Keep subject concise, imperative, and without trailing punctuation.
6. Never include AI signatures or attribution text.
7. Apply commit only after message looks correct.

## Commit Rules

- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Header format: `type(scope): subject` or `type: subject`.
- Scope is optional and should be short (module or directory name).
- Subject should be lower case when possible and stay within 72 characters.
- Do not add prefixes like `AI`, `Co-Authored-By`, or model names unless user explicitly requests.

## Script

Run the helper script in `scripts/generate-commit.cjs`.

```bash
node .codex/skills/git-smart-commit/scripts/generate-commit.cjs
```

Useful options:

- `--apply`: run `git commit` with the generated message.
- `--stage-all`: run `git add -A` if no staged changes are found.
- `--type <type>`: force a specific commit type.
- `--scope <scope>`: force scope.
- `--subject "<text>"`: force subject.
- `--body "<text>"`: add commit body paragraph.
- `--print-json`: print machine-readable result.
- `--no-icon`: disable icon in console preview output.

## Examples

```bash
# Preview message from current staged changes
node .codex/skills/git-smart-commit/scripts/generate-commit.cjs

# Stage all pending changes, generate, and commit
node .codex/skills/git-smart-commit/scripts/generate-commit.cjs --stage-all --apply

# Force type and scope while still auto-generating the subject
node .codex/skills/git-smart-commit/scripts/generate-commit.cjs --type docs --scope readme
```
