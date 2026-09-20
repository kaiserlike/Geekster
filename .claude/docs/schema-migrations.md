# Schema Migrations

How a column gets added to three databases without breaking any of them. Baselined in
Sprint 7h-a, this runbook written in 7h-b.

## The rules

1. **`drizzle/` is the only thing that creates or alters a table.** Not `db:push`, not raw DDL in
   a script. `db:push` is removed from `package.json`, not merely discouraged — it changes a
   database without leaving a record, which is exactly how production and staging drifted apart.
2. **A migration is code.** It is generated on the feature branch, read before it is committed,
   and reviewed in the pull request like anything else.
3. **Migrations are applied from a laptop, never from CI.** CI would need production credentials
   in GitHub secrets, and a migration that fails halfway through a deploy has no rollback. The
   quality gate in `.github/workflows/ci.yml` deliberately does not touch a database.
4. **Order is always staging first, production at release.** Never the other way round, never
   production alone.
5. **Expand, then contract.** See below — never drop a column in the same release that changes
   the code using it.

## The sequence

### 1. On the feature branch — generate

```bash
# edit src/lib/server/schema.ts first
npm run db:generate
```

Drizzle writes `drizzle/000N_<random_name>.sql` plus a `meta/` snapshot and a journal entry.
Rename the file to something that says what it does and update the matching `tag` in
`drizzle/meta/_journal.json` — `0000_baseline.sql` was renamed from `0000_ambitious_ultragirl`.

**Read the generated SQL.** It is not always what you meant:

- A default written as a JavaScript string is emitted as a quoted literal. `.default('CURRENT_TIMESTAMP')`
  becomes `DEFAULT 'CURRENT_TIMESTAMP'` and stores the text. Use ``.default(sql`CURRENT_TIMESTAMP`)``
  for a SQL keyword. This shipped to production once already; see § Known drift.
- SQLite cannot alter or drop most things in place. Drizzle will emit a table rebuild
  (create-copy-drop-rename) rather than an `ALTER`, and a rebuild on a live table deserves a
  closer read than an `ADD COLUMN`.

### 2. Apply to local, and prove it round-trips

```bash
npm run db:migrate            # .env points TURSO_DATABASE_URL at file:local.db
```

Best check that a migration is really correct: delete `local.db`, run `db:migrate` then
`db:seed`, and confirm the result. A migration that only ever runs on top of an existing database
hides mistakes that a from-scratch build exposes.

### 3. Commit the migration with the code that needs it

The `.sql`, its `meta/000N_snapshot.json` and the updated `_journal.json` all belong in the same
commit as the schema change and the code that reads the new column.

> `drizzle/` is in `.prettierignore`. The `.sql` bytes are hashed into `__drizzle_migrations`, so
> reformatting one would invalidate the record on every database. Do not reformat a migration,
> and never edit one that has already been applied anywhere — write a new migration instead.

### 4. When the branch reaches `develop` — apply to staging

Vercel deploys `develop` to staging.geekster.pro on merge. The migration does **not** ride along;
run it yourself, and run it **before** the new code is live if the code depends on the column.

See § Pointing a migration at a live database for the credential handling.

Verify:

```bash
npm run db:migrate    # second run must report nothing new
```

Then exercise the feature on staging.geekster.pro.

### 5. At release — apply to production

Same command with the production credentials in place, after the `develop` → `main` PR is
approved and **before** the production deploy finishes. Then verify on geekster.pro.

`db:migrate` has no `--target` flag — it goes wherever `TURSO_DATABASE_URL` points, which is the
whole reason the next section exists.

## Pointing a migration at a live database

`.env` deliberately points `TURSO_DATABASE_URL` at `file:local.db`, so nothing run locally can
reach production by accident — the admin panel deletes games and blob files. The live credentials
sit in the same file, commented out.

For a migration, uncomment the block for the stage you are targeting, run the command, then
**comment it out again in the same sitting**.

> **This is the one genuinely dangerous step in this runbook.** While the production credentials
> are uncommented, `npm run dev` gives the local admin panel full delete rights over production
> games and their blobs. Re-comment before doing anything else. If you are interrupted, assume you
> left it live and check.

