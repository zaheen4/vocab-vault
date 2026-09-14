# VocabVault — Remaining Work

> Sprint: 4 weeks · Owner tags: **@fe** = Frontend Lead · **@be** = Backend Lead · **@data** = Data & DevOps Lead
>
> Check items off as they land on `main`. Keep this file updated in the same PR that completes the work.

## Done (before sprint)

- [x] Proposal presentation
- [x] Repo scaffold (React 19 + Vite 8 + Tailwind 4 / Express 5 + Mongoose)
- [x] Branch protection + commitlint hooks
- [x] MongoDB Atlas connected · 298 words seeded · 3 difficulty decks (superseded — see GregMat line below)
- [x] **GregMat dataset integrated** — 1,110 words × groups 1–37, 37 group decks on Home ([#35](https://github.com/zaheen4/vocab-vault/pull/35))
- [x] Auth API working end-to-end (register/login/me, JWT)
- [x] Word search API (`GET /api/words?q=`)
- [x] Progress summary endpoint skeleton
- [x] Leitner util (`server/src/utils/leitner.js`)

## Week 1 — Auth UI & Browsing

- [x] @fe Login page wired to `POST /api/auth/login` ([#7](https://github.com/zaheen4/vocab-vault/pull/7))
- [x] @fe Register page wired to `POST /api/auth/register` ([#7](https://github.com/zaheen4/vocab-vault/pull/7))
- [x] @fe AuthContext + JWT persistence (localStorage) + auto-inject via api client ([#6](https://github.com/zaheen4/vocab-vault/pull/6))
- [x] @fe ProtectedRoute wrapper + Navbar auth state (login/logout) ([#6](https://github.com/zaheen4/vocab-vault/pull/6), #7)
- [x] @fe Home page = deck grid of 37 GregMat group decks in group order, no badges (GET `/api/decks`) ([#8](https://github.com/zaheen4/vocab-vault/pull/8), [#35](https://github.com/zaheen4/vocab-vault/pull/35)) + personal My Words deck once the user adds words ([#42](https://github.com/zaheen4/vocab-vault/pull/42))
- [x] @be Deck list response: add word counts per deck ([#10](https://github.com/zaheen4/vocab-vault/pull/10))
- [x] @fe Search page wired to `GET /api/words?q=` ([#9](https://github.com/zaheen4/vocab-vault/pull/9))
- [ ] ~@data Decide Bangla-meanings source dataset or manual entry (deferred — `banglaMeaning` field optional and unused)~

## Week 2 — Practice, Quiz & Progress

- [x] @fe Flashcard practice page (card flip, "knew it" / "didn't know it" actions) ([#17](https://github.com/zaheen4/vocab-vault/pull/17))
- [x] @be `POST /api/progress/review` — record answer, advance Leitner box ([#15](https://github.com/zaheen4/vocab-vault/pull/15))
- [x] @be Practice session endpoint — next batch of words for a deck (respecting SRS due dates) ([#16](https://github.com/zaheen4/vocab-vault/pull/16))
- [x] @fe Progress dashboard (global mastered/learning/new counts; GET `/api/progress/summary`) ([#18](https://github.com/zaheen4/vocab-vault/pull/18))
- [x] @fe Quiz mode — MCQ generation from deck words + instant scoring
- [x] @be Quiz scoring endpoint (reuse progress review recording)
- [x] @be Quiz pool limited to viewed words (`GET /api/decks/:id/quiz`, practice-first empty state)
- [x] @fe ModeTabs navigation across practice/quiz/typing; deck cards link Practice only
- [x] @fe Per-deck session persistence: switching modes keeps each in-progress session ([#40](https://github.com/zaheen4/vocab-vault/pull/40))
- [x] @data Test matrix: register → practice → review → dashboard flow (`docs/TEST_MATRIX.md`, executed 2026-09-14)

## Week 2.5 — Gamified Practice (XP, Levels, Streaks) — landed on `main` ([#22](https://github.com/zaheen4/vocab-vault/pull/22))

- [x] @all Manual check of gamified practice UI before merge
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

- [x] @all Manual check of gamified practice UI before merge
- [x] @all Gamified practice merged to `main` via squash-merge, branch deleted ([#22](https://github.com/zaheen4/vocab-vault/pull/22))

### Quiz mode

- [x] @fe Quiz page — MCQ from deck words (4 options, instant right/wrong, session score) ([#21](https://github.com/zaheen4/vocab-vault/pull/21))
- [x] @be Quiz scoring reuses `POST /api/progress/review` (no new endpoint needed) ([#21](https://github.com/zaheen4/vocab-vault/pull/21))
- [x] @docs `API_CONTRACT.md` update if any response shape changes (audited in ([#46](https://github.com/zaheen4/vocab-vault/pull/46)); fixed hash leak + bookmark shape)

### Practice depth

- [x] @fe TTS pronunciation: pre-rendered Kokoro clips (all words) with Web Speech API fallback + per-row speakers on Search ([#38](https://github.com/zaheen4/vocab-vault/pull/38))
- [x] @fe Reverse-card toggle (definition → word) ([#36](https://github.com/zaheen4/vocab-vault/pull/36))
- [x] @be Streak freeze — 1 grace day (`gamify.js` + User field), unit-test the streak edges ([#37](https://github.com/zaheen4/vocab-vault/pull/37))
- [x] @fe Tiered end-of-session messages shared by practice and quiz (round-robin, 70 lines)
- [x] @data Test matrix extend: quiz → typing → TTS flows (`docs/TEST_MATRIX.md`, executed 2026-09-14)

### Typing mode

- [x] @fe Spell-the-word mode with fuzzy match (case/punctuation tolerant), wired into review recording
- [x] @be Accept typed-answer scoring via existing review endpoint

### Badges & goals

- [x] @be Badge rules (first word, 7-day streak, 100 reviews, Level 5, perfect session) + award on review ([#41](https://github.com/zaheen4/vocab-vault/pull/41))
- [x] @fe Daily goal setting + ring on dashboard/HUD ([#37](https://github.com/zaheen4/vocab-vault/pull/37))
- [x] @fe Badge toast + badge shelf on Progress page ([#41](https://github.com/zaheen4/vocab-vault/pull/41))

### Personal words & lists

- [x] @fe Add-your-own-word form (word/definition/example/pos) feeding SRS ([#43](https://github.com/zaheen4/vocab-vault/pull/43))
- [x] @fe Bookmarks — star toggle + bookmarks page ([#43](https://github.com/zaheen4/vocab-vault/pull/43))
- [x] @be Bookmark routes + CustomList model/routes (same CRUD shape) ([#42](https://github.com/zaheen4/vocab-vault/pull/42))
- [x] @fe Custom lists — create/list/add-remove ([#43](https://github.com/zaheen4/vocab-vault/pull/43))
- [x] @be Bookmark mastery status + box on entries ([#44](https://github.com/zaheen4/vocab-vault/pull/44))
- [x] @be Practice session from saved words (`GET /api/bookmarks/practice`) ([#45](https://github.com/zaheen4/vocab-vault/pull/45))
- [x] @fe Star toggle in practice/quiz/typing + saved review session page ([#43](https://github.com/zaheen4/vocab-vault/pull/43))
- [x] @fe Saved page v2 — mastery tabs, sort, batch select, visual lists ([#43](https://github.com/zaheen4/vocab-vault/pull/43))

### Analytics

- [x] @be Daily activity log + per-word history log on review (`GET /gamification/me` activity, `GET /progress/word/:wordId`) ([#47](https://github.com/zaheen4/vocab-vault/pull/47))
- [x] @fe Weekly activity heatmap on dashboard (7-day strip on Progress) ([#48](https://github.com/zaheen4/vocab-vault/pull/48))
- [x] @fe Per-word history (box path, last reviews) in Saved + Search rows ([#48](https://github.com/zaheen4/vocab-vault/pull/48))
- [ ] @docs Screenshots/numbers reserved for final report

## Week 4 — Deploy, Polish & Demo

- [x] @data Render deployment (API) + Atlas production user; CORS locked to the Cloudflare origin ([#49](https://github.com/zaheen4/vocab-vault/pull/49), live 2026-09-14: health 200, CORS proof pass)
- [x] @data Cloudflare Pages deployment (client, canonical `https://vvault.pages.dev`) + env vars ([#51](https://github.com/zaheen4/vocab-vault/pull/51), live 2026-09-14)
- [x] @data Load the final 1,110-word dataset via importer; verify search/practice against it
- [x] @data Warm-up runbook for demo day (Render free tier sleeps — hit API 30s before showtime) (in-repo keepalive cron + `docs/DEPLOY.md` §6)
- [ ] @fe Responsive pass — mobile-first check on all pages, tap-target sweep (24px min, 44px aim), touch-verify primary flows on a small viewport
- [ ] @fe Loading/error/empty states on every fetch
- [ ] All End-to-end regression: fresh account → practice → quiz → typing → review → import
- [ ] All Final report write-up + screenshots (heatmap + badge + quiz numbers)
- [ ] All Demo rehearsal (scripted walkthrough, TTS fallback line) + presentation slides update
- [ ] All Confirm presentation-machine audio for TTS; fallback line ready

## Backlog (post-submission ideas)

- Leaderboards & class competitions (cut from sprint scope by team decision); teacher analytics
- PWA offline mode / React Native wrapper
- ~~TTS pronunciation (Web Speech API)~~ — shipped as pre-rendered Kokoro `af_heart` audio
- AI-generated example sentences; voice quizzes
