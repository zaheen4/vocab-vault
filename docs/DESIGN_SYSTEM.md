# VocabVault — Design System

Philosophy: tactile play, not flat minimalism. The app behaves like a game
(XP, streaks, confetti), so surfaces feel pressable and feedback celebrates —
while learning content stays calm and readable. Brand shows up in three
controlled places: color tokens, rounded display type, celebration moments.

Tokens live in `client/src/index.css` (`@theme`). Use the token classes —
never raw hex in components.

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#28324E` | Structure (darkest): headings, brand, text on accent fills |
| `accent` | `#EE964B` | Interaction (warm): CTAs, focus rings, links |
| `gold` | `#FAF0CA` | Surface (lightest): auth backgrounds, nav highlight |
| `night-950/900/800` | `#0F1430` / `#171D3A` / `#232B52` | Dark surfaces: page / card / raised |
| `cream-100/300` | `#F7F1DE` / `#CFC6AB` | Dark ink: headings / muted body text |
| `display-xl` | `clamp(1.875rem, 1.4rem + 2.4vw, 2.75rem)` | Fluid display: flashcard word, done titles |
| `display-lg` | `clamp(1.5rem, 1.25rem + 1.4vw, 2rem)` | Fluid display: page H1s, hero |
| Status greens/ambers/reds | Tailwind palette | SRS states: `emerald` mastered, `amber` learning, `red` wrong |
| Neutrals | — | Tailwind `slate` for body text, `stone-50` page shell |

- Darkest → foreground, most saturated → interactive, lightest → surfaces.
- Never white text on `accent` (contrast ~2.5:1 fails); use `text-primary`.
- `gold` is surfaces only (auth wash, nav highlight, tile tints) — never a
  status color; SRS states always use the palette row above.
- `accent` does interaction (buttons, tabs, links) and data-viz (bars, rings);
  text accents stay sparing (eyebrows, XP figures).
- **Radius scale:** `rounded-md` controls (inputs, buttons, chips),
  `rounded-lg/xl` cards and sheets, `rounded-full` pills/rings/toggles.
- Dark mode is class-driven (`.dark` on `<html>`, see `ThemeContext`): every
  `dark:` utility pairs with a light default, and new dark surfaces use the
  `night` scale with `cream` ink — never raw slate-on-navy guesses.

## Typography: voice vs. reading

- **Display (`font-display`, Baloo 2):** brand mark, page H1s, deck titles,
  all buttons, pills, toasts, empty-state titles. Voice surfaces only.
- **Body (`font-sans`, Nunito):** everything else — *including* flashcard
  words, definitions, examples, and option text. Tested words stay neutral
  so letterforms never interfere with recognition.
- **Heading scale:** page H1s are fluid `text-display-lg` via shared `PageHeader`
  (with an accent eyebrow where the page needs orientation); heroes and done
  screens use fluid `text-display-xl`. Body text stays fixed — never fluid.
  Floors match the old fixed sizes so mobile never shrinks below approved.
- **Flashcard hierarchy:** the word (`text-3xl` bold) leads; the definition
  answers in `text-lg font-medium` with `leading-relaxed` — never semibold,
  never competing.
- **Micro-labels:** uppercase `tracking-wide` labels are rationed to counts
  and eyebrows; chevrons and hints never go below `text-slate-400`
  (contrast floor).

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

- Keyframes in `client/src/index.css`: flip, pop, shake, float-up, glow,
  confetti, page fade-slide, fade-up entrances with per-index stagger.
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
  never emoji above `text-base`. Small celebratory copy (toasts, level-up
  banners, session messages) may keep emoji; display-size glyphs (badges,
  HUD stats) must be SVG.
- Generative art is seeded (`art/seed.js`, never `Math.random` in render) so it
  is stable across renders, sessions, and devices.

## Responsive (mobile-first)

- Primary nav is a bottom tab bar below `sm:` (thumb reach); the top bar keeps
  logo, level ring, theme toggle, and the account menu.
- `Layout` reserves `pb-24` below `sm:` so the tab bar never covers content
  or CTAs; footer stays above it in flow.
- Touch target floor is 24px (e2e-enforced), aim 44px: `Button` base carries
  `min-h-11`; tabs, chips, and icon buttons meet it individually.
- Overlays stack by design: toasts accept a `className` override so sticky
  chrome (e.g. the select-mode BatchBar) can lift them clear.

## Anti-list (closed — additions need team agreement)

No new fonts, no new accent colors, no glassmorphism, no kinetic body text,
no custom cursor or magnetic effects. (Dark mode shipped in the UI-overhaul
foundation pass — the old "no dark mode before demo week" rule is retired.)

## Checking a PR against this doc

- Voice surfaces render Baloo (computed `font-family`, not assumed).
- Interactive tap targets measure ≥24px (aim 44px).
- New motion is still under reduced-motion emulation.
- Loading, error, and empty states exist on every new fetch.
- One screen width at 375px and one at desktop, zero page errors.
- Automated: `python3 scripts/design-contract.py` with dev servers running.
