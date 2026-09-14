# VocabVault Manual Test Matrix

> Executed against local dev servers (`npm run dev`: API :5000, web :5173).
> Authenticate with the persistent QA account (`qa@test.local` / `password123`).
> Shared Atlas rule: never register throwaway accounts for matrix runs — but
> Flow 1 *is* the register path, so it uses one temp account
> (`matrix+<yyyymmdd>@test.local`) that is **deleted immediately after the run**
> via a cleanup script. Any probe words/decks created are deleted too.
> Assertions are tight on purpose (`+\d+ XP`, never `+.*XP`).

## Flow 1 — register → practice → review → dashboard

| # | Step | Expected |
|---|------|----------|
| 1 | `POST /api/auth/register` temp account | 201, `{ token, user }`; `user` has **no** `passwordHash` key |
| 2 | Login UI with temp creds | Redirects to `/`, Navbar shows temp name + Logout |
| 3 | Home deck grid | 37 `Group N` cards in order + `N words` counts; first-run guidance links Group 1 |
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
| 6 | Design-contract e2e | `npm run test:e2e` 4/4 |

## Last execution

- Date: 2026-09-14 · PR: [#46](https://github.com/zaheen4/vocab-vault/pull/46) · Executor: agent
- Flow 1: all 8 steps pass (register 201 with no `passwordHash`; login redirect + name chip; 37 decks; `+14 XP` feedback; review 200 + both 400s; summary `{learning: 1}` + Level 1/14 XP/streak 1; temp account + data deleted, 0 left).
- Flow 2: quiz renders + records, unviewed-deck empty state, typing correct/forgiven/wrong paths, audio clip 200, search ok, `test:e2e` 4/4, zero page errors.
- Audit fixes in this PR: `passwordHash` no longer returned by register/login; bookmark POST shape documented with `status`/`box`.
