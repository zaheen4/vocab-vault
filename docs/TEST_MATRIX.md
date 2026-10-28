# VocabVault Manual Test Matrix

> Executed against local dev servers (`npm run dev`: API :5000, web :5173).
> Authenticate with the persistent QA account (`qa@test.local`, password from
> `VV_QA_PASSWORD` env — never committed).
> Shared Atlas rule: never register throwaway accounts for matrix runs — but
> Flow 1 *is* the register path, so it uses one temp account
> (`matrix+<yyyymmdd>@test.local`) that is **deleted immediately after the run**
> via direct API deletion. Any probe words/decks created are deleted too.
> Assertions are tight on purpose (`+\d+ XP`, never `+.*XP`).

## Flow 1 — register → practice → review → dashboard

| # | Step | Expected |
|---|------|----------|
| 1 | `POST /api/auth/register` temp account | 201, `{ token, user }`; `user` has **no** `passwordHash` key |
| 2 | Login UI with temp creds | Redirects to `/`, avatar account menu shows temp name, Logout present, level ring renders |
| 3 | Home deck grid | One card per seeded `Group N` in order + `N words` counts; cards show `due` counts + `% mastered` when started; deck filter appears (7+ decks); hero shows streak/level/XP chips; first-run guidance links Group 1; personal My Words deck appears once words are added |
| 4 | Open Group 1 practice, flip card, answer | Instant ✓/✗ feedback, floating `+\d+ XP` matches `xpEarned` in review response |
| 5 | `POST /api/progress/review` valid | 200, `progress.box` in 1–5, `gamification` has `xpEarned`, `level`, `dailyStreak`, `reviewsToday`, `dailyGoalTarget`, `newBadges: []` or badge entries |
| 6 | `POST /api/progress/review` bad id / non-boolean | 400 both cases |
| 7 | Progress page | Counts sum to practiced words; XP banner shows `Level \d+`, streak, `+\d+ XP`; goal ring `reviewsToday ≥ 1` |
| 8 | Delete temp account + probe data | `GET /api/gamification/me` with temp token → 401 afterwards |

## Flow 2 — quiz → typing → TTS (all client-side, UI-only — no API paths)

| # | Step | Expected |
|---|------|----------|
| 1 | Quiz on practiced deck, Start (5) | 5 questions render; answering records via `POST /api/progress/review`; end screen `You scored \d+ of 5 \(\d+%\)` |
| 2 | Quiz on unviewed deck | `EmptyState` "Practice first!" (no questions) |
| 3 | Typing session, correct spelling | `✓ Correct!`; typo within tolerance → `✓ Correct (typo forgiven!)`; wrong → shows correct spelling |
| 4 | Practice card speaker | Pre-rendered clip plays (`/audio/words/*.mp3` 200) or first-run volume tip toast |
| 5 | Silent device (no Web Speech voices) | Disabled speaker with `aria-label` hint; no crash, no page errors |
| 6 | Full automated Playwright E2E suite | `npm run test:e2e` 30/30 across chromium + mobile |

## Flow 3 — study flows, queues & audits (automated in `e2e/`, QA account)

| # | Step | Expected |
|---|------|----------|
| 1 | Practice answer on a due deck | `Box \d` or `Mastered` label plus tight `+\d+ XP` feedback; review recorded |
| 2 | Part tabs switching | Multi-part deck switches parts, resets progress indices cleanly |
| 3 | Reverse card mode | `⇄ Reverse` flips prompt to definition with word target |
| 4 | Quiz answer on a due deck | First option advances to `Next` / `See results` |
| 5 | Typing submit (wrong on purpose) | Correction banner `The spelling is …` names the word |
| 6 | Search `abate` (`GET /api/words?q=`), star round-trip | `\d+ results?`, star toggles, Bookmarks shows `abate`, unstar restores prior state (zero residue on shared QA account) |
| 7 | Global daily due queue (`/practice/due`) | Batches due cards across all decks or shows clean EmptyState |
| 8 | Weak words remediation (`/practice/weak`) | Crams Leitner Box 1 mistake cards or shows clean EmptyState |
| 9 | All-deck quiz (`/quiz`) | Generates multi-deck MCQ pool across full catalog |
| 10 | History audit hub (`/history`) | Toggles `Card Reviews` filter tabs and expands quiz question audits |

## Flow 4 — auth lifecycle & security (automated in `e2e/auth-lifecycle.spec.js`)

| # | Step | Expected |
|---|------|----------|
| 1 | Demo quick-fill & password reveal | Fills form, toggles input type between password and text |
| 2 | Password strength & validation | Live meter evaluates entropy, mismatch blocks submission with error |
| 3 | Forgot password anti-enumeration | Success feedback displayed without revealing account existence |
| 4 | Profile settings update & cleanup | Name updated via UI, restored to original state (zero residue) |
| 5 | Danger zone confirmation | Reset progress and delete account modals require confirmation |

Formal temp-account regression passes when every step above is green:
register → decks → practice → review (incl. both 400s) → quiz → search →
add-word + 409 duplicate → bookmarks → lists → zero-filled summary →
gamification, with temp user/word/decks/progress deleted afterwards and QA
decks intact.

## Last execution

- Date: 2026-10-29 · PR: #82 (feat/e2e-suite-expansion) · Executor: agent
- `npm run test:e2e` 30/30 passed (chromium + mobile Pixel 7), zero page/console errors.
- Auth lifecycle green: quick-fill, password visibility toggle, live strength meter, confirm password mismatch, forgot password anti-enumeration, profile name update + cleanup, danger zone modals.
- Study modes green: practice Leitner transitions, reverse mode, TTS pronunciation triggers, quiz option advancement, spell typing correction, multi-part deck tabs (`PartTabs`).
- Daily queues & history green: global daily due queue, weak words remediation, all-deck quiz, review feed filter tabs, quiz question audit expandable accordions.
- Design contract green: 11 core routes audited, `vv_theme` localStorage dark/light toggle verified, 44px mobile tab bar tap targets verified.
- Unit tests green (`npm test` 185/185 passed), linters clean, zero npm audit high/critical vulnerabilities.

## Production smoke (2026-09-14, live URLs; UI overhaul + mobile/PWA + About
shipped after via #62–#74, e2e flows via #75)

- Seed: 37 decks / 1,110 words / audio 200 on `https://vvault.pages.dev`.
- Temp register → practice (3 words) → review (`xpEarned` 14, streak 1, goal fields) → `first-word` badge → temp deleted.
- CORS: prod origin reflected, foreign origin gets no header.
