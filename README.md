# VocabVault

A Smart Vocabulary Flashcard Web Platform — CSE 4113 Internet Programming Lab project.

Turns any vocabulary wordlist into
smart flashcard learning with flashcard practice, quizzes, and Leitner-box spaced
repetition — in the browser, no installation needed.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19 · Vite 8 · Tailwind CSS v4 |
| Backend  | Node.js 22 / 24 · Express 5 · Mongoose   |
| Database | MongoDB Atlas (free M0 cluster)     |
| Auth     | JWT + bcrypt                        |

## Project Structure

```
vocab-vault/
├── client/   React SPA (Vite dev server on :5173, proxies /api → :5000)
└── server/   Express REST API (:5000)
```

## Live

- Web: `https://vvault.pages.dev` (Cloudflare Pages, auto-deploys `main`)
- API: `https://vocab-vault-api.onrender.com/api` (Render free tier sleeps
  after ~15 min idle — hit `/api/health` ~60s before showtime; see
  `docs/DEPLOY.md` §6 warm-up runbook)

## Study Modes & Gamification

- Flashcards, MCQ quiz (viewed words only — practice first), and typing
  with fuzzy match; per-deck sessions persist across mode switches
- Leitner SRS (`server/src/utils/leitner.js`), XP/levels/streaks/badges/
  daily goals (`server/src/utils/gamify.js`), TTS via pre-rendered Kokoro
  clips with Web Speech fallback
- Home shows per-deck mastery %, due counts, deck filter, and hero streak/
  level/XP; personal My Words deck, bookmarks, custom lists, saved practice

## Mobile & PWA

- Bottom tab bar + avatar account menu below `sm:`; 44px touch targets
  (24px floor, e2e-enforced); `dvh` + safe-area + 16px inputs on iOS;
  installable (`site.webmanifest`, icons); dark mode via `ThemeContext`;
  Bolt the Vault-Bot mascot + seeded SVG deck art; single About page for
  product, privacy, and contact (no footer, no analytics)

## Getting Started

### Prerequisites

