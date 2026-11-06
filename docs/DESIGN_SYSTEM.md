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
- **Flashcard hierarchy:** the word (`text-3xl` bold) leads; the definition
  answers in `text-lg font-medium` with `leading-relaxed` — never semibold,
  never competing.
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
- **Everything pressable scales:** `active:scale-[0.97]` on buttons
  (built into shared `Button`), `active:scale-[0.99]` on large option rows.
- **2px borders on touchables** (deck cards, quiz options, flashcard faces,
  question card); **hairlines on static info** (stat cards, banners). The
  contrast is what makes touchables feel touchable.
- **Focus visible:** accent outline + offset on all interactives (built into
  shared `Button`; hand-rolled controls must add it explicitly).
- **Touch targets:** minimum 24×24px (WCAG 2.2 AA), aim 44×44px. Enlarge hit
  areas with padding + compensating negative margin so visuals stay identical.

## Motion: celebrations move, chrome stays calm

- Keyframes in `client/src/index.css` (`fade-slide-in`, `pop-in`, `shake-x`,
  `float-up`, `glow-pulse`, `confetti-burst`, `slide-in-right/left`,
  `fade-up`): page fade-slide, fade-up entrances with per-index stagger.
- Playful easing belongs on progress moments (unlock pop uses
  `cubic-bezier(0.34, 1.56, 0.64, 1)`); everyday motion stays linear/ease-out.
- Celebration rule: confetti fires on strong sessions (≥60%) or level-ups —
  never on a shutout (`utils/celebrate.js`). All four study modes share
  `ScoreRing` + `SessionHud` so results read the same.
- Count-up numbers (`utils/countUp.js`) jump straight to target under
  reduced-motion, same contract as the CSS kill-switch.
- Every new keyframe must be covered by the `prefers-reduced-motion`
  kill-switch in `index.css`. Verify under emulation, not by assumption.

## Components

- Compose from `Button`, `Card`, `EmptyState`, `Input` — no raw `<button>`,
  raw `<input>`, or ad-hoc card markup without a documented exception.
- Page headers come from shared `PageHeader` (eyebrow + H1 + sub); session
  screens share `SessionHud` + `ScoreRing`; deck identity comes from `DeckTile`.
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
- Desktop active destination is bold ink with a 4px accent underline flush to
  the header rule; inactive links stay muted with a line hover underline.
  Review carries an inline due count in the stamp color instead of a badge.
- Brand lockup is the mark plus the wordmark — no tile, subtitle, or extra rule.
- Below `md:` the same destinations move to a fixed 5-tab bottom bar; the
  active tab gets an accent top rule, accent icon, and a light accent wash.
- `Layout` reserves `pb-24` below `md:` so the tab bar never covers content or
  CTAs; footer stays above it in flow.
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
