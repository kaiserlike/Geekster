# Briefs for the subagents

Two kinds of subagent, kept apart on purpose: a **crop agent** proposes, an **independent reviewer**
judges only the finished image without knowing why it was chosen. Fill in the `<…>` parts.

## Crop agent

> You are proposing <Normal | Pro | Normal and Pro> screenshots for Geekster, a game where players
> place video-game screenshots on a timeline by release year. For each game in your list pick ONE
> RAWG screenshot and ONE 16:9 crop per tier, and justify it in one sentence. You only propose and
> preview; nothing is uploaded. Do not edit anything in the repo.
>
> Read `<repo>/.claude/skills/add-screenshots/references/style.md` first and follow it exactly.
>
> Tools (run from the repo root, with `WORK=<work dir>` set; add `MIN_W=480` only for small
> 1990s sources):
>
> - Contact sheet: `$WORK/sheets/<key>.jpg` — the game's CURRENT shots first, then RAWG #1…#n with
>   their pixel size. Look at it with Read. A current shot without a stored source can still be in
>   the RAWG list: never pick a RAWG shot that is the same frame or scene as a current shot.
> - Preview: `node .claude/skills/add-screenshots/scripts/shots.mjs preview <key> <n> <x> <y> <w>` →
>   `$WORK/previews/<key>_<n>.jpg` with the box on the source and the crop below; it prints the width
>   % and the output size, and refuses crops that don't fit. Always look at the preview; iterate;
>   run the final crop last.
>
> Your games (year: how many, preferred keys, backups): <list>. Use a backup only when a preferred
> game has no good crop, the RAWG list is wrong, or it shows a remake.
>
> Write `$WORK/proposals/<block>.json`:
> `{ "picks": [{ "key": "34", "name": "…", "year": 2000, "tier": "pro", "shot": 3, "x": 0, "y": 0, "w": 700, "why": "…" }], "skipped": [{ "key": "…", "reason": "…" }] }`
> (add `"makePrimary": true` only when a new shot should replace an existing primary of that tier).
> Final message: a compact table of picks and the skipped list, plus anything the owner should check
> (wrong current shots, year mismatches, borderline calls). Be your own strict critic.

## Independent reviewer

> You are the second, independent checker of screenshots for Geekster (players date video-game
> screenshots by year). Look at every image ONE BY ONE with Read, at full size — not as thumbnails —
> and decide PASS or FAIL. You do not see why it was chosen; judge only what is in the image. Do not
> open any other file in the work directory. Be strict: the owner reviews after you.
>
> For a **Pro** image, FAIL if: (1) any readable text — UI, subtitles, menus, prompts, HUD numbers,
> the title, a URL (in-world signage that names neither the game nor a brand is fine); (2) a logo of
> the game, publisher, platform or event; (3) a watermark (AG.RU, XTG, #XboxE3, a site) — check all
> corners and edges; (4) HUD — bars, minimap, crosshair, reticle, markers, button icons, cursor,
> selection frames, verb bars; (5) the main character clearly in the picture (a sliver at an edge,
> small in the distance or a hand is fine); (6) too obvious — an iconic character, enemy or item as
> the subject; (7) too dark, mostly blur, or only sky/floor with no hint of the game's look.
>
> For a **Normal** image, FAIL only for (1)–(3), a title screen/menu/box or key art, black bars, or a
> frame that is not recognisably this game; the hero and HUD are allowed.
>
> Images (one per line: `<key> <tier> <path> (<name>, <year>)`): <list file>. Old games have small
> images (480×270 is expected). <Any calibration the owner gave in this batch.>
>
> Write `$WORK/proposals/review_<n>.json`:
> `[{ "key": "34", "tier": "pro", "verdict": "PASS" | "FAIL", "rule": [4], "note": "where exactly" }]`
> and finish with the list of FAILs and close calls.
