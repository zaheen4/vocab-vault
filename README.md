# VocabVault

GRE vocabulary flashcards with Leitner spaced repetition — flashcard practice,
multiple-choice quizzes, and typing drills in the browser.

Course project for CSE 4113 (Internet Programming Lab).

- **Web:** https://vvault.pages.dev
- **API:** https://vocab-vault-api.onrender.com/api

The API runs on Render's free tier, so the first request after ~15 idle minutes
takes about 30 seconds while the instance wakes. Everything after that is fast.

## Stack

| Layer    | Technology                                              |
|----------|---------------------------------------------------------|
| Frontend | React 19 · Vite 8 · Tailwind CSS v4 · React Router 7    |
| Backend  | Node.js 22 / 24 · Express 5 · Mongoose                  |
| Database | MongoDB Atlas (free M0 cluster)                         |
| Auth     | JWT HS256 with issuer/audience + `tokenVersion`, bcrypt |
| Tests    | Vitest (unit logic) · Playwright (browser)              |

## Features

- **Study:** flashcards, MCQ quiz over studied words only, typing with a
  length-scaled edit tolerance; keyboard answers; per-deck parts; reverse cards.
- **SRS:** Leitner boxes 1–5 at 1/2/4/8/16-day intervals; a due queue across
  every deck; weak-word remediation.
- **Progress:** XP, levels, streaks, badges, daily goal, weekly activity
  heatmap, per-word box history, chronological review feed, and quiz session
  history with question-by-question audits.
- **Words:** search 1,110 seeded GRE words, add your own, bookmark, and group
  them into custom lists.
- **Account:** register and log in, optional 30-day session, password reset,
  change password, revoke all sessions, reset progress, delete account.
- **UI:** light/dark/system themes applied before first paint, reduced-motion
  support, mobile tab bar, installable PWA, pre-rendered pronunciation audio
  with Web Speech fallback.

## Repository layout

```
client/   React SPA — Vite dev server on :5173, proxies /api → :5000
server/   Express API on :5000
e2e/      Playwright specs (local only, not part of CI)
docs/     API contract, design system, deploy runbook, manual test matrix
scripts/  Pronunciation audio generation
```

## Getting started

Requires Node.js 22 or 24, Git, and a MongoDB connection string (Atlas free
tier or a local server).

```bash
git clone https://github.com/zaheen4/vocab-vault.git
cd vocab-vault
npm ci                                  # root only; workspaces cover client + server
cp server/.env.example server/.env      # set JWT_SECRET and MONGODB_URI
npm run dev                             # API :5000 + web :5173
```

Load the dataset once. It reads `server/data/gregmat-words.json` (37 GregMat
groups, 1,110 words) and creates one deck per group:

```bash
npm run seed
```

The dev server forwards `/api` to port 5000, so the client needs no
`VITE_API_URL` locally; production builds take it from the Pages environment.

### Environment

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Connection string |
| `JWT_SECRET` | yes | The API throws at boot when `NODE_ENV=production` and this is unset |
| `PORT` | no | Defaults to `5000` |
| `CLIENT_URL` | production | Comma-separated allowed origins; CORS is open when unset |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `SMTP_FROM` | no | Password-reset mail. Without them, reset links are written to the API console outside production, and `POST /api/auth/forgot-password` returns `devResetUrl` |

## Checks

```bash
npm test                        # Vitest, pure logic (no network, no database)
npm run lint -w client          # oxlint
npm run lint:tw -w client       # eslint, Tailwind class hygiene, zero warnings
npm run build -w client         # production build
find server/src -name '*.js' -not -name '*.test.js' -exec node --check {} +
```

Browser tests run locally against a live API and the seeded database:

```bash
npm run test:e2e                # every spec, ~2.5 min
npm run test:e2e:study          # cards, HUD, keyboard, deck parts
npm run test:e2e:design         # nav, tokens, tap targets, motion
npm run test:e2e:auth           # signup → password reset → session revocation
```

They log in once with `VV_QA_EMAIL` / `VV_QA_PASSWORD`, cache the session in
`.playwright/.auth/user.json`, and expect Chromium at `/usr/bin/chromium`
(override with `PLAYWRIGHT_CHROMIUM_PATH`). A full run consumes the QA
account's due cards.

CI (`.github/workflows/ci.yml`) runs lint, unit tests, and the production build
on every pull request with Node 22, and again on Node 24 for pushes to `main`.
Playwright is deliberately not in CI.

## API

