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
  by `tests/e2e/` (welcome, playing, the endless and Daily result screens, the years index in both
  languages, the admin login)
- **Legal pages (9g):** `/impressum` and `/privacy`, Austrian law (§ 5 ECG, § 25 MedienG, GDPR +
  DSG, § 165 (3) TKG 2021). The operator's details live once in `src/lib/legal.ts`. The prose is per
  language inside the route (`{#if de}`), not in the translation table; short labels are in it.
  **The privacy page lists every `localStorage` key the game writes** (`STORAGE_KEYS`) and says
  there are no cookies for players and no analytics: a new key, a cookie, a third-party request or
  analytics changes that page in the same commit. The footer (every game page) carries
  Impressum · Privacy and the credit "Screenshots © their respective rights holders, source:
  RAWG.io"; during a run its legal links open a new tab so the round survives. Takedown promise:
  removed within `TAKEDOWN_DAYS` = 14 days. Off `/`, the header's wordmark links back to the game
- **`<html lang>`** is rendered from the URL on the encyclopedia (`/de/…`, `/en/…`), `en` under
  `/admin`, and `de` everywhere else (the game's default language; the choice lives in
  localStorage); the root layout sets it to the shown language after hydration and on every switch

## Languages and URLs

- **One table, one lookup.** The text of both languages is in `src/lib/i18n/translations.ts`
  with a pure `translate(locale, key)`; `i18n.svelte.ts` (`t`, `ts`, `tf`, `tk`, the formatters)
  wraps it in the language on screen. Legal prose stays in its route
- **The language on screen** is the URL's on a page that carries one (`page.params.lang`), and
  otherwise the player's choice from localStorage. Reading `page` keeps it per request while the
  server renders. **Never call `setLocale()` on the server:** the locale is module state, which
  every request shares. Arriving on a language URL makes it the player's choice too, in the
  browser (`src/routes/[lang=locale]/+layout.svelte`)
- **The game at `/` switches on the client** (`LangSwitch` as a button). **The encyclopedia
  carries the language in the URL** with a localised first segment, `/de/jahre/…` and
  `/en/years/…` (decision 12-1). One route tree serves both: `src/routes/[lang=locale]/years/`,
  with `reroute` in `src/hooks.ts` mapping the German path onto it. `src/lib/localizedPaths.ts`
  builds and reads these paths (`localizedPath`, `alternatePath`); a path with the other
  language's segment is redirected 301 (`hooks.server.ts`). There, `LangSwitch` is a link to the
  other language's URL. Such links bypass `resolve()`, which knows route ids only
- **Head and SEO.** The root layout's title, description and link preview are the game's, in
  German like the HTML the server renders at `/`; the title carries the search terms ("Das
  Videospiel-Quiz nach Erscheinungsjahr"). It adds a canonical without the query to every page
  without its own head, and on `/` the `WebSite` + `WebApplication` JSON-LD (`gameJsonLd()`).
  `/sitemap.xml` (`sitemapXml()`, `SITEMAP_PAGES`) lists the public pages under
  `https://geekster.pro`; `static/robots.txt` points at it and keeps `/admin`, `/api/` and
  `/styleguide` out, and `/admin` also answers `X-Robots-Tag: noindex`. A page with its language in the URL brings its own through `SeoHead.svelte`: title,
  description, canonical, `hreflang` for each language plus `x-default` (English), `og:*`, and
  `noindex` while it has nothing to show. Shared values live in `src/lib/seo.ts`. Encyclopedia
  pages are cached by the CDN for an hour (`ENCYCLOPEDIA_CACHE`)
