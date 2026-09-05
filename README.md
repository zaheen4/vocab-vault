# VocabVault

A Smart Vocabulary Flashcard Web Platform — CSE 4113 Internet Programming Lab project.

Turns any vocabulary wordlist into
smart flashcard learning with flashcard practice, quizzes, and Leitner-box spaced
repetition — in the browser, no installation needed.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 19 · Vite 8 · Tailwind CSS v4 |
| Backend  | Node.js 24 · Express 5 · Mongoose   |
| Database | MongoDB Atlas (free M0 cluster)     |
| Auth     | JWT + bcrypt                        |

## Project Structure

```
vocab-vault/
├── client/   React SPA (Vite dev server on :5173, proxies /api → :5000)
└── server/   Express REST API (:5000)
```

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
cd server
cp .env.example .env         # Windows: copy .env.example .env
# edit .env → set MONGODB_URI (ask your teammate for the shared dev URI)
cd ..
```

### 3. Run (one command, both services)

```bash
npm run dev
# api  → http://localhost:5000   (Express)
# web  → http://localhost:5173   (Vite, proxies /api automatically)
```

### 4. Seed the database (first time only)

```bash
npm run seed                 # loads server/data/gre-words.json into MongoDB
```

## API Overview

| Method | Path                | Description                    |
|--------|---------------------|--------------------------------|
| GET    | `/api/health`       | Liveness check                 |
| POST   | `/api/auth/register`| Create account → JWT           |
| POST   | `/api/auth/login`   | Login → JWT                    |
| GET    | `/api/auth/me`      | Current user (auth required)   |
| GET    | `/api/decks`        | All decks with populated words |
| GET    | `/api/words?q=`     | Search / list words            |
| GET    | `/api/progress/summary` | Mastery counts per status  |
| *      | `/api/admin/*`      | Admin-only (bulk import W10)   |

## Seeding Custom Wordlists

The seed script accepts any JSON array of word objects:

```bash
node src/scripts/seed.js path/to/wordlist.json
```

Required fields per entry: `word`, `definition`. Optional: `example`,
`partOfSpeech`, `synonyms[]`, `banglaMeaning`, `difficulty`
(`basic` | `intermediate` | `advanced`). Unknown formats will be handled by the
admin bulk-import UI (planned for week 10).

## Design System

Brand palette defined as Tailwind v4 theme tokens in `client/src/index.css`.
Use the token classes (`text-primary`, `bg-accent`, `bg-gold`, …) — never raw
hex values in components.

| Token    | Hex       | Role                  | Usage                                            |
|----------|-----------|-----------------------|--------------------------------------------------|
| primary  | `#28324E` | Structure (darkest)   | Headings, brand, text on accent backgrounds      |
| accent   | `#EE964B` | Interaction (warm)    | CTAs, focus rings, links                         |
| gold     | `#FAF0CA` | Surface (lightest)    | Auth page backgrounds, active-nav pill highlight |

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
