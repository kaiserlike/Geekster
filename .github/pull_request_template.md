## What ships

<!-- Per work package: what a player or the admin notices, then fixes found on the way. -->

## Migrations

<!-- "None. All three databases stay at 000N." — or, per migration: -->

- [ ] **The old code works on the migrated database** — reads, and the values it still writes
      until the deploy (`docs/runbooks/schema-migrations.md` § A migration the running code must
      survive)
- [ ] **The new code works on the old database** — or, if not, the migration went to `develop` in
      a commit of its own and staging's **Migrate** run was green before the code followed
- [ ] Staging's **Migrate** run is green for this branch's head
- [ ] A rebuild or a backfill: `npm run db:dump -- --target=production` taken; proven on a copy of
      production

The merge runs **Migrate production**; Vercel deploys only once it is green.

## Verified

<!-- `npm run verify`, the tests added, what was checked by hand and where. -->

## After the merge

<!-- Production checks, `develop` fast-forwarded to `main`, a line in `CHANGELOG.md`. -->