- Node.js ≥ 20.19 (Node 24 LTS recommended) — [nodejs.org](https://nodejs.org)
- Git
- A MongoDB Atlas free cluster (or any MongoDB URI)

### 1. Install everything (one command)

```bash
git clone https://github.com/zaheen4/vocab-vault.git
cd vocab-vault
npm install          # installs client + server deps via npm workspaces
```

### 2. Configure environment (server only)

```bash
cp server/.env.example server/.env
# edit server/.env → set MONGODB_URI (ask your teammate for the shared dev URI)
```

### 3. Run (one command, both services)

```bash
npm run dev
# api  → http://localhost:5000   (Express)
# web  → http://localhost:5173   (Vite, proxies /api automatically)
```

### 4. Seed the database (first time only)

```bash
npm run seed                 # loads server/data/gregmat-words.json into MongoDB
```

## API Overview

Auth: JWT (`Authorization: Bearer <token>`, 1-day expiry). Errors are
`{ "message": "..." }`. Full shapes live in `docs/API_CONTRACT.md`.

| Method | Path                         | Description                              |
|--------|------------------------------|------------------------------------------|
| GET    | `/api/health`                | Liveness + `deploy` SHA                  |
| POST   | `/api/auth/register`         | Create account → JWT                     |
| POST   | `/api/auth/login`            | Login → JWT                              |
| POST   | `/api/auth/logout`           | End session (client discards token)      |
| GET    | `/api/auth/me`               | Current user (auth required)             |
| GET    | `/api/decks`                 | Decks with word counts, progress, due    |
| GET    | `/api/decks/:id`             | Single deck (owner-scoped)               |
| GET    | `/api/decks/:id/practice`    | Practice session (SRS due order)         |
| GET    | `/api/decks/:id/quiz`        | Viewed words for quiz (practice first)   |
| GET    | `/api/words?q=`              | Search / list words (paginated)          |
| GET    | `/api/words/:id`             | Single word                              |
| POST   | `/api/words`                 | Add your own word (409 on duplicate)     |
| GET    | `/api/progress/summary`      | Mastery counts (zero-filled)             |
| GET    | `/api/progress/word/:wordId` | My SRS state + history for one word      |
| POST   | `/api/progress/review`       | Record answer → progress + gamification  |
| GET    | `/api/gamification/me`       | XP / level / streak / badges / activity  |
| PATCH  | `/api/gamification/goal`     | Set daily review target                  |
| GET    | `/api/bookmarks`             | Starred words with SRS status            |
| POST   | `/api/bookmarks`             | Star a word (idempotent)                 |
| DELETE | `/api/bookmarks/:wordId`     | Unstar a word (idempotent)               |
| GET    | `/api/bookmarks/practice`    | Practice session from saved words        |
| GET    | `/api/lists`                 | List my custom lists                     |
| POST   | `/api/lists`                 | Create a custom list                     |
| GET    | `/api/lists/:id`             | One list with words                      |
| PATCH  | `/api/lists/:id`             | Rename a list                            |
| DELETE | `/api/lists/:id`             | Delete a list                            |
| POST   | `/api/lists/:id/words`       | Add a word (`$addToSet`)                 |
| DELETE | `/api/lists/:id/words/:wordId` | Remove a word                          |
| GET    | `/api/admin/ping`            | Admin health check (admin role)          |

Bulk import was cut from sprint scope — no bulk-import endpoint exists.

## Seeding Custom Wordlists

The seed script loads the canonical GregMat dataset (`server/data/gregmat-words.json`,
1,110 words in groups 1–37) and creates one deck per group:

```bash
npm run seed
```

It also accepts any JSON file in the same `{ groups: [...] }` shape:

```bash
npm run seed -w server -- path/to/wordlist.json
```

Each entry needs `word`, `definition`; optional `example`. There is no
bulk-import endpoint — bulk import was cut from sprint scope.

## Pronunciation Audio

Word pronunciations are pre-rendered with Kokoro (`af_heart`) and shipped as
static MP3s so every device and browser hears the same natural voice, instead
of the OS speech engine (which on Linux is robotic espeak). Clips live in
`client/public/audio/words/`, with `client/public/audio/manifest.json` mapping
each word to its file slug. The client plays the clip and falls back to the Web
Speech API only if a clip is unavailable.

Regenerate (existing files are skipped):

```bash
npm run audio:generate             # all words
npm run audio:generate -- --group 1
npm run audio:generate -- --only quixotic,compound
npm run audio:generate -- --force  # rebuild everything
```

Requires a Python environment with `kokoro` and `soundfile`, plus `ffmpeg` on
`PATH`. Heteronyms that Kokoro stresses differently from the definition's
primary sense (e.g. `compound`) are fixed via `scripts/audio-overrides.json`
(misaki phoneme strings).


## Design System

Full rubric (voice/reading type split, tactile rules, motion, anti-list):
`docs/DESIGN_SYSTEM.md`. Summary below; the doc wins on conflicts.

Brand palette defined as Tailwind v4 theme tokens in `client/src/index.css`.
Use the token classes (`text-primary`, `bg-accent`, `bg-gold`, …) — never raw
hex values in components.

| Token    | Hex       | Role                  | Usage                                            |
|----------|-----------|-----------------------|--------------------------------------------------|
| primary  | `#28324E` | Structure (darkest)   | Headings, brand, text on accent backgrounds      |
| accent   | `#EE964B` | Interaction (warm)    | CTAs, focus rings, links                         |
| accent-deep | `#B25F16` | Tactile edge       | Bottom-shadow edge under accent fills (chunky buttons) |
| gold     | `#FAF0CA` | Surface (lightest)    | Auth page backgrounds, active-nav pill highlight |
| night-950/900/800 | `#0F1430` / `#171D3A` / `#232B52` | Dark surfaces | Page / card / raised (dark mode) |
| cream-100/300 | `#F7F1DE` / `#CFC6AB` | Dark ink | Headings / muted body (dark mode) |
| display-xl | fluid clamp | Display | Flashcard word, done titles (`text-display-xl`) |
| display-lg | fluid clamp | Display | Page H1s, hero (`text-display-lg` via `PageHeader`) |

Rules of thumb:

- **Darkest → foreground**, **most saturated → interactive elements**,
  **lightest → surfaces/backgrounds**
- Never put white text on `accent` — contrast fails (~2.5:1); use
  `text-primary` on accent fills instead
- Touch targets: minimum 24×24px (WCAG 2.2 AA), aim 44×44px (Apple HIG).
  Enlarge hit areas with padding + compensating negative margin so the
  visuals stay identical
- Neutrals come from Tailwind's built-in `slate` scale

## Team

See `CONTRIBUTING.md` for branching, commit message rules and the PR workflow.
Current sprint status and remaining work live in `TODO.md`.
