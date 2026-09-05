# VocabVault — Agent Guide

## Quick Start
```bash
npm install          # root workspaces install (client + server); never cd + install
cp server/.env.example server/.env   # MONGODB_URI + JWT_SECRET, not committed
npm run seed         # seeds Atlas; fails silently if .env bad or Atlas unreachable
npm run dev          # API :5000 + web :5173 (Vite proxies /api → :5000)
```

## Verify (no test runner exists — this is the whole suite)
```bash
npm run build -w client             # must pass before any PR
npm run lint -w client              # oxlint; AuthContext + Search warnings are pre-existing, ignore
node --check server/src/<file>.js   # server has no linter; syntax-check touched files
```
- E2E: curl suites for API, Playwright (python) for UI. Assert tight values (`+\d+ XP`, not `+.*XP` — loose regexes hide failures).
- Restart `npm run dev` after any branch switch (`node --watch`/HMR serve stale code across checkouts); curl-verify endpoints before trusting results.
- Test auth: persistent QA account `qa@test.local` / `password123` lives in shared Atlas — log in, don't register throwaways. Delete any temp users/data you do create (shared M0, 512 MB).

## Workflow (branch protection: PR-only, self-merge OK)
- Branches: `feat|fix|docs|chore/<thing>`. Team practice: squash-merge with `--delete-branch`.
- Commits: conventional, lowercase subject ≤100 chars, body lines ≤100 chars (hook rejects; never `--no-verify`).
- `gh pr create` needs `--head <branch> --base main` when run from another branch.
- Check repo-local `git config user.name/email` before committing — it may be set to a teammate.
- Update `TODO.md` check-offs and `docs/API_CONTRACT.md` in the same PR that changes behavior.

## Architecture
- `client/` React 19 + Vite 8 + Tailwind v4 (CSS-first, no tailwind.config) + Router 7. Never touches DB; JWT from localStorage via `api/client.js`.
- `server/` Express 5 + Mongoose, entry `src/server.js`. SRS in `utils/leitner.js`, gamification in `utils/gamify.js`.
- Design tokens (`text-primary`, `bg-accent`, `bg-gold`) in `client/src/index.css` — never raw hex; see README Design System (incl. touch-target rule).
- Word schema: `word` + `definition` required, rest optional.
