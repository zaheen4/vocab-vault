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
| 7 | Progress + History | Passport shows `Level \d+`, total XP, streak, `% to level n+1`; pipeline segments sum to practiced words; study log is 7 cells with today outlined and empty days dashed; goal ring matches `reviewsToday`; exactly one `Activity history` link. `/history` keeps `History & Performance`, a day-grouped timeline, the two tabs, and the three filters |
| 8 | Settings (Appearance, Study, Security) | Appearance OptionTiles toggle Light/Dark/System theme immediately; Study GoalPicker updates daily target (5–50 reviews); Security "Log out other devices" revokes sessions; Danger zone Dialogs (Confirm Progress Reset, Delete Account Permanently) prompt for password and dismiss on Cancel |
| 9 | Delete temp account + probe data | `GET /api/gamification/me` with temp token → 401 afterwards |

## Flow 2 — quiz → typing → TTS (all client-side, UI-only — no API paths)

| # | Step | Expected |
|---|------|----------|
| 1 | Quiz on practiced deck, Start (5) | 5 questions render; answering records via `POST /api/progress/review`; end screen `You scored \d+ of 5 \(\d+%\)` |
| 2 | Quiz on unviewed deck | `EmptyState` "Practice first!" (no questions) |
| 3 | Typing session, correct spelling | `✓ Correct!`; typo within tolerance → `✓ Correct (typo forgiven!)`; wrong → shows correct spelling |
| 4 | Practice card speaker | Pre-rendered clip plays (`/audio/words/*.mp3` 200) or first-run volume tip toast |
| 5 | Silent device (no Web Speech voices) | Disabled speaker with `aria-label` hint; no crash, no page errors |
| 6 | Full automated Playwright E2E suite | `npm run test:e2e` 42/42 across chromium + mobile (design-contract runs in both projects). While iterating use the targeted scripts — `test:e2e:study` / `test:e2e:design` / `test:e2e:auth` — and save the full run for review |

## Flow 3 — study flows, queues & audits (automated in `e2e/`, QA account)

| # | Step | Expected |
|---|------|----------|
| 1 | Practice answer on a due deck | `Box \d` or `Mastered` label plus tight `+\d+ XP` feedback; review recorded |
| 2 | Part tabs switching | Segmented strip shows `Part n · n due` or `Part n · n%`; switching parts resets progress indices cleanly |
| 3 | Reverse card mode | `⇄ Reverse` flips prompt to definition with word target |
| 4 | Quiz answer on a due deck | First option advances to `Next` / `See results` |
| 5 | Typing submit (wrong on purpose) | Correction banner `The spelling is …` names the word |
| 6 | Search `abate` (`GET /api/words?q=`), star round-trip | `\d+ results?`, star toggles, Bookmarks shows `abate`, unstar restores prior state (zero residue on shared QA account) |
| 7 | Global daily due queue (`/practice/due`) | Batches due cards across all decks or shows clean EmptyState |
| 8 | Weak words remediation (`/practice/weak`) | Crams Leitner Box 1 mistake cards or shows clean EmptyState |
| 9 | All-deck quiz (`/quiz`) | Generates multi-deck MCQ pool across full catalog |
| 10 | History audit hub (`/history`) | Toggles `Card Reviews` filter tabs and expands quiz question audits |
| 11 | Deck detail header | `GROUP nn · ALL PARTS`, title, `n words · n% mastered`, and a `DUE n` stamp using review-due, never raw practicable count |
| 12 | Keyboard answer | `Space` flips the card, `2` answers `Got it`, and the session reaches `Session complete`; study keys never fire inside the Typing input |
| 13 | Review queues share one shell | `/practice/due`, `/practice/weak`, `/bookmarks/practice` all render the same card, `Missed it` / `Got it`, `SessionHud`, and `SessionResults` |

## Flow 4 — auth lifecycle & security (automated in `e2e/auth-lifecycle.spec.js`)

| # | Step | Expected |
|---|------|----------|
| 1 | Demo quick-fill & password reveal | Fills form, toggles input type between password and text |
| 2 | Password strength & validation | Live meter evaluates entropy, mismatch blocks submission with error |
| 3 | Forgot password anti-enumeration | Success feedback displayed without revealing account existence |
| 4 | Profile settings update & cleanup | Name updated via UI, restored to original state (zero residue) |
| 5 | Appearance theme switcher | System / Light / Dark option tiles apply immediately and toggle `.dark` on `html` |
| 6 | Danger zone confirmation | Reset progress and delete account modals render Dialog confirmation prompts and dismiss on cancel |

Formal temp-account regression passes when every step above is green:
register → decks → practice → review (incl. both 400s) → quiz → search →
add-word + 409 duplicate → bookmarks → lists → zero-filled summary →
gamification, with temp user/word/decks/progress deleted afterwards and QA
decks intact.

## Flow 5 — primary navigation (automated in `e2e/design-contract.spec.js`)
| # | Step | Expected |
|---|------|----------|
| 1 | Desktop primary nav | `Decks · Review · Search · Saved · Progress`; no `History` top-level item |
| 2 | Review entry | Links to `/practice/due`; 10px due count sits under the Review label (hidden at 0, capped at `99+`) without changing the label baseline |
| 3 | Nested routes | Decks active on `/decks/:id`; Saved active on `/bookmarks/practice`; Progress active on `/history` |
| 4 | Active indicator | Current destination is bold ink on a soft accent wash with a 4px accent underline that travels between destinations (~180ms); mobile active tab adds an accent top rule that slides, accent icon, and accent wash |
| 5 | Reduced motion | Under `prefers-reduced-motion: reduce` the underline lands instantly, perfectly centred on the active link with no residual transform; icon lift and count tick are skipped |
| 6 | Sticky header | Header stays pinned while scrolling on every route; mobile bottom bar stays fixed |
| 7 | Mobile bottom bar | 5 tabs at 72px, every tab is at least 44px tall, no History tab |
| 8 | Account menu | Progress and History lead the menu, followed by Account settings, About & privacy, and Log out; no menu headings |
| 9 | Secondary history route | `/history` still renders `History & Performance` and is linked from Progress |

