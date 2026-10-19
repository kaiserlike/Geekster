---
name: add-screenshots
description: Adds screenshots to Geekster on production — Normal and/or Pro shots for existing games (e.g. "Pro-Shots für 30 Spiele ohne Pro", "neuer Normal-Shot für Journey"), or new games with their Normal and/or Pro shot ("füg diese 10 Spiele hinzu"). Picks RAWG screenshots, crops them in the owner's style with crop subagents, has every image checked by an independent reviewer, builds a local preview page (current shot, source with crop box, result) and uploads through the admin panel only after the owner's OK. Use it whenever the user wants more games, more screenshots, Pro shots, replacement shots, or to fill years or decades in the game — even if they only say "mach mal wieder ein paar Pro-Shots" or "wir brauchen mehr 90er-Spiele".
---

# Add screenshots and games

The owner checks every image before it goes live, and the step that makes that fast is the
**preview page**: per shot the game's current shot(s), the RAWG source with the crop box drawn in,
and the finished crop. Everything before it exists to fill that page with images that are already
right; nothing reaches production until the owner has said OK to it.

Read `CLAUDE.md` (invariants: the referee, the Pro gate, blob names, data flows production →
staging) and `docs/runbooks/adding-games.md` (Normal/Pro slots, the crop step) before starting.
Style rules for both tiers are in `references/style.md`; the subagent briefs in
`references/briefs.md`.

## Set up

- `WORK` = a folder in the **session scratchpad**, never in the repo: ESLint lints the repo's
  `scratchpad/`, and the downloads are untrusted data. Run every script from the repo root:
  `WORK=<dir> node .claude/skills/add-screenshots/scripts/<script>.mjs …`
- The scripts read `.env`: `RAWG_API_KEY`, `ADMIN_PASSWORD` and `TURSO_PRODUCTION_*` (read-only use
  through `scripts/db-target.js`, except the upload which goes through the admin panel).
- `query.mjs "<SELECT>"` answers any read-only question about production.

## 1. Understand the request

Settle, from the request or by sensible default, and say it in one or two lines:

- **Which games:** existing ones missing a tier (`--missing=pro|normal`, with years), named
  existing games (`--ids=`), or new games (a `Name|Year` list; propose a list yourself if the owner
  asks for "more 90s games" — check RAWG has decent shots before you suggest a game).
- **Which tiers:** Normal, Pro or both. New games always need a Normal to be live in Normal mode.
- **How many and how spread:** "spread over the years" means the years with the fewest shots of
  that tier get more (count them per year with `query.mjs`).
- **Pro gate:** report `published games with a Pro primary` (printed by `candidates.mjs`). If the
  owner sets a ceiling, pass it as `--stop-pro-at` at upload. `PRO_MIN_POOL` is 100.

For a big batch, tell the owner the count and the per-year distribution before cropping, then go on.

## 2. Candidates, RAWG, contact sheets

1. `candidates.mjs …` → `WORK/candidates.json` (keys: the game id, or `new-<slug>` for new games).
2. `rawg.mjs` → `WORK/rawg.json`: RAWG match, release year, screenshots minus the images the
   current shots came from. Read its output: fix a wrong match with `--slug=<key>:<rawg-slug>`
   (remakes share names: RE4, Dead Space, Fable, Silent Hill 2, God of War), and flag every
   **year mismatch** — the year is the first full release.
3. Choose per year: `WORK/selection.json` = `{ "<year>": { "n": 2, "pick": [keys], "backup": [keys] } }`.
   Prefer games whose shots are large enough (Pro ≥ 640 px crops; ≥ 480 for the 1990s), skip
   Wii/GameCube, keep one or two backups per year.
4. `shots.mjs fetch` then `shots.mjs sheet <key>` for every selected key → `WORK/sheets/`.
   Look at one sheet yourself to make sure it worked.

For Pro, calibrate once per session: `shots.mjs calibrate 8` → `WORK/calib/`. Look at them: width,
position, how little of the hero is left. Pass anything you notice on to the crop agents.

## 3. Crop agents → render → independent reviewer

- Split the selection into year blocks of ~10–15 games and start one **crop agent** per block in
  parallel with the brief from `references/briefs.md`. Keep them alive: corrections go back to the
  same agent (SendMessage), which still knows its games.
- Merge their picks into `WORK/proposals/all.json`, then `shots.mjs render WORK/proposals/all.json`
  (`MIN_W=480` if any small source is in it).
- Start **independent reviewers** (~20 images each, fresh agents, the reviewer brief) on the
  rendered `out/*.webp`. A reviewer sees only the image, never the reasoning — that independence is
  what catches the Big-Daddy-fills-half-the-frame cases.
- Send every FAIL back to its crop agent; render the redone ones and have a **fresh** reviewer check
  only those. A game with no clean crop is dropped and its slot goes to a backup of the same year,
  or to another thin year.
- When you disagree with a reviewer, look at the image yourself (zoom with `sharp` if needed),
  decide, and flag it for the owner. Look at the zoom before you trust a "tiny marker": Braid's
  faint HUD frame and Portal's centre crosshair were real.

## 4. The preview page — then wait

`overview.mjs WORK/proposals/all.json "<title>"` → `WORK/overview/index.html`; `open` it. In the
reply give: how many, the per-year distribution, what was dropped and why, the close calls (small
outputs, rule stretches, reviewer disagreements), and any **wrong current shot** found on
production (a different game, a logo) — the owner fixes those in the panel.

Then **stop and wait for the owner's OK.** Corrections come per game ("show a sliver of the
jacket", "the cat must go", "too easy", "too hard"): make them yourself with `shots.mjs preview`
and look at each result, re-render, have a fresh reviewer check any image that is new rather than
adjusted as asked, rebuild the page, reopen it, and ask again. A replacement game the owner has not
seen needs their OK too.

## 5. Upload — only after the OK

1. `upload.mjs WORK/proposals/all.json --dry-run` — every line should say what you expect.
2. One real upload first: `--only=<key>`. Check it with `query.mjs`: tier, `is_primary`,
   `source_url`, the six crop values, and that the blob URL answers 200. Then the rest.
3. New games are created as **drafts** unless the owner said to publish them (`--publish`); a
   draft is not live in any tier. Pro uploads count toward the gate: use `--stop-pro-at=N` when
   the owner set a ceiling. The script stops on the first failure; rerun it to resume — it skips
   what is already stored. Vercel Blob (Hobby) allows 2,000 `put`s a month: never upload twice.
4. If the Pro gate may have changed, check `curl -s https://geekster.pro/__data.json` →
   `proGate`.

## 6. After

- `npm run db:refresh-staging` (data flows production → staging only).
- A short entry in `PLAN.md` (the current milestone's section, or "Between milestones"): what was
  added, counts before → after, what was dropped; then a `docs:` commit with the attribution line.
  Push only if the owner asks. Nothing in `src/` changes for this; if it does, `npm run verify`
  and `/wrap-up` apply.
- New games: suggest `npm run covers:fill -- --target=production --dry-run` for their covers.
- Tell the owner where the upload log is (`WORK/upload_log.jsonl`).