Send `Authorization: Bearer <token>`. Errors are `{ "message": "..." }`. Request
and response shapes are in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md), which
is authoritative; the table below is an index of what exists.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | Liveness, database state, uptime, deploy SHA. Mounted before the rate limiter |
| POST | `/api/auth/register` | Create an account, returns a JWT |
| POST | `/api/auth/login` | Returns a JWT; `rememberMe` extends it to 30 days |
| POST | `/api/auth/logout` | Ends the session (the client also discards the token) |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/profile` | Rename the account |
| PATCH | `/api/auth/password` | Change password; bumps `tokenVersion` and returns a fresh JWT |
| POST | `/api/auth/forgot-password` | Issues a 15-minute reset link |
| POST | `/api/auth/reset-password` | Consumes the reset token |
| POST | `/api/auth/revoke-all` | Invalidates every issued token |
| POST | `/api/auth/reset-progress` | Clears SRS boxes and quiz history, keeps the account |
| DELETE | `/api/auth/account` | Deletes the account with its progress, quiz sessions, bookmarks, and lists |
| GET | `/api/decks` | Decks with word counts, progress, and due counts |
| GET | `/api/decks/:id` | One deck |
| GET | `/api/decks/:id/practice` | Practice queue in due order |
| GET | `/api/decks/:id/quiz` | Studied words available for a quiz |
| GET | `/api/decks/all/quiz` | Quiz pool across all decks |
| GET | `/api/words` | Search and list words (`q`, paginated) |
| GET | `/api/words/:id` | One word |
| POST | `/api/words` | Add your own word (409 on duplicate) |
| GET | `/api/progress/summary` | Mastery counts, zero-filled |
| GET | `/api/progress/word/:wordId` | SRS state and review history for one word |
| GET | `/api/progress/due` | Due queue across decks |
| GET | `/api/progress/weak` | Words with the most misses |
| GET | `/api/progress/history` | Chronological review feed |
| POST | `/api/progress/review` | Record an answer; updates SRS and gamification |
| GET | `/api/gamification/me` | XP, level, streak, badges, activity |
| PATCH | `/api/gamification/goal` | Set the daily review target |
| GET | `/api/bookmarks` | Saved words with SRS status |
| POST | `/api/bookmarks` | Star a word (idempotent) |
| DELETE | `/api/bookmarks/:wordId` | Unstar a word (idempotent) |
| GET | `/api/bookmarks/practice` | Practice session from saved words |
| GET | `/api/lists` | My custom lists |
| POST | `/api/lists` | Create a list |
| GET | `/api/lists/:id` | One list with its words |
| PATCH | `/api/lists/:id` | Rename a list |
| DELETE | `/api/lists/:id` | Delete a list |
| POST | `/api/lists/:id/words` | Add a word (`$addToSet`) |
| DELETE | `/api/lists/:id/words/:wordId` | Remove a word |
| POST | `/api/quiz/session` | Save a finished quiz session |
| GET | `/api/quiz/history` | Session list |
| GET | `/api/quiz/history/:id` | One session with its question audits |
| GET | `/api/admin/ping` | Admin-role health check |

Rate limits apply in production only (`server/src/middleware/rateLimit.js`), so
local runs and browser tests are never throttled. There is no bulk-import
endpoint; words enter through the seed script or `POST /api/words`.

## Seeding custom wordlists

The seed script accepts any JSON file in the same shape, which is how a
different dataset would be loaded:

```bash
npm run seed -w server -- path/to/wordlist.json
```

```json
{ "groups": [{ "group": "1", "words": [{ "word": "abate", "definition": "…", "example": "…" }] }] }
```

`word` and `definition` are required; `example` is optional. Seeding is
idempotent per group.

## Pronunciation audio

Every word ships with a pre-rendered Kokoro clip (`af_heart`) so all browsers
and devices hear the same voice instead of the OS speech engine. Clips live in
`client/public/audio/words/`, mapped by `client/public/audio/manifest.json`; the
client falls back to the Web Speech API only when a clip is missing.

```bash
npm run audio:generate             # all words, existing files skipped
npm run audio:generate -- --group 1
npm run audio:generate -- --only quixotic,compound
npm run audio:generate -- --force  # rebuild everything
```

Needs Python with `kokoro` and `soundfile`, plus `ffmpeg` on `PATH`. Words that
Kokoro stresses against the definition's sense (`compound`) are corrected in
`scripts/audio-overrides.json`.

## Design tokens

Semantic tokens are defined once in `client/src/index.css` and resolve through
`:root` and `.dark`, so a component uses the same utility in both themes:

| Token | Light | Dark | Role |
|---|---|---|---|
| `canvas` | `#E9E6DE` | `#0E1326` | Page shell |
| `card` | `#FBF8EF` | `#171D36` | Cards and sheets |
| `raised` | `#F3EDDD` | `#222A4A` | Nested surfaces, disabled fills |
| `line` | `#D8CDB8` | `rgba(255,255,255,.16)` | Dividers, decorative borders |
| `line-strong` | `#8A7B63` | `#767E9C` | Form-control borders |
| `ink` | `#1F2A44` | `#F4EEDF` | Headings, primary text |
| `ink-muted` | `#5B6478` | `#C9C2AD` | Secondary text |
| `accent-ink` | `#9A4A12` | `#F0A05E` | Links, small accent text |
| `stamp` | `#A63D2F` | `#F08A7A` | Errors, due indicators |
| `sage` | `#2F6B4F` | `#7FD1A4` | Success, mastered |
| `brass` | `#8A6414` | `#E0B85C` | XP, streak, badges |

Static brand fills (`primary`, `accent`, `accent-deep`, `gold`, `night-*`,
`cream-*`, `manila`, `stamp-wash`) and the type scale are documented in
[`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md), along with the motion policy
and component rules. Use token classes — never raw hex in components.

## Deploy

Render hosts the API and Cloudflare Pages hosts the web app; Pages builds on
every push to `main` and injects the production `VITE_API_URL`. Steps,
environment variables, and rollback are in [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Docs

| File | Contents |
|---|---|
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Exact request and response shapes |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Tokens, components, motion, contrast rules |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Atlas, Render, Pages, warming, rollback |
| [`docs/TEST_MATRIX.md`](docs/TEST_MATRIX.md) | Manual QA flows per feature |
| [`AGENTS.md`](AGENTS.md) | Working conventions and the full verify list |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branching, commit format, PR workflow |
| [`TODO.md`](TODO.md) | Sprint status and remaining work |