## Flow 6 — Home: Today + Library (automated in `e2e/design-contract.spec.js`)

| # | Step | Expected |
|---|------|----------|
| 1 | Today panel | Returning users see `Today` + date, due count with one `Start review` action, daily-goal meter, and a streak/level chip pair; first-run users see `Master your words.` with `Start with Group 1` |
| 2 | Quick actions | `Continue <deck> · Part n`, `Weak words (n)`, and `All-deck quiz` are single-line links with 44px targets |
| 3 | Library cards | One action per deck (`Start deck` / `Continue Part n` / `Review deck`); no per-part button grid; `DUE n` stamp only when review-due words exist |
| 4 | Status filters | `All / In progress / Due / New / Mastered` are `aria-pressed` buttons; the count line reads `n of 37 decks` and the grid shows exactly that many cards |
| 5 | Search | Matches title and group number (`12` → Group 12), empty result offers `Clear filters`, clearing restores all decks |
| 6 | Layout | No horizontal scroll at 375px; library bar is only sticky from `lg` up |

## Last execution

- Date: 2026-11-06 · Branch: feat/study-session-focus · Executor: agent
- `npm run test:e2e` 41/41 passed (chromium + mobile Pixel 7), zero page errors.
- Study is one shell now: `ReviewSession` backs `/practice/due`, `/practice/weak`,
  and `/bookmarks/practice` (three near-duplicate pages became thin wrappers), and
  Practice/Quiz/Typing share `AnswerBar`, `SessionHud`, and `SessionResults`.
- Card is an index card: `CARD`/`MEANING` corner tab, stacked card behind,
  mono dashed `Tap to reveal`, `text-display-xl` word,
  `min-h-72 / sm:min-h-80`. `AnswerBar` is two 48px buttons (`Missed it` /
  `Got it`, `1`/`2` hints from `md`) on an opaque `bg-canvas` backing;
  `bottom-18` below `md`, `bottom-4` from `md` — the same breakpoint where the
  mobile tab bar becomes the desktop nav.
- Keyboard map (`utils/studyKeys.js` + `useStudyKeys`): Space/Enter flip,
  1/2 answer after flip, S/R/B speak/reverse/bookmark; never inside inputs,
  and flip keys defer to focused buttons/links. 10 resolver tests.
- Deck detail gained `DeckHeader` (`GROUP 01 · ALL PARTS`, `n words · n%
  mastered`, review-due `DUE n`) and a segmented part strip (`Part 1 · 3 due` /
  `Part 2 · 1 due` / `Part 3 · 2 due`). `DUE` uses review-due, matching Home.
- Verified: `npm test` 237/237 across 30 files; oxlint 0 errors; Tailwind lint
  0 errors (3 pre-existing warnings); build green (CSS 63.29 kB); no horizontal
  scroll at 375/768/1440; light/dark reviewed; keyboard Space→flip and 2→answer
  reach results.

- Date: 2026-11-06 · Branch: feat/home-today-library · Executor: agent
- `npm run test:e2e` 40/40 passed (chromium + mobile Pixel 7), zero page errors.
- Home is now Today + Library: dated heading with streak/level chips, a due card
  with one `Start review`, a daily-goal meter, single-line quick actions, a
  first-run panel, and a status-filtered deck catalog. `DUE n` uses review-due
  (`dueCount` minus unseen words) so 15 of 37 decks stamp instead of all 37.
- Filters/search verified at 1280px: 20 in progress / 15 due / 17 new / 0
  mastered, `12` → Group 12, empty state clears back to 37 decks. Keyboard
  activation on a chip filters correctly.
- Unit tests green (`npm test` 227/227), client lints 0 errors, build green
  (index CSS 63.75 kB), no horizontal scroll at 375/768.

- Date: 2026-11-06 · Branch: fix/due-queue-dangling-words · Executor: agent
- `npm run test:e2e` 38/38 passed (chromium + mobile Pixel 7), zero page errors.
- Due/weak queues ignore progress rows whose word was retired: `/due?limit=100`
  returns exactly `totalDue` cards (84) and `/due?limit=20` returns a full
  batch, instead of an empty queue when the oldest rows were orphans.
- Seed prunes orphaned progress/bookmark/list refs after word deletions; the
  first sweep removed 76 progress rows from the shared Atlas data.
- Unit tests green (`npm test` 208/208), client lints and build unchanged.

- Date: 2026-11-06 · Branch: feat/motion-system · Executor: agent
- `npm run test:e2e` 38/38 passed (chromium + mobile Pixel 7), zero page errors.
- Nav green: sticky header, bold active destination on a soft accent wash, one
  shared accent underline that travels between destinations, 10px due count
  under the Review label with all five labels on one baseline, active state on
  nested `/history`, 72px mobile bar with sliding top rule + 44px targets,
  quiet account menu.
- Motion green: indicator travel measured frame-by-frame (moves from 509→679px
  and settles on the active link), reduced-motion run lands instantly with
  `transform: none` and the underline centred within 2px of the label.
- Bundle: 208.96 → 255.05 kB gzipped (+46.09 kB, one 45.03 kB `vendor-motion`
  chunk); ceiling raised to 50 kB by decision on 2026-11-06.
- Unit tests green (`npm test` 202/202), linters clean, client build green,
  `npm audit --omit=dev` 0 vulnerabilities.

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
