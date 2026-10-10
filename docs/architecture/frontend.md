# Frontend: design system, accessibility, legal pages

The game's UI rules in full. `CLAUDE.md` keeps the one-line version of each.

## Design system and dialogs

- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin). **Design system (Sprint 9b):** the
  tokens live in `src/app.css` `@theme` (`bg-surface`, `text-ink-muted`, `font-display`,
  `shadow-glow-card` …), the primitives in `src/lib/components/ui/`, and `/styleguide` renders every
  one in every state. The code is the source of truth, not the design canvas. Fonts are
  self-hosted via `@fontsource` (latin subset only), never from Google's CDN
- **Dialogs:** `bits-ui` — headless, Svelte 5 native. Only the dialog is used: the admin panel's
  confirm and lightbox (with the panel's own Tailwind classes), and since 9d the game's
  `ui/Lightbox.svelte` (the card to place at full size, in the tokens)

## Rules

- **Game UI (from Sprint 9b): tokens and primitives only.** Colours from the `@theme` tokens, not raw
  palette classes; buttons, chips, fields and panels from `src/lib/components/ui/`; transitions
  from `$lib/motion`, never straight from `svelte/transition` (it is what honours reduced motion).
  Every text-bearing surface is opaque; text on accent, pink or magenta is `text-on-accent`. The
  admin panel keeps its `gray-*` layout and its status colours; since 9f it has the body font and
  the `accent` token where it used purple (dark `text-on-accent` on an accent button)
- **Accessibility (9f):** the page content is in `<main>` (root layout; the admin layout and its
  login page have their own), every phase has one `h1`, and on a phase change focus moves to the
  new screen's `h1` (`tabindex="-1"`, `+page.svelte`). axe-core is clean on every phase — checked
  by `tests/e2e/` (welcome, playing, the endless and Daily result screens, the admin login)
- **Legal pages (9g):** `/impressum` and `/privacy`, Austrian law (§ 5 ECG, § 25 MedienG, GDPR +
  DSG, § 165 (3) TKG 2021). The operator's details live once in `src/lib/legal.ts`. The prose is per
  language inside the route (`{#if de}`), not in the translation table; short labels are in it.
  **The privacy page lists every `localStorage` key the game writes** (`STORAGE_KEYS`) and says
  there are no cookies for players and no analytics: a new key, a cookie, a third-party request or
  analytics changes that page in the same commit. The footer (every game page) carries
  Impressum · Privacy and the credit "Screenshots © their respective rights holders, source:
  RAWG.io"; during a run its legal links open a new tab so the round survives. Takedown promise:
  removed within `TAKEDOWN_DAYS` = 14 days. Off `/`, the header's wordmark links back to the game
- **`<html lang>`** is rendered `de` by the server (the game's default language; the choice lives
  in localStorage) and `en` under `/admin`; the root layout sets it to the shown language after
  hydration and on every switch
