# VocabVault — Agent Guide

## Quick Start
```bash
node --version         # must be 22 (CI matrix 22/24, Render pins 22; 25/26 untested)
npm ci                 # root only — root package-lock.json is canonical; never cd + install
cp server/.env.example server/.env   # set MONGODB_URI + JWT_SECRET; leave CLIENT_URL unset locally
npm run seed           # seeds Atlas; fails silently if .env bad or Atlas unreachable
npm run dev            # API :5000 + web :5173 (Vite proxies /api → :5000)
```
- `client/` + `server/` each carry a stale tracked `package-lock.json` (Aug installs) — ignore them, never install from them.
- No `client/.env` needed locally (dev proxy handles `/api`); only prod builds need `VITE_API_URL`.

## Verify (CI runs all of this on every PR — see `.github/workflows/ci.yml`)
```bash
npm test                        # vitest: pure-logic suites, colocated *.test.js (no DOM needed)
npm run lint -w client          # oxlint for JS (AuthContext + Search warnings pre-existing, ignore)
npm run lint:tw -w client       # eslint class hygiene: no contradictions, tokens over arbitrary values
npm run build -w client         # must pass before any PR (CI sets VITE_API_URL to prod API)
node --check server/src/<file>.js   # server has no linter; syntax-check touched files
npm audit --omit=dev --audit-level=high   # CI gate; dev-only findings don't count
```
- E2E: curl suites for API, Playwright (JS `@playwright/test`, python only for ad-hoc probes); committed gates are `e2e/design-contract.spec.js` + `e2e/study-flows.spec.js` via `npm run test:e2e` (dev servers running, QA account `qa@test.local`). Assert tight values (`+\d+ XP`, not `+.*XP` — loose regexes hide failures). E2E stays out of CI (needs Atlas).
- Restart `npm run dev` after any branch switch (`node --watch`/HMR serve stale code across checkouts); curl-verify endpoints before trusting results.
- Test auth: persistent QA account `qa@test.local` lives in shared Atlas — credentials via `VV_QA_EMAIL` + `VV_QA_PASSWORD` env vars (never committed). Log in, don't register throwaways. Delete any temp users/data you do create (shared M0, 512 MB).

## Workflow (branch protection: PR-only, self-merge OK)
- Branches: `feat|fix|docs|chore/<thing>`. Team practice: squash-merge with `--delete-branch`.
- Commits: conventional, lowercase subject ≤100 chars, body lines ≤100 chars (hook rejects; never `--no-verify`).
- `gh pr create` needs `--head <branch> --base main` when run from another branch.
- Update `TODO.md` check-offs and `docs/API_CONTRACT.md` in the same PR that changes behavior.

## Architecture
- `client/` React 19 + Vite 8 + Tailwind v4 (CSS-first, no tailwind.config) + Router 7. Never touches DB; JWT from localStorage via `api/client.js`.
- `server/` Express 5 + Mongoose, entry `src/server.js` (fail-fast on missing `JWT_SECRET` in prod; CORS fail-closed without `CLIENT_URL`). SRS in `utils/leitner.js`, gamification in `utils/gamify.js`.
- Seed lives at `server/src/scripts/seed.js`, expects `{ groups: [{ group, words: [{ word, definition, example? }] }] }` (`npm run seed -w server -- path/to.json`). No bulk-import endpoint exists — cut from scope, don't go looking for one.
- Design tokens (`text-primary`, `bg-accent`, `bg-gold`) in `client/src/index.css` — never raw hex; full voice/tactile/motion rubric in `docs/DESIGN_SYSTEM.md` (touch targets: 24px min, 44px aim).
- Word schema: `word` + `definition` required, rest optional.
