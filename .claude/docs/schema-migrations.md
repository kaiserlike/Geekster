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

```bash
npm run db:migrate:staging
```

Verify by running it a second time — it must report nothing new.

Then exercise the feature on staging.geekster.pro.

### 5. At release — apply to production

```bash
npm run db:migrate:production
```

After the `develop` → `main` PR is approved and **before** the production deploy finishes. Then
verify on geekster.pro.

## Pointing a migration at a live database

Name the stage. There is nothing to uncomment and nothing to undo afterwards:

```bash
npm run db:migrate              # local — file:local.db
npm run db:migrate:staging
npm run db:migrate:production
npm run db:stamp -- --target=staging|production
```

The stage is resolved by `scripts/db-target.js`, shared by `drizzle.config.ts` and
`stamp-migrations.js` so both name a stage the same way and get the same guards. It reads
variables the application never touches:

| Variable                                                        | Read by                                                               |
| --------------------------------------------------------------- | --------------------------------------------------------------------- |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`                       | the **application** (`src/lib/server/db.ts`), and a bare `db:migrate` |
| `TURSO_STAGING_DATABASE_URL` / `TURSO_STAGING_AUTH_TOKEN`       | migration tooling only                                                |
| `TURSO_PRODUCTION_DATABASE_URL` / `TURSO_PRODUCTION_AUTH_TOKEN` | migration tooling only                                                |

That separation is the point. `TURSO_DATABASE_URL` stays at `file:local.db` forever, so the local
admin panel — which deletes games and their blob files — cannot reach production even while a
migration is being applied to it. Nothing in `src/` reads the `TURSO_STAGING_*` or
`TURSO_PRODUCTION_*` names, and they are set only in the local `.env`, never on Vercel.

Every non-local run prints the stage and host it resolved before it does anything:

```
drizzle: production → libsql://geekster-kaiserlike.aws-eu-west-1.turso.io
```

### The guards

`resolveTarget()` refuses rather than guesses:

- an unrecognised stage name
- a `TURSO_STAGING_*` or `TURSO_PRODUCTION_*` variable that is not set
- a production URL that is a `file:` path — that would report success and change nothing real
- a production URL containing `staging`
- a staging URL identical to the production URL — the copy-paste that would send a staging run at
  production

> Until Sprint 7h-b this was a manual dance: uncomment the live credentials in `.env`, run the
> migration, comment them out again. While they were uncommented, `npm run dev` gave the local
> admin panel full delete rights over production. That is what these named variables replace.

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
  one day is short. Take a dump first — see below.
- **`db:migrate` wants to re-run something already applied.** The `.sql` file changed after it was
  applied — most likely reformatted. The hash no longer matches. Restore the file's exact bytes
  rather than re-running.

## Backups

```bash
npm run db:dump -- --target=local|staging|production [--out=<dir>]
```

Writes `backups/<target>-<timestamp>.json` — every table, `__drizzle_migrations` included, so a
restored copy can be told which migrations it has already had. `backups/` is gitignored: these are
snapshots of live data and never belong in the repository.

**Take one before anything destructive.** A table rebuild, a backfill, a `db:refresh-staging`.
Turso's free plan keeps one day of point-in-time restore, which is the real safety net — but one
day is short and a dump costs two seconds.

### Restoring

Deliberately manual. There is no `db:restore`, because a script that writes rows back into a
database is exactly the kind of thing that should be read and thought about at the moment it is
needed, not trusted from a previous sprint.

The dump is plain JSON — `{ meta, tables: { games: [...], ... } }` — with each row a flat object
whose keys are the column names, so it can be fed straight back as named parameters:

```js
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const dump = JSON.parse(readFileSync('backups/production-....json', 'utf-8'));
const client = createClient({ url, authToken });

for (const row of dump.tables.games) {
	const cols = Object.keys(row);
	await client.execute({
		sql: `INSERT INTO games (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
		args: cols.map((c) => row[c])
	});
}
```

Restore `games` before `screenshots` — the foreign key runs that way. Check `meta.counts` against
what you end up with.

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

## The migrations so far

| Migration              | What it does                                        | local   | staging | production          |
| ---------------------- | --------------------------------------------------- | ------- | ------- | ------------------- |
| `0000_baseline`        | the schema as it already existed                    | stamped | stamped | stamped             |
| `0001_games_published` | `ALTER TABLE games ADD published integer DEFAULT 1` | applied | applied | **pending release** |

`0001` is the first migration to actually run rather than be stamped, and it went through this
runbook unchanged: generated, renamed from drizzle's random tag, read, committed with the code
that uses it, applied to local, then to staging after a dump. SQLite backfills the default, so all
existing rows came out `published = 1` and nothing changed behaviour until the code shipped.

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
