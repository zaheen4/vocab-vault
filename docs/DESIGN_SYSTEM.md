# VocabVault — Design System

Philosophy: tactile play, not flat minimalism. The app behaves like a game
(XP, streaks, confetti), so surfaces feel pressable and feedback celebrates —
while learning content stays calm and readable. Brand shows up in three
controlled places: color tokens, rounded display type, celebration moments.

Tokens live in `client/src/index.css` (`@theme` and `@theme inline`). Use the
token classes — never raw hex in components.

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
| `primary` | `#1F2A44` | — | Static brand fill: brand panel, hero, ink on accent |
| `accent` | `#D9772F` | — | Static interaction fill: CTAs, focus rings, bars |
| `accent-deep` | `#9A4A12` | — | Tactile edge under accent fills; equals light `accent-ink` |
| `gold` | `#EADFC4` | — | Static manila fill: auth wash, nav highlight, tile tints |
| `night-950/900/800` | — | `#0E1326` / `#171D36` / `#222A4A` | Static dark fills |
| `cream-100/300` | — | `#F4EEDF` / `#C9C2AD` | Static dark ink |
| `display-xl` | `clamp(1.875rem, 1.4rem + 2.4vw, 2.75rem)` | — | Fluid display: flashcard word, done titles |
| `display-lg` | `clamp(1.5rem, 1.25rem + 1.4vw, 2rem)` | — | Fluid display: page H1s, hero |

- **Semantic first:** use `bg-canvas`, `bg-card`, `bg-raised`, `border-line`,
  `text-ink`, and `text-ink-muted` for surfaces and text. They resolve through
  `@theme inline` → `:root`/`.dark`, so one utility works in both themes.
- **Static fills stay static:** `primary`, `gold`, `night-*`, and `cream-*` do
  not auto-switch. Never repurpose `primary` as auto-switching ink; it is a
  background in the brand panel and hero.
- **Accent contrast:** `#D9772F` on white is only ~3:1. Use it for fills,
  focus rings, and large UI — never small text. Small accent text uses
  `text-accent-ink` (6.1:1 on card, 4.7:1 on manila).
- **Button ink:** navy `primary` on the accent fill is 4.50:1. Never white text
  on `accent`.
- **Stamp:** white on the solid `stamp` fill is 6.31:1; small stamp text on a
  card uses the semantic `text-stamp` token.
- **Radii:** `rounded-md` controls (inputs, buttons, chips), `rounded-lg/xl`
  cards and sheets, `rounded-full` pills/rings/toggles.
- **Dark mode:** class-driven (`.dark` on `<html>`, see `ThemeContext`). New
  work uses the semantic tokens; do not add raw slate-on-navy guesses.
- **Automated check:** `client/src/design-contrast.test.js` reads the tokens
  from `index.css` and enforces ≥4.5:1 for normal text and ≥3:1 for large
  text/UI. Update the test and the palette together.

## Typography: voice vs. reading

- **Display (`font-display`, Baloo 2):** brand mark, page H1s, deck titles,
  all buttons, pills, toasts, empty-state titles. Voice surfaces only.
- **Body (`font-sans`, Nunito):** everything else — *including* flashcard
  words, definitions, examples, and option text. Tested words stay neutral
  so letterforms never interfere with recognition.
- **Heading scale:** page H1s are fluid `text-display-lg` via shared `PageHeader`
  (with an accent eyebrow where the page needs orientation); heroes and done
  screens use fluid `text-display-xl`. Body text stays fixed — never fluid.
- **Micro type (`text-2xs`, 10px):** nav due counts only, never body copy.
- **Flashcard hierarchy:** the word (`text-display-xl` bold) leads; the
  definition answers in `text-lg font-medium` with `leading-relaxed` — never
  semibold, never competing. On the back face the word repeats as a mono
  eyebrow above the definition so the card stays identifiable while scrolled.
- **Micro-labels:** uppercase `tracking-wide` labels are rationed to counts
  and eyebrows; hints never go below `text-ink-muted` (contrast floor).
- **Catalog utility (`font-mono`, system monospace — no download):** uppercase
  metadata only — `DUE TODAY`, `GROUP 03`, counts, dates, timer digits. It is
  a utility voice, never body text or headings.

## Tactile controls

- **Primary and commit actions are chunky:** `rounded-xl` + 4px bottom-shadow
  edge that compresses on press (`active:border-b-0 active:translate-y-1`).
  Shared `Button` does this automatically for `primary`; other variants opt
  in with the `chunky` prop. Radius is chosen in one place — never put
  `rounded-md` and `rounded-xl` in the same class list.
