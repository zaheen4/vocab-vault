# VocabVault Manual Test Matrix

> Executed against local dev servers (`npm run dev`: API :5000, web :5173).
> Authenticate with the persistent QA account (`qa@test.local`, password from
> `VV_QA_PASSWORD` env — never committed).
> Shared Atlas rule: never register throwaway accounts for matrix runs — but
> Flow 1 *is* the register path, so it uses one temp account
> (`matrix+<yyyymmdd>@test.local`) that is **deleted immediately after the run**
> via a cleanup script. Any probe words/decks created are deleted too.
> Assertions are tight on purpose (`+\d+ XP`, never `+.*XP`).

## Flow 1 — register → practice → review → dashboard

| # | Step | Expected |
|---|------|----------|
| 1 | `POST /api/auth/register` temp account | 201, `{ token, user }`; `user` has **no** `passwordHash` key |
| 2 | Login UI with temp creds | Redirects to `/`, avatar account menu shows temp name, Logout present, level ring renders |
| 3 | Home deck grid | 37 `Group N` cards in order + `N words` counts; cards show `due` counts + `% mastered` when started; deck filter appears (7+ decks); hero shows streak/level/XP chips; first-run guidance links Group 1; personal My Words deck appears once words are added |
| 4 | Open Group 1 practice, flip card, answer | Instant ✓/✗ feedback, floating `+\d+ XP` matches `xpEarned` in review response |
| 5 | `POST /api/progress/review` valid | 200, `progress.box` in 1–5, `gamification` has `xpEarned`, `level`, `dailyStreak`, `reviewsToday`, `dailyGoalTarget`, `newBadges: []` or badge entries |
| 6 | `POST /api/progress/review` bad id / non-boolean | 400 both cases |
| 7 | Progress page | Counts sum to practiced words; XP banner shows `Level \d+`, streak, `+\d+ XP`; goal ring `reviewsToday ≥ 1` |
| 8 | Delete temp account + probe data | `GET /api/gamification/me` with temp token → 401 afterwards |

## Flow 2 — quiz → typing → TTS

| # | Step | Expected |
|---|------|----------|
| 1 | Quiz on practiced deck, Start (5) | 5 questions render; answering records; end screen `You scored \d+ of 5 \(\d+%\)` |
| 2 | Quiz on unviewed deck | `EmptyState` "Practice first!" (no questions) |
| 3 | Typing session, correct spelling | `✓ Correct!`; typo within tolerance → `✓ Correct (typo forgiven!)`; wrong → shows correct spelling |
| 4 | Practice card speaker | Pre-rendered clip plays (`/audio/words/*.mp3` 200) or first-run volume tip toast |
| 5 | Silent device (no Web Speech voices) | Disabled speaker with `aria-label` hint; no crash, no page errors |
| 6 | Design-contract + study-flows e2e | `npm run test:e2e` 8/8 (4 design-contract + 4 study-flows) |

## Flow 3 — study flows (automated in `e2e/study-flows.spec.js`, QA account)

| # | Step | Expected |
|---|------|----------|
| 1 | Practice answer on a due deck | `Box \d` or `Mastered` label plus tight `+\d+ XP` feedback; review recorded |
| 2 | Quiz answer on a due deck | First option advances to `Next` / `See results` |
| 3 | Typing submit (wrong on purpose) | Correction banner `The spelling is …` names the word |
| 4 | Search `abate`, star round-trip | `\d+ results?`, star toggles, Bookmarks shows `abate`, unstar restores prior state (zero residue on shared QA account) |

Formal temp-account regression (register → decks → practice → review incl.
both 400s → quiz → search → add-word + 409 duplicate → bookmarks → lists →
zero-filled summary → gamification) passes; cleanup deletes temp user/word/
decks/progress and leaves QA decks intact.

## Last execution

- Date: 2026-09-15 · PR: [#75](https://github.com/zaheen4/vocab-vault/pull/75) · Executor: agent
- `npm run test:e2e` 8/8 (4 design-contract + 4 study-flows), zero page errors.
- Study flows green: practice records with exact XP math, quiz advances,
  typing grades, star round-trip restores state (zero residue by design).
- Formal temp-account regression green (both 400s, add-word 409,
  zero-filled summary, gamification); cleanup verified
  (`CLEANUP:{"user":1,"word":1,"decks":1,"progress":1,…}`), probe
  `{"words":[],"total":0,"page":1}`, QA 37 decks intact.
- Tests 144 passed, oxlint + eslint clean.
- Date: 2026-09-14 · PR: [#46](https://github.com/zaheen4/vocab-vault/pull/46) · Executor: agent
- Flow 1: all 8 steps pass (register 201 with no `passwordHash`; login redirect + name chip; 37 decks; `+14 XP` feedback; review 200 + both 400s; summary `{learning: 1}` + Level 1/14 XP/streak 1; temp account + data deleted, 0 left).
- Flow 2: quiz renders + records, unviewed-deck empty state, typing correct/forgiven/wrong paths, audio clip 200, search ok, `test:e2e` 4/4, zero page errors.
- Audit fixes in this PR: `passwordHash` no longer returned by register/login; bookmark POST shape documented with `status`/`box`.

## Production smoke (2026-09-14, live URLs; UI overhaul + mobile/PWA + About
shipped after via #62–#74, e2e flows via #75)

- Seed: 37 decks / 1,110 words / audio 200 on `https://vvault.pages.dev`.
- Temp register → practice (3 words) → review (`xpEarned` 14, streak 1, goal fields) → `first-word` badge → temp deleted.
- CORS: prod origin reflected, foreign origin gets no header.
