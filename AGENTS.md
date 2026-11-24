# VocabVault — Agent Guide

## Quick Start
```bash
node -v                 # 22 or 24 (CI: PRs run 22, main pushes run 22+24; Render pins 22)
npm ci                  # root only — root package-lock.json is canonical
cp server/.env.example server/.env   # set JWT_SECRET + MONGODB_URI; CLIENT_URL unset locally
npm run dev             # API :5000 + web :5173 (Vite proxies /api → :5000)
npm run seed            # upsert bundled GregMat dataset; exits 1 without MONGODB_URI; --prune dry-runs until --yes; --force-partial allows partial files; writes to whatever MONGODB_URI points at
```
- Only the root `package-lock.json` is tracked (the workspace copies were removed in #109). Never commit `client/` or `server/` lockfiles; `npm ci` runs at the root only.
- No `client/.env` needed locally; only prod builds need `VITE_API_URL`.
- `.env.example` has no `SMTP_*` keys: outside production a reset request logs only "link withheld" unless `DEV_RESET_LINK=true`; in production a missing transport logs one line without the token and sends nothing. `nodemailer` is an optional dynamic import, not a dependency.

## Verify (CI runs these; `.github/workflows/ci.yml`)
```bash
npm test                    # vitest, pure logic, colocated *.test.js
npx vitest run server/src/utils/leitner.test.js    # one suite (local example, not CI)
npm run lint -w client      # oxlint; pre-existing warnings are fine, errors are not
npm run lint:tw -w client   # eslint class hygiene; zero warnings allowed (`--max-warnings 0`)
npm run build -w client     # CI injects prod VITE_API_URL
npm run docs:check          # docs vs routers, tokens, env, links, CSP hash, npm scripts
find server/src -name '*.js' -not -name '*.test.js' -exec node --check {} +
npm audit --omit=dev --audit-level=high
```
- CI also secret-scans the tree (ripgrep for committed credentials).
- PRs always run Node 22; pushes to `main` also run 24. Docs-only pushes skip CI, but docs-only PRs still run it — branch protection requires the check.

## E2E (local only — needs dev servers + Atlas + QA creds)
Run the smallest thing that can fail. The full suite is a per-PR gate, not a step after every edit.
- Cheapest first: `npm test` (~3s, pure logic) and `npm run build -w client` catch most regressions. Reach for a browser only for what a browser alone proves.
- Targeted, by area: `npm run test:e2e:study` (card, HUD, keyboard, part strip), `npm run test:e2e:design` (nav, tokens, tap targets, motion — chromium + mobile), `npm run test:e2e:auth` (login/register/forgot-password forms, password meter, settings + danger-zone modals). Each is ~40–60s.
- Full: `npm run test:e2e` — before requesting review, not after every edit.
- One case: `npx playwright test --project=chromium -g "keyboard answers"`.
- Pure look checks (a radius, a breakpoint, spacing) → a throwaway Playwright screenshot script; assert pixels, not accessible names. The suite proves behavior, not appearance.
- `e2e/auth.setup.js` logs in once with `VV_QA_EMAIL` / `VV_QA_PASSWORD` and caches state in `.playwright/.auth/user.json` (gitignored).
- Specs: `design-contract`, `study-flows`, `daily-study`, `history-audit`, `auth-lifecycle`. `chromium` + `mobile` (Pixel 7, design-contract only) projects.
- Chromium is auto-detected (Linux: `/usr/bin/chromium`); override with `PLAYWRIGHT_CHROMIUM_PATH`. Zero page errors expected. Assert tight values (`+\d+ XP`, never `+.*XP`).
- Restart `npm run dev` after any branch switch — `node --watch` / HMR serves stale code across checkouts.
- Rate limits are production-only (`middleware/rateLimit.js`), so reruns never need a restart to clear a 429. A full run still drains the QA account's due cards — use `/practice/due` for study screenshots.

## Architecture
- `client/` React 19 + Vite 8 + Tailwind v4 (CSS-first, no tailwind.config) + Router 7. All pages are `React.lazy()`; vendor chunks split in `client/vite.config.js`. Never touches the DB; JWT from localStorage via `api/client.js`.
- Motion: `motion` v14 is the only animation dependency. Import `m`, `useReducedMotion`, and `MotionProvider` from `client/src/lib/motion.jsx`; never `motion` directly (`LazyMotion` runs in `strict` mode). Policy in `docs/DESIGN_SYSTEM.md` § Motion.
- `server/` Express 5 + Mongoose, entry `src/server.js`. Routers: auth, decks, words, progress, gamification, bookmarks, lists, quiz (history), admin. SRS `utils/leitner.js`, gamification `utils/gamify.js`, history/quiz aggregation `utils/history.js` + `utils/quizHistory.js`.
- `/api/health` is mounted **before** `apiLimiter` on purpose — warming pings, deploy-gate, and monitors must not be throttled.
- Auth: JWT HS256 with issuer/audience + `tokenVersion`; revocation bumps `User.tokenVersion` and invalidates old tokens (`middleware/auth.js`); passwords need 8+ characters and at most 72 UTF-8 bytes (`MIN_PASSWORD_LENGTH` / `MAX_PASSWORD_BYTES` in `utils/security.js`) on register, reset, and change — not on login.
- Seed: `server/src/scripts/seed.js`, expects `{ groups: [{ group, words: [{ word, definition, example? }] }] }` (`npm run seed -w server -- path.json`). No bulk-import endpoint exists — cut from scope.
- Backend warming is an **external cron** hitting `/api/health` (`docs/DEPLOY.md` §6.1: 5–10 min, mind the 750 instance-hour cap). No GitHub keepalive workflow — `schedule` gets delayed past the 15-min idle window.

## Workflow (branch protection: PR-only, self-merge OK)
- Branches: `feat|fix|docs|chore/<thing>`. Team practice: squash-merge with `--delete-branch`.
- Commits: conventional, lowercase subject ≤100 chars, body lines ≤100 chars (hook rejects; never `--no-verify`).
- `gh pr create` needs `--head <branch> --base main` when run from another branch.
- Update `TODO.md` check-offs and `docs/API_CONTRACT.md` in the same PR that changes behavior.
- Formatting is `.editorconfig` only — 2-space indent, LF, final newline, no formatter in the repo. Markdown keeps trailing whitespace because hard breaks are deliberate.

## Reference
- `docs/API_CONTRACT.md` — exact request/response shapes; check before any endpoint work.
- `docs/DESIGN_SYSTEM.md` — tokens (`text-primary`, `bg-accent`, `bg-gold`) live in `client/src/index.css`; never raw hex. Touch targets: 24px min, 44px aim.
- `docs/TEST_MATRIX.md` — manual QA flows; `docs/DEPLOY.md` — Render/Pages/Atlas deploy + warm-up.
- Word schema: `word` + `definition` required, rest optional.