- **Solid `stamp` is the one loud action on a stamped surface** (`Cram weak
  words`), passed with `chunky`. Never hand-roll a maroon CTA: the shared
  variant already carries the edge, press, and focus ring. The edge is
  `stamp-deep`, not `stamp/60` — a translucent border over the same fill is
  invisible, so the button read as a flat slab.
- **Everything pressable scales:** `active:scale-[0.97]` on buttons
  (built into shared `Button`), `active:scale-[0.99]` on large option rows.
- **2px borders on touchables** (deck cards, quiz options, flashcard faces,
  question card); **hairlines on static info** (stat cards, banners). The
  contrast is what makes touchables feel touchable.
- **Focus visible:** accent outline + offset on all interactives (built into
  shared `Button`; hand-rolled controls must add it explicitly).
- **Touch targets:** minimum 24×24px (WCAG 2.2 AA), aim 44×44px. Enlarge hit
  areas with padding + compensating negative margin so visuals stay identical.

## Motion: explain change, don't decorate

Motion earns its place when it shows where a change came from, confirms an
action, or preserves context while something leaves. Anything else is cut.

- **Library:** `motion` v14, wrapped once in `client/src/lib/motion.jsx`
  (`MotionProvider`, `m`, `MOTION`). Always import `m` and `useReducedMotion`
  from that module; never `motion` directly. `LazyMotion` runs in `strict` mode
  so a full import fails loudly.
- **Timing:** `MOTION.fast` 120ms (hover/press), `MOTION.base` 180ms
  (nav/toast/list), `MOTION.slow` 240ms (dialog/route). Nothing interactive
  waits more than 250ms. CSS mirrors these as `--dur-fast/base/slow` and
  `--ease-travel` in `index.css`.
