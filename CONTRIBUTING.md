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
2. **No approvals required** — the PR author merges their own PR once CI looks good.
3. Reviews are *encouraged, not required* — ask a teammate to look over bigger
   changes; it's free learning and great evidence of collaboration for evaluation.
4. New commits to an open PR are always allowed.
5. Merge methods allowed: merge commit or squash.

> Direct pushes to `main` are blocked — everything goes through a PR,
> even one-person doc changes. This keeps `main` history clean and reviewable.


## Code Style

- JavaScript (ESM), no build-step types.
- Run your feature through both apps (`npm run dev`) before opening a PR.
