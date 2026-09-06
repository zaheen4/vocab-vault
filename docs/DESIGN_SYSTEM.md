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
| Neutrals | — | Tailwind `slate` for body text, `stone-50` page shell |

- Darkest → foreground, most saturated → interactive, lightest → surfaces.
- Never white text on `accent` (contrast ~2.5:1 fails); use `text-primary`.

## Typography: voice vs. reading

- **Display (`font-display`, Baloo 2):** brand mark, page H1s, deck titles,
  all buttons, pills, toasts, empty-state titles. Voice surfaces only.
- **Body (`font-sans`, Nunito):** everything else — *including* flashcard
  words, definitions, examples, and option text. Tested words stay neutral
  so letterforms never interfere with recognition.
- Never introduce another font without a design review.

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
- Every new keyframe must be covered by the `prefers-reduced-motion`
  kill-switch in `index.css`. Verify under emulation, not by assumption.

## Components

- Compose from `Button`, `Card`, `EmptyState` — no raw `<button>` or ad-hoc
  card markup without a documented exception.
- Join conditional classes with `utils/cn.js`. It joins only — it does not
  dedupe conflicting Tailwind classes, so order colliding utilities
  carefully (or better: branch them so they never collide).

## Anti-list (closed — additions need team agreement)

No new fonts, no new accent colors, no glassmorphism, no kinetic body text,
no custom cursor or magnetic effects, no dark mode before demo week.

## Checking a PR against this doc

- Voice surfaces render Baloo (computed `font-family`, not assumed).
- Interactive tap targets measure ≥24px (aim 44px).
- New motion is still under reduced-motion emulation.
- Loading, error, and empty states exist on every new fetch.
- One screen width at 375px and one at desktop, zero page errors.
- Automated: `python3 scripts/design-contract.py` with dev servers running.
