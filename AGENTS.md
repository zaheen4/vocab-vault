# VocabVault — Agent Guide

## Quick Start
```bash
npm install          # installs root + client + server deps (workspaces)
cp server/.env.example server/.env   # add MONGODB_URI + JWT_SECRET
npm run seed         # seeds MongoDB (requires Atlas URI)
npm run dev          # runs API (:5000) + web (:5173) via concurrently
```

## Monorepo Structure
```
vocab-vault/
├── client/          # React 19 + Vite 8 + Tailwind 4 + React Router 7
├── server/          # Express 5 + Mongoose + MongoDB Atlas
└── package.json     # workspaces + root scripts
```

## Key Commands
| Task | Command |
|------|---------|
| Dev (both) | `npm run dev` |
| API only | `npm run dev:server` |
| Web only | `npm run dev:client` |
| Seed DB | `npm run seed` |
| Lint client | `npm run lint -w client` |
| Check commits | `npx commitlint --edit` (auto via husky) |

## Critical Conventions
- **Branch naming**: `feat/<thing>`, `fix/<thing>`, `docs/<thing>`, `chore/<thing>`
- **Commits**: Conventional format enforced by commitlint (`feat:`, `fix:`, `docs:`, `chore:`, etc.)
- **Branch protection**: `main` requires PR, blocks force-push/deletion, 0 approvals needed (self-merge OK)
- **PR workflow**: Feature branch → PR → self-merge (no approvals required)
- **No direct pushes to `main`** — everything through PR

## Environment
- `server/.env` required: `MONGODB_URI`, `JWT_SECRET` (not committed)
- Atlas M0 free tier used (512 MB, shared)
- Client proxies `/api` → `http://localhost:5000` via Vite config

## Architecture Notes
- Client never touches DB; all state via REST API (`/api/*`)
- JWT auth: tokens in localStorage, injected via `api/client.js`
- Leitner-box SRS logic in `server/src/utils/leitner.js`
- Word schema: `word` + `definition` required; rest optional (example, pos, synonyms, banglaMeaning, difficulty)

## Common Gotchas
- `npm install` at root installs everything via workspaces — don't `cd client && npm install`
- `npm run seed` fails silently if `.env` missing or Atlas unreachable
- Commitlint rejects non-conventional messages (case-sensitive subject, max 100 chars)
- Husky `prepare` script auto-installs hooks on `npm install` — don't remove
- Client uses `@tailwindcss/vite` plugin (Tailwind v4 CSS-first, no `tailwind.config.js`)

## Tracking
- `TODO.md` = sprint task board (role-tagged: @fe/@be/@data)
- `CONTRIBUTING.md` = branching/commit/PR conventions