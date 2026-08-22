# VocabVault — Remaining Work

> Sprint: 4 weeks · Owner tags: **@fe** = Frontend Lead · **@be** = Backend Lead · **@data** = Data & DevOps Lead
>
> Check items off as they land on `main`. Keep this file updated in the same PR that completes the work.

## Done (before sprint)

- [x] Proposal presentation
- [x] Repo scaffold (React 19 + Vite 8 + Tailwind 4 / Express 5 + Mongoose)
- [x] Branch protection + commitlint hooks
- [x] MongoDB Atlas connected · 298 words seeded · 3 difficulty decks
- [x] Auth API working end-to-end (register/login/me, JWT)
- [x] Word search API (`GET /api/words?q=`)
- [x] Progress summary endpoint skeleton
- [x] Leitner util (`server/src/utils/leitner.js`)

## Week 1 — Auth UI & Browsing

- [ ] @fe Login page wired to `POST /api/auth/login`
- [ ] @fe Register page wired to `POST /api/auth/register`
- [ ] @fe AuthContext + JWT persistence (localStorage) + auto-inject via api client
- [ ] @fe ProtectedRoute wrapper + Navbar auth state (login/logout)
- [ ] @fe Home page = deck grid grouped by difficulty (GET `/api/decks`)
- [ ] @be Deck list response: add word counts per deck
- [ ] @fe Search page wired to `GET /api/words?q=`
- [ ] @data Decide Bangla-meanings source dataset or manual entry (blocking W3 field usage)

## Week 2 — Practice, Quiz & Progress

- [ ] @fe Flashcard practice page (card flip, "knew it" / "didn't know it" actions)
- [ ] @be `POST /api/progress/review` — record answer, advance Leitner box
- [ ] @be Practice session endpoint — next batch of words for a deck (respecting SRS due dates)
- [ ] @fe Quiz mode — MCQ generation from deck words + instant scoring
- [ ] @be Quiz scoring endpoint (reuse progress review recording)
- [ ] @fe Progress dashboard (per-deck mastered/learning/new counts; GET `/api/progress/summary`)
- [ ] @data Test matrix: register → practice → review → dashboard flow

## Week 3 — SRS Review, Lists & Admin Import

- [ ] @fe Smart Review page — mixed-deck session of words due for review
- [ ] @be Review queue endpoint — words across decks ordered by box/due date
- [ ] @fe Bookmarks — toggle star on cards, bookmarks page (bookmark API)
- [ ] @be Bookmark routes (`POST/DELETE /api/bookmarks`, list view with words populated)
- [ ] @fe Custom lists — create/list/add-remove words
- [ ] @be CustomList model + routes
- [ ] @fe Streaks — daily activity tracking + streak display on dashboard
- [ ] @fe Admin panel UI — upload CSV/JSON/XLSX, column mapping, preview
- [ ] @be Import parser + validation + reject report (`/api/admin/import`)
- [ ] @data Load the final 1200-word dataset via importer; verify search/practice against it

## Week 4 — Deploy, Polish & Demo

- [ ] @data Render deployment (API) + Atlas production user; CORS locked to Vercel domain
- [ ] @data Vercel deployment (client) + env vars
- [ ] @fe Responsive pass — mobile-first check on all pages
- [ ] @fe Loading/error/empty states on every fetch
- [ ] All End-to-end regression: fresh account → practice → quiz → review → import
- [ ] All Final report write-up + screenshots
- [ ] All Demo rehearsal (scripted walkthrough) + presentation slides update

## Backlog (post-submission ideas)

- Leaderboards & class competitions; teacher analytics
- PWA offline mode / React Native wrapper
- TTS pronunciation (Web Speech API)
- AI-generated example sentences; voice quizzes