`scripts/stamp-migrations.js` reads named variables instead, which avoids the problem for
stamping: `--target=staging` reads `TURSO_STAGING_DATABASE_URL` / `TURSO_STAGING_AUTH_TOKEN`, and
`--target=production` refuses outright while `TURSO_DATABASE_URL` still points at a `file:` URL.
`drizzle-kit migrate` has no equivalent, because it only reads what `drizzle.config.ts` gives it.
Making `db:migrate` target a stage by name — the same way `db:stamp` already does — is recorded
as follow-up work in `SPRINTS.md` § 7h-b.

## Expand and contract

Never drop a column in the same release that changes the code using it. Rolling the application
back must never leave it talking to a database that no longer has what it needs.

A rename from `old_name` to `new_name` is three releases:

| Release      | Migration                                  | Code                                |
| ------------ | ------------------------------------------ | ----------------------------------- |
| **Expand**   | add `new_name`, nullable or with a default | writes both, reads `old_name`       |
| **Migrate**  | backfill `new_name` from `old_name`        | reads `new_name`, still writes both |
| **Contract** | drop `old_name`                            | writes `new_name` only              |

Adding a column is just the expand step, which is why 7i-a's
`games.published INTEGER DEFAULT 1` is safe in one release: the default means every existing row
and all the old code keep behaving exactly as before, and the column is simply ignored until the
code that filters on it ships.

## When it goes wrong

There is no automatic rollback, by design — a down-migration that has never been tested is worse
than none.

- **A migration fails partway.** libSQL applies statements in a batch, but a failure still leaves
  you needing to know what landed. Read the actual table (`sqlite_master`) rather than guessing,
  fix forward with a new migration, and do not hand-edit the one that failed.
- **Turso's free plan keeps one day of point-in-time restore.** That is the real safety net, and
  one day is short. Take a dump before anything destructive — `npm run db:dump` is 7h-d and does
  not exist yet.
- **`db:migrate` wants to re-run something already applied.** The `.sql` file changed after it was
  applied — most likely reformatted. The hash no longer matches. Restore the file's exact bytes
  rather than re-running.

## The baseline, and stamping

`0000_baseline.sql` describes the schema as it already existed in Sprint 7h-a. All three databases
were **stamped** as having run it rather than actually running it — the tables were already there
and the baseline is a plain `CREATE TABLE`, which would fail on its first statement.

```bash
npm run db:stamp -- --target=local|staging|production [--dry-run] [--tag=000N_name]
```

It writes the row a successful run would have written: sha256 of the `.sql` file, and the
journal's `when` as `created_at`. That is what `drizzle-orm/libsql/migrator` records, and
`drizzle-kit migrate` on the `turso` dialect delegates to it. The migrator skips any migration
whose `when` is not newer than the newest `created_at` present, which is what makes a stamped
migration a no-op.

**Stamping is a one-off for the baseline.** It claims a migration ran when it did not, so using it
on a real migration silently skips real DDL. It only touches journal entry 0 unless `--tag=` is
passed, and it refuses a database whose tables are missing — that case wants a real `db:migrate`.

## Known drift

Production and staging have never had identical schemas, and neither exactly matches the baseline.
Discovered while stamping in 7h-a:

|                      | production                              | staging                       |
| -------------------- | --------------------------------------- | ----------------------------- |
| built by             | `db:push` from the old schema           | raw DDL in `seed-database.js` |
| `created_at` default | `DEFAULT 'CURRENT_TIMESTAMP'` — the bug | `DEFAULT CURRENT_TIMESTAMP`   |
| `slug` uniqueness    | named index `games_slug_unique`         | inline `UNIQUE` autoindex     |

All 127 production games and 127 screenshots hold the string `CURRENT_TIMESTAMP` in `created_at`
rather than a time. `scores` is empty, so the `Invalid Date` this produces in `Leaderboard.svelte`
has not reached a player yet — it appears on the first score written.

This does not block ordinary migrations: `ADD COLUMN` applies the same either way. Fixing it is a
table rebuild plus a backfill, which should wait for `db:dump` (7h-d). Full detail in
`SPRINTS.md` § 7h-a.

> `db:generate` diffs against `drizzle/meta/0000_snapshot.json`, never against a live database, so
> this drift is invisible to it and will not be generated for you.
