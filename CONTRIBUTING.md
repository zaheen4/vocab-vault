# Contributing to VocabVault

## Branching

- `main` is protected — **no direct pushes**, no force pushes, no deletions.
- All work happens on feature branches merged via Pull Request:

```
feat/<thing>     new features          feat/flashcard-swipe
fix/<thing>      bug fixes             fix/login-redirect
docs/<thing>     documentation         docs/api-readme
chore/<thing>    tooling, config       chore/tailwind-theme
```

## Commit Messages (enforced by commitlint hook)

Format: `type: short imperative summary` — max 100 chars.

| Type | Use for |
|------|---------|
| `feat` | new feature |
| `fix` | bug fix |
| `docs` | documentation only |
| `style` | formatting, no logic change |
| `refactor` | restructure without behavior change |
| `perf` | performance improvement |
| `test` | adding/fixing tests |
| `build` / `ci` | build system or pipeline changes |
| `chore` | everything else |
| `revert` | reverting a previous commit |

Examples:
```
feat: add Leitner-box review scheduler
fix: prevent duplicate bookmark entries
docs: document bulk import API
```

The `commit-msg` hook installs automatically via `npm install`
(husky). If a commit is rejected, rephrase it — don't bypass with
`--no-verify`.

## Pull Requests

1. Push your branch and open a PR against `main`.
2. At least **1 teammate approval** is required to merge.
3. New commits to the branch dismiss stale approvals — re-review before merging.
4. Merge methods allowed: merge commit or squash.

## Code Style

- JavaScript (ESM), no build-step types.
- Run your feature through both apps (`npm run dev`) before opening a PR.
