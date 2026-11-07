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

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `canvas` | `#E9E6DE` | `#0E1326` | Page shell (semantic) |
| `card` | `#FBF8EF` | `#171D36` | Card and sheet surfaces (semantic) |
| `raised` | `#F3EDDD` | `#222A4A` | Nested/raised surfaces (semantic) |
| `line` | `#D8CDB8` | `rgba(255,255,255,.10)` | Borders and dividers (semantic) |
| `ink` | `#1F2A44` | `#F4EEDF` | Headings and primary text (semantic) |
| `ink-muted` | `#5B6478` | `#C9C2AD` | Secondary text (semantic) |
| `accent-ink` | `#9A4A12` | `#F0A05E` | Small accent text and links (semantic) |
| `stamp` | `#A63D2F` | `#F08A7A` | Due/error stamps and status (semantic) |
| `stamp-deep` | `#76271C` | `#B8564A` | Tactile edge under a solid `stamp` fill (semantic) |
| `sage` | `#2F6B4F` | `#7FD1A4` | Mastered/success status (semantic) |
| `brass` | `#8A6414` | `#E0B85C` | Badges, XP, streak accents (semantic) |
| `manila` | `#E9E4D5` | `#282B39` | Passport / auth stock (semantic) |
| `stamp-wash` | `#E7E1D9` | `#19192A` | Mistake-bank / danger stock (semantic) |
| `primary` | `#1F2A44` | — | Static brand fill: brand panel, hero, ink on accent |
| `accent` | `#D9772F` | — | Static interaction fill: CTAs, focus rings, bars |
| `accent-deep` | `#9A4A12` | — | Tactile edge under accent fills; equals light `accent-ink` |
| `gold` | `#EADFC4` | — | Static manila fill: auth wash, nav highlight, tile tints |
| `night-950/900/800` | — | `#0E1326` / `#171D36` / `#222A4A` | Static dark fills |
| `cream-100/300` | — | `#F4EEDF` / `#C9C2AD` | Static dark ink |
| `display-xl` | `clamp(1.875rem, 1.4rem + 2.4vw, 2.75rem)` | — | Fluid display: flashcard word, done titles |
| `display-lg` | `clamp(1.5rem, 1.25rem + 1.4vw, 2rem)` | — | Fluid display: page H1s, hero |

Rules of thumb:

- **Darkest → foreground**, **most saturated → interactive elements**,
  **lightest → surfaces/backgrounds**
- Never put white text on `accent` — contrast fails (~2.98:1); use
  `text-primary` on accent fills instead (4.50:1)
- Touch targets: minimum 24×24px (WCAG 2.2 AA), aim 44×44px (Apple HIG).
  Enlarge hit areas with padding + compensating negative margin so the
  visuals stay identical
- Semantic tokens switch automatically between light and dark themes; see
  [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for full contrast rules and component usage

## Team

See `CONTRIBUTING.md` for branching, commit message rules and the PR workflow.
Current sprint status and remaining work live in `TODO.md`.