- **Easing:** `cubic-bezier(.22, 1, .36, 1)` for travel and entrances; springs
  only for drag/swipe. The celebration pop keeps
  `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- **Properties:** transform and opacity. The nav indicator may animate layout
  because travelling is its whole job.
- **Stagger:** at most 8 items, 20ms apart, entrance only.
- **Banned:** parallax, infinite loops (the one-shot confetti is the exception),
  scroll-jacking, magnetic cursors, kinetic body text, per-letter animation, and
  motion that hides information or blocks a click.
- **Reduced motion:** `MotionConfig reducedMotion="user"` plus the CSS
  kill-switch. The nav indicator lands instantly, the icon lift and count tick
  skip, and every keyframe below is disabled.
- **Nav:** the accent underline is one shared element (`layoutId`) that travels
  between desktop destinations while the wash cross-fades; on mobile the top
  rule slides across the five tabs and the active icon lifts 1px.
- **Celebrations:** confetti still fires on strong sessions (≥60%) or level-ups
  — never on a shutout (`utils/celebrate.js`). Every study mode ends on
  `SessionResults` and runs under `SessionHud`, so a session reads the same
  whether it came from a deck, quiz, typing run, or a review queue.
- **Count-up numbers** (`utils/countUp.js`) jump straight to target under
  reduced motion.
- Existing keyframes in `client/src/index.css` (`fade-slide-in`, `pop-in`,
  `shake-x`, `float-up`, `glow-pulse`, `confetti-burst`, `slide-in-right/left`,
  `fade-up`) stay for CSS-only surfaces and remain under the reduced-motion
  kill-switch.

## Components

- Compose from `Button`, `Card`, `Chip`, `EmptyState`, `Input` — no raw
  `<button>`, raw `<input>`, or ad-hoc card markup without a documented
  exception.
- **Home = Today + Library.** The page opens with a dated `Today` heading, a
  due card carrying the one primary action, a goal meter, and a single-line
  quick-action row. The library keeps all decks visible with
  `All / In progress / Due / New / Mastered` chips (`Chip`, `aria-pressed`) and
  one search field. Each catalog card has one action — never a per-part button
  grid — and a `DUE n` stamp only when spaced-repetition review is actually due
  (`dueCount` minus never-seen words), not merely practicable.
- Page headers come from shared `PageHeader` (eyebrow + H1 + sub, plus an
  optional `action`). The action sits on the **eyebrow row**, right-aligned, at
  every width — parked under the subtitle it took a whole band of its own on a
  phone and read as a second title. Session screens share `SessionHud` +
  `ScoreRing`; deck identity comes from `DeckTile`.
- **Study session.** One column (`max-w-2xl`), one card, one answer bar:
  - The card is an index card: `bg-card`, 2px `border-line`, a corner tab
    (`CARD` / `MEANING`), a stacked card behind it, and `min-h-72` /
    `sm:min-h-80`. Front is the word + a mono dashed `Tap to reveal`; the back
    repeats the word as an eyebrow over the definition. Flip stays 3D and is
    killed by reduced motion.
  - `AnswerBar` is two 48px buttons — `Missed it` / `Got it` — with `1` / `2`
    hints from `md` up. It sticks at `bottom-18` on phones (clearing the tab
    bar) on an opaque `bg-canvas` backing; from `md` up — the same breakpoint
    where the bottom tab bar becomes the desktop nav — it sits in normal flow.
    Accessible names stay exactly `Missed it` and `Got it`.
  - `SessionHud` shows back link, mono position/score/combo/XP chips, one 2px
    progress bar with `role="progressbar"`, and optional tool chips.
  - `SessionResults` is the only done screen: eyebrow `Session complete`,
    message, optional greeting/subtitle, `ScoreRing`, stat tiles, the ✓/✗ word
    roll, then the caller's actions. Quiz and Typing keep their exact
    `You scored …` / `You spelled …` subtitles.
  - Due, Weak, and Saved are thin `ReviewSession` wrappers — they differ only
    in query and copy, never in card, keys, or results.
- **Study keyboard** lives in `utils/studyKeys.js` (pure resolver) +
  `useStudyKeys`: `Space` / `Enter` flip, `1` / `2` answer after the flip,
  `S` / `R` / `B` speak, reverse, bookmark. Keys never fire while focus is in
  an input or contenteditable, and flip keys defer to focused buttons/links so
  the browser's own activation wins. Every new shortcut needs a resolver test.
- **Deck detail.** `DeckHeader` sits above the mode tabs: back link, group
  eyebrow (`GROUP 01 · ALL PARTS`), title, `n words · n% mastered`, and a
  `DUE n` stamp using review-due. Parts are a segmented strip where each
  segment states its own next best reason to pick it — `Part 1 · 3 due` or
  `Part 2 · 45%` — with the accent pill travelling between segments.
- **Progress = a record spread, not six boxes.** `Sheet` gives every section the
  same card stock, rule, and corner tab (`PASSPORT`, `PIPELINE`, `STUDY LOG`,
  `DAILY GOAL`, `MISTAKE BANK`, `BADGES`), but the page is laid out as three
  uneven rows on a 12-column grid — **4 against 8** — so it reads as a spread
  rather than a stack of equal cards. Cards keep their natural height; a ragged
  bottom edge is part of the pinned-to-the-board feel.
  - Level passport: `ProgressRing` (navbar geometry, two sizes up) beside the
    level, then three **ledger lines** — mono label, dotted leader, figure
    right-aligned against one edge — instead of three floating stat columns.
    All numerals are `tabular-nums`.
  - `PipelineBar` replaces the three pastel cards: not started (line in light,
    muted ink in dark) / learning (accent) / mastered (sage) as one segmented
    bar with counts, shares, and an `aria-label` sentence. Segments run in
    pipeline order, so the rail fills toward the finish instead of starting
    with a green knob at zero, and the legend reads left to right the way a
    word travels. The rail is a `bg-raised` track with inset pills (`p-1`,
    `gap-1`): a slice sits inside the track rather than flush against a
    rounded end, so a 1% slice is a short pill, not a slider knob. No
    zero-count segment is drawn; a non-zero segment keeps an 8px floor.
    The legend is three rule-separated cells — label, then the count at
    display weight, then its share on its own line — so a number never drifts
    away from the word it describes, and "1 1%" never reads as a stutter. The
    card carries no header meta: the legend already states every count and
    share.
  - `WeekStrip` is a rolling seven days ending today — today outlined in ink,
    an empty day keeps a dashed cell instead of disappearing, fill density is
    relative to the week's busiest day (`utils/weekActivity.js`).
  - Daily goal is the same ring plus a target picker (`aria-pressed`): a
    compact 4x2 block on the right from `sm`, full width under the ring on
    phones. A met goal pulses a halo that is
    `absolute inset-0` inside the ring's own box, so it is concentric by
    construction — never a `box-shadow` on a wrapper holding an inline child,
    which leaves a baseline gap and turns `rounded-full` into an ellipse. The
    halo is the only celebration, and reduced motion holds it still.
  - `BadgeStamp` reads as a rubber stamp: brass and an inked border when
    earned, dashed outline with the `x/y` hint while locked. The shelf is a
    wrapping flex row (`justify-center`) so the odd fifth stamp centres at
    phone width instead of sitting alone against the left edge; every stamp
    takes an equal share from `sm`, and all of them stretch to one height. No
    header rule — with no title the only thing on it was the count floating
    over an empty line — so the footer carries the count and names the next
    unlock with its real measure.
  - The mistake bank is the page's one loud surface: a 4-column stamped card
    whose count and reason centre in the space above a pinned, full-width
    `stamp` action — never a full-width band with the action stranded at the
    far edge.
  - Rows are equal height. Each `Sheet` in a row is `flex h-full flex-col`
    and its closing note or action is `mt-auto`, so the passport footnote, the
    study-log caption, the badge footer and the Cram action all sit on the row
    baseline instead of leaving a ragged bottom edge.
  - Exactly one `Activity history →` link, in the page header, as a
    `Button variant="secondary"`. History is also in the account menu, never in
    the nav. `Cram weak words` is the page's one `Button variant="stamp" chunky`.
- **History = a day-grouped timeline.** The route, `History & Performance`
  heading, `Quiz History` / `Card Reviews` tabs, and `All` / `Correct` /
  `Needs Review` filters are contractual (e2e matches them). Days group in
  `utils/historyDays.js` with `Today` / `Yesterday` / `Tue, Nov 3` labels, one
  quiet mono divider per day. Entries are rows inside one sheet, not a card
  each: word or deck title, mono status/box/mode chips, relative time on the
  right. The quiz question audit stays expandable under its row.
- Complex behavior (dropdowns, dialogs, tooltips) uses Radix primitives,
  token-styled, pulled one package at a time — never hand-rolled focus traps.
- Join conditional classes with `utils/cn.js` (tailwind-merge: later colliding
  utilities win, so call-site overrides of base styles are safe).
- Icons are SVG from `components/art/` (`icons.jsx`, `Mascot`, `EmptyArt`) —
  never emoji as iconography. Small celebratory copy (toasts, level-up
  banners, session messages) may keep emoji; display-size glyphs (badges,
  HUD stats) must be SVG.
- Generative art is seeded (`art/seed.js`, never `Math.random` in render) so it
  is stable across renders, sessions, and devices.

## Responsive (mobile-first)

- Primary nav is a sticky top bar at every width, so the current section and
  destinations stay visible while the page scrolls. It keeps the brand lockup,
  desktop destinations, level ring, theme toggle, and account menu.
- Desktop active destination is bold ink on a soft accent wash with a 4px
  accent underline flush to the header rule; inactive links stay muted with a
  line hover underline. Review carries a 10px due count under its label
  (`text-2xs`, stamp color) so the label baseline still matches the other
  destinations.
- Brand lockup is the mark plus the wordmark — no tile, subtitle, or extra rule.
- Below `md:` the same destinations move to a fixed 5-tab bottom bar; the
  active tab gets an accent top rule, accent icon, and a light accent wash.
  The bar is 72px tall, and Review's due count sits under its label so all five
  labels share one baseline.
- `Layout` reserves the tab bar's height below `md:` with `pb-32` (128px against
  a 72px bar, so the last line clears the bar even when iOS puts it on a
  shorter visual viewport) and the normal gutter from `md`. `pt-*` is set
  separately from `pb-*` on `<main>` so no responsive `py-*` can quietly shrink
  the reserved space.
- Touch target floor is 24px (e2e-enforced), aim 44px: `Button` base carries
  `min-h-11`; tabs, chips, and icon buttons meet it individually.
- Overlays stack by design: toasts accept a `className` override so sticky
  chrome (e.g. the select-mode BatchBar) can lift them clear.

## Anti-list (closed — additions need team agreement)

No new webfonts, no glassmorphism, no image textures, no kinetic body text, no
custom cursor or magnetic effects. System monospace is an allowed utility role
(catalog metadata only). Oxblood (`stamp`) and brass (`brass`) are approved
status/badge colors, not extra brand accents. (Dark mode shipped in the
UI-overhaul foundation pass — the old "no dark mode before demo week" rule is
retired.)

## Checking a PR against this doc

- Voice surfaces render Baloo (computed `font-family`, not assumed).
- Interactive tap targets measure ≥24px (aim 44px).
- New motion is still under reduced-motion emulation.
- Loading, error, and empty states exist on every new fetch.
- One screen width at 375px and one at desktop, zero page errors.
- Surfaces and text use semantic tokens (`bg-canvas`, `bg-card`, `border-line`,
  `text-ink`, `text-ink-muted`), not raw slate on navy.
- Small accent text uses `text-accent-ink`; the accent fill never carries white
  text.
- No raw hex outside `index.css` (`design-tokens.test.js`).
- Automated contrast pairs pass (`design-contrast.test.js`): ≥4.5:1 normal
  text, ≥3:1 large UI.
- Automated: `npm run test:e2e` (`e2e/design-contract.spec.js`, Playwright)
- with dev servers running; `e2e/study-flows.spec.js` covers functional
- flows. Both stay out of CI (need Atlas).
