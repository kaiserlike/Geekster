# Environments

The three stages, their databases, the blob store, secrets and access protection.

## Hosting facts

- Vercel, `@sveltejs/adapter-vercel` (SSR + API routes), no base path. Functions run in `dub1`
  (Dublin, next to Turso's `aws-eu-west-1`; `adapter({ regions })` in `svelte.config.js`, 10a;
  Hobby allows one region)
- Domain at IONOS; `www` 308-redirects to the apex
- Blob store `geekster-screenshots` (fra1, public — the access mode is fixed at creation).
  `static/screenshots/` is the upload source for `blob:migrate` and what a freshly seeded local
  database points at

## Stages

Three stages, all on free tiers (Vercel Hobby, Turso free, GitHub Actions on a public repo):

| Stage          | Branch           | URL                            | Database                 |
| -------------- | ---------------- | ------------------------------ | ------------------------ |
| **Production** | `main`           | <https://geekster.pro>         | Turso `geekster`         |
| **Staging**    | `develop`        | <https://staging.geekster.pro> | Turso `geekster-staging` |
| **Preview**    | any other branch | generated `*.vercel.app` URL   | Turso `geekster-staging` |

Vercel's `Development` environment cannot be deleted — it is left unpopulated, because local
work uses the repo's `.env` and `npm run dev`, never `vercel dev`.

- **Staging and preview share one set of variables.** Vercel Custom Environments are a Pro
  feature, so the Hobby plan has exactly one Preview environment. `staging.geekster.pro` is a
  project domain pinned to the `develop` branch — a preview deployment with a stable name, not a
  third environment. Anything set for Preview therefore also applies to every feature-branch
  preview
- **Local `.env` points at `file:local.db`**, not at Turso. The admin panel deletes games and blob
  files, so a local session must not be able to reach production. The live Turso credentials stay
  in the file commented out for deliberate one-off operations
- **One blob store for all three stages.** `src/lib/server/blob.ts` writes everything outside
  production under a `staging/` pathname prefix, which is how the delete guard below tells the
  stages apart. **A blob name never names the game** (Sprint 10a): every upload, admin or
  `blob:migrate`, is `screenshots/<32 random hex>.webp`, so a pathname is never reused and the
  network panel shows nothing but an image. The files from before 10a were renamed by
  `scripts/rename-screenshot-blobs.js` (one-off, see `docs/history/10-daily-leaderboard-sharing.md` § 10a). A
  separate store per stage would also be free — Hobby allows 100 — but one store plus a prefix is
  one thing to configure instead of three
- **A stage only deletes its own blobs.** `deleteScreenshotBlob()` refuses any URL whose pathname
  belongs to another stage, in both directions: staging will not delete a production image,
  production will not delete a `staging/` one. It logs and leaves the file alone — an orphaned
  file is recoverable, a deleted production image is not. This is what lets staging hold
  production's absolute blob URLs, so a refresh from production copies no images at all
- **A deleted blob can still be served from cache.** Uploads set `cacheControlMaxAge` to a year,
  so a `curl` of a just-deleted URL may still answer 200. `list({ prefix })` from
  `@vercel/blob` is the authoritative check
- **Staging is behind Vercel Authentication, production is not.** The project's protection is
  "all except custom domains", and that exemption covers only the **production** custom domain: a
  domain pinned to a branch still resolves to a preview deployment, so `staging.geekster.pro`
  answers `302 https://vercel.com/sso-api` to anyone not logged into the Vercel account
  (verified — geekster.pro returns 200). `src/hooks.server.ts` still sends
  `X-Robots-Tag: noindex, nofollow` whenever `VERCEL_ENV` is anything but `production`; it costs
  nothing and keeps every non-production host out of the index if that protection is ever relaxed
- **Data flows one way: production → staging.** There is deliberately no staging → production
  sync; see `docs/history/07-admin-panel.md` § Sprint 7h for why. `npm run db:refresh-staging` (Sprint 7h-c) replaces
  staging's `games` and `screenshots` with production's, copying `screenshots.url` **verbatim** so
  no image is copied at all: the store is public and the cross-stage delete guard means staging
  cannot delete production's blobs. It preserves IDs, leaves `scores` alone, and dumps staging
  first unless `--no-backup` is passed. It copies only the columns both databases have, so it
  works while staging is a migration ahead of production. **Never run `blob:migrate` against the
  staging database**
- `PRO_MIN_POOL_OVERRIDE` is the one variable meant for Preview only: it lowers the Pro gate so
  staging can play Pro while production is gated, and the code ignores it on production
- `ADMIN_PASSWORD` is set for Production. Preview has none, so the admin panel there stays closed
  until one is added in the dashboard
- `ADMIN_PASSWORD`, `RAWG_API_KEY` and both `TURSO_AUTH_TOKEN` entries are Vercel **sensitive**
  variables: write-only, not readable back through the dashboard, the API or the CLI. The only
  readable copies are in the local `.env` — lose those and the secret has to be rotated, not looked up
- **Env vars are bound at build time.** Changing one does not affect the running deployment; a
  redeploy is required before the new value is live
