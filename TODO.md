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

- [x] @fe Login page wired to `POST /api/auth/login` (#7)
- [x] @fe Register page wired to `POST /api/auth/register` (#7)
- [x] @fe AuthContext + JWT persistence (localStorage) + auto-inject via api client (#6)
- [x] @fe ProtectedRoute wrapper + Navbar auth state (login/logout) (#6, #7)
- [x] @fe Home page = deck grid grouped by difficulty (GET `/api/decks`) (#8)
- [x] @be Deck list response: add word counts per deck (#10)
- [x] @fe Search page wired to `GET /api/words?q=` (#9)
- [ ] ~@data Decide Bangla-meanings source dataset or manual entry (deferred — `banglaMeaning` field optional and unused)~

## Week 2 — Practice, Quiz & Progress

- [x] @fe Flashcard practice page (card flip, "knew it" / "didn't know it" actions) (#17)
- [x] @be `POST /api/progress/review` — record answer, advance Leitner box (#15)
- [x] @be Practice session endpoint — next batch of words for a deck (respecting SRS due dates) (#16)
- [x] @fe Progress dashboard (per-deck mastered/learning/new counts; GET `/api/progress/summary`) (#18)
- [ ] @fe Quiz mode — MCQ generation from deck words + instant scoring
- [ ] @be Quiz scoring endpoint (reuse progress review recording)
- [ ] @data Test matrix: register → practice → review → dashboard flow

## Week 2.5 — Gamified Practice (XP, Levels, Streaks) — branch `feat/gamified-practice`

> **⚠️ NOT merged yet** — awaiting manual check & review. Other members may work on this branch directly.

- [ ] @all Manual check of gamified practice UI before merge
- [x] @be User model: `xp`, `level`, `totalCorrect`, `totalReviewed`, `lastPracticeDate`, `practiceStreakDays`
- [x] @be `server/src/utils/gamify.js` — XP/level curve + daily-streak logic
- [x] @be `POST /api/progress/review` returns `gamification` object (xpEarned, levelUp, dailyStreak, newWordsLearned, reviewsCaughtUp)
- [x] @be `GET /api/gamification/me` — XP/level/streak/progress-to-next
- [x] @fe Practice overhaul — instant ✓/✗ feedback, floating +XP, combo counter, HUD
- [x] @fe End screen — score ring, XP earned, best combo, new/mastered stats, confetti
- [x] @fe Level-up toast (gold glow pulse)
- [x] @fe Navbar stats chip (⭐ level · 🔥 streak · XP)
- [x] @fe Progress page XP/level/streak banner
- [x] @docs `API_CONTRACT.md` updated — gamification response, `/api/gamification/me`, User fields

## Week 3 — Study modes, practice depth & content

> Order matters: land the gamified work on main first; everything else
> follows. Cut order if pace slips: analytics → lists → goals.
> Demo core (quiz, TTS, typing) is protected.

### Merge gamified

- [ ] @all Manual check of gamified practice UI before merge
- [ ] @all Open PR from `feat/gamified-practice`, squash-merge, delete branch

### Quiz mode

- [ ] @fe Quiz page — MCQ from deck words (4 options, instant right/wrong, session score)
- [ ] @be Quiz scoring reuses `POST /api/progress/review` (no new endpoint unless needed)
- [ ] @docs `API_CONTRACT.md` update if any response shape changes

### Practice depth

- [ ] @fe TTS pronunciation button on flashcard (Web Speech API, frontend-only)
- [ ] @fe Reverse-card toggle (definition → word)
- [ ] @be Streak freeze — 1 grace day (`gamify.js` + User field), unit-test the streak edges
- [ ] @data Test matrix extend: quiz → typing → TTS flows

### Typing mode

- [ ] @fe Spell-the-word mode with fuzzy match (case/punctuation tolerant), wired into review recording
- [ ] @be Accept typed-answer scoring via existing review endpoint

### Badges & goals

- [ ] @be Badge rules (first word, 7-day streak, 100 reviews, Level 5, perfect session) + award on review
- [ ] @fe Daily goal setting + ring on dashboard/HUD
- [ ] @fe Badge toast + badge shelf on Progress page

### Personal words & lists

- [ ] @fe Add-your-own-word form (word/definition/example/pos) feeding SRS
- [ ] @fe Bookmarks — star toggle + bookmarks page
- [ ] @be Bookmark routes + CustomList model/routes (same CRUD shape)
- [ ] @fe Custom lists — create/list/add-remove

### Analytics

- [ ] @fe Weekly activity heatmap on dashboard
- [ ] @fe Per-word history (box path, last reviews) — data already exists
- [ ] @docs Screenshots/numbers reserved for final report

## Week 4 — Deploy, Polish & Demo

- [ ] @data Render deployment (API) + Atlas production user; CORS locked to Vercel domain
- [ ] @data Vercel deployment (client) + env vars
- [ ] @data Load the final 1200-word dataset via importer; verify search/practice against it
- [ ] @data Warm-up runbook for demo day (Render free tier sleeps — hit API 30s before showtime)
- [ ] @fe Responsive pass — mobile-first check on all pages
- [ ] @fe Loading/error/empty states on every fetch
- [ ] All End-to-end regression: fresh account → practice → quiz → typing → review → import
- [ ] All Final report write-up + screenshots (heatmap + badge + quiz numbers)
- [ ] All Demo rehearsal (scripted walkthrough, TTS fallback line) + presentation slides update
- [ ] All Confirm presentation-machine audio for TTS; fallback line ready

## Backlog (post-submission ideas)

- Leaderboards & class competitions (cut from sprint scope by team decision); teacher analytics
- PWA offline mode / React Native wrapper
- TTS pronunciation (Web Speech API)
- AI-generated example sentences; voice quizzes
