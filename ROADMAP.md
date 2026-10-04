# Geekster - Roadmap

Where Geekster is going and why. This document holds the product vision, the goal for the next
few milestones and the order they come in. `PLAN.md` holds the work packages of the current
milestone, `docs/history/` the finished ones. `CLAUDE.md` describes the product as it is today.
Numbers 1–10 were called sprints, from 11 on milestones (`docs/history/README.md`).

> Written 2026-09-26, at the end of Sprint 7. The **Now** section changes every milestone. The
> vision should hardly change at all. If it does, record why under "Decision log".

---

## Vision

**Geekster is the place where video game history is played, not just read.**

It has two sides that feed each other:

1. **The game.** You place screenshots on a timeline. It is quick to learn, hard to master and
   fun to share, and the timeline mechanic itself is ours: no other site does Hitster-style
   timeline placement with game screenshots (research, 2026-09-26: GuessThe.Game, Gamedle,
   Framed, TimeGuessr, YearGuess)
2. **The encyclopedia (later).** You browse one year of gaming: the games released, the consoles
   launched, what happened in the industry. Every page can be played ("Play 1998"), and every
   game leads back into the encyclopedia

### Who it is for

| Audience                    | What they want                                           | What serves them                           |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| **Casual player** (primary) | a 5-minute round, something to share                     | Normal mode, Daily Timeline, share card    |
| **Enthusiast**              | to prove they know obscure games, to climb a leaderboard | Pro mode, endless runs, global leaderboard |
| **Friends / game night**    | to play together in one room                             | party mode, later real-time multiplayer    |
| **Curious browser**         | "what came out the year I was born?"                     | the encyclopedia, which leads into play    |

### Product ambition (the user's answer, 2026-09-26)

**Mostly to grow a public audience, and also a game for the user and their friends.** The rule
that follows from it: **polish comes before breadth.** A half-finished feature is worse than no
feature, because "if it isn't smooth it isn't fun, and I lose interest". Every sprint ends with
something that feels finished to a player.

---

## Product goal for Milestones 8–13

> **By the end of Milestone 13 (playing together), Geekster is a polished game with its own look that people come back
> to every day and share with others: two difficulty tiers, endless runs, a Daily Timeline with a
> global leaderboard, and the first encyclopedia pages as a way in from search.**

### How we will know (introduced in Sprint 10, once there is something to measure)

| Signal                      | Why it matters                          | Source                                   |
| --------------------------- | --------------------------------------- | ---------------------------------------- |
| Daily players               | growth                                  | cookieless analytics (see Cross-cutting) |
| Share rate on daily results | the virality loop works                 | share-button event                       |
| Return within 7 days        | retention: is it fun more than once     | anonymous device id on score submission  |
| Runs per session            | "one more go" feeling                   | analytics event                          |
| Live games per mode         | content health: Normal ≥ 300, Pro ≥ 100 | admin dashboard                          |

Targets are deliberately not set yet. The first month of numbers sets the baseline.

---

## Now / Next / Later

| Horizon   | #      | Theme                                     | Outcome for the player                                  |
| --------- | ------ | ----------------------------------------- | ------------------------------------------------------- |
| **Done**  | 8      | Normal / Pro, crop tool, endless mode     | a harder mode and runs that last as long as you're good |
| **Done**  | 9      | Redesign: design system and new look      | Geekster looks like its own product, not a prototype    |
| **Done**  | 10     | Daily Timeline, global leaderboard, share | a reason to come back every day, and to tell people     |
| **Now**   | **11** | The pipeline: migrations, tests (was 8m)  | nothing visible — releases need no manual DB step       |
| **Next**  | 12     | Encyclopedia foundation: year pages       | "what came out in 1998?", with a Play button            |
| **Later** | 13     | Party mode, then real-time multiplayer    | play together                                           |
| **Later** | 14+    | Encyclopedia depth, themed decks          | consoles, events, "play the PS1 era"                    |

### Why this order

The bullets keep the numbers of the time: "8m" is now Milestone 11, the encyclopedia ("11") is
12, multiplayer is 13.

- **8 before 9.** Sprint 8 changes the rules but adds little new UI: a mode choice and a
  different end screen. Redesigning first would mean building those screens twice
- **9 before 8m.** Sprint 9 needs no migration; 8m pays off with Sprint 10, the next sprint that
  adds tables, so it was to run right before that one (2026-09-27)
- **10 before 8m (2026-10-02).** The first playtest showed the answers can be read in the network
  panel and the global board takes any score. That is Sprint 10's referee work, and it matters
  more than automating a migration step that works by hand
- **9 before 10 and 11.** The leaderboard page, the share card (which needs a brand and an OG
  image) and the encyclopedia are the three biggest new surfaces. Built on the design system,
  they never have to be restyled
- **10 before 11.** Growth needs a loop before it needs traffic. The Daily Timeline and the share
  card are the loop, and the encyclopedia is one of the ways in. Traffic that arrives before the
  loop exists is wasted
- **Multiplayer last.** It is the most infrastructure (WebSockets, a second provider) for the
  smallest audience today. Party mode on one device gets most of the game-night value for a
  fraction of the cost

---

## Milestone themes in brief

The detail is in `PLAN.md` (current and next) and `docs/history/` (finished). This section says
only what each milestone is **for**.

### Sprint 8 - Normal / Pro, crop tool, endless mode

- **Two tiers instead of three:** Normal and Pro. Easy / Medium / Hard is dropped
- **A game can have a Normal shot, a Pro shot, or both.** An obscure game may have only a Pro
  shot. Pro rounds are drawn only from games that have one. Pro is harder in two ways: the
  screenshot, and stricter bonus scoring
- **Crop before upload.** From RAWG or a local file, select a 16:9 area, and only that part is
  encoded and uploaded. This is what makes Pro content cheap to produce: zoom into a HUD corner,
  a texture, a character's boots
- **Endless single-player.** A run ends only at 0 lives. +1 life back (up to 3) for every streak
  of 10. The 10-placement win condition is kept for multiplayer and the Daily Timeline only

### Sprint 9 - Redesign

Claude Design builds a design system from the existing codebase: tokens, type, colour,
components, motion. Then a styleguide, then the game restyled on it. This sprint also produces
the brand assets later sprints need: logo, favicon and the OG and share-card templates. It fixes
the UX audit's findings on the way, above all the HUD: the energy bar becomes the streak, with
its multiplier, and shows the way to a life back only while one is missing. Seven slices, one
session each (`docs/history/09-redesign.md`).

### Sprint 10 - Daily Timeline, global leaderboard, sharing

The growth loop. The Daily Timeline gives everyone the same 10 games each day, one attempt,
numbered (#1, #2, …). A result, and the end of an endless run, can be shared without spoilers.
First, the server becomes the referee: a card arrives as an image whose URL doesn't name the game,
and its year comes back only after it is placed. That is the prerequisite for any public
leaderboard, and the only real architectural work in this sprint (six slices,
`docs/history/10-daily-leaderboard-sharing.md`).

### Milestone 11 - The pipeline: migrations, tests, sync (formerly Sprint 8m)

A GitHub Actions job applies pending Drizzle migrations — staging on `develop`, production on
`main` — before the code deploys, so the order `0003` needed is enforced rather than remembered.
Planned 2026-09-27; the open question is whether to give GitHub a Vercel deploy token (see
`PLAN.md` § Milestone 11). Widened 2026-10-04 with the tests that should guard a release:
database integration tests for the referee, and an end-to-end smoke suite.

### Milestone 12 - Encyclopedia foundation

Year pages rendered on the server (`/years/1998`) from our own games plus open data. Each has a
"Play this year" button. The first pages built for search engines.

### Milestone 13 - Playing together

Party mode first: pass-and-play on one device, 2–6 players, first to 10. Real-time rooms
(PartyKit / Durable Objects, the old Sprint 10 plan) only if party mode shows the demand.

---

## The encyclopedia - high-level plan

A long-term bet, not a commitment with a date. It is planned now only so that Sprints 8–10 don't
close doors on it.

### What it is

A browsable history of video games, organised by **year**. Each year page shows:

- **Games released that year.** Ours first, since they have screenshots and are playable, then a
  wider list from open data
- **Platforms launched** (consoles, handhelds, significant PC hardware)
- **Industry events**: studio founded, acquisitions, E3 or Gamescom moments, record sales. These
  are curated by hand, because that is where our own voice and our SEO value are
- **"Play this year"**, **"Play this decade"**: a themed deck in the game

Later: platform pages, series pages, "born in 1994? here's your year", a zoomable timeline of
all of gaming.

### Phases

| Phase  | Content                                                                                    | Depends on        |
| ------ | ------------------------------------------------------------------------------------------ | ----------------- |
| **E1** | year pages from our 300+ games; platforms table; sitemap; "Play 1998"                      | Sprint 9's design |
| **E2** | Wikidata import (platforms, developer, genre, QID per game); events CMS in the admin panel | E1                |
| **E3** | platform and series pages, themed decks, editorial "year in review"                        | E2                |
| **E4** | interactive whole-history timeline; "your year"                                            | E3                |

### Architecture decisions to make now so nothing blocks it later

- **Data backbone: Wikidata (CC0).** It is free to store, remix and use commercially without
  attribution. Useful properties: `P577` publication date, `P400` platform, `P178` developer,
  `P123` publisher, `P136` genre, `P179` series, and for consoles `P176` manufacturer and `P571`
  inception. Wikidata also carries MobyGames and IGDB IDs, so a later cross-reference is cheap
- **Not IGDB or MobyGames as a backbone.** IGDB is free for non-commercial use only, and
  MobyGames' commercial tier starts at $99.99/month. Both would lock out ads or a paid tier
- **Wikipedia text is CC BY-SA**, so it is not copied. We write our own short texts from the
  facts, and facts are not copyrightable
- **RAWG stays the screenshot source**, and its terms require a link on every page that uses its
  data. The footer already has one. The terms are free under 100k MAU / 500k page views per month
  and 20k requests per month, so watch this once the encyclopedia generates traffic
- **Encyclopedia pages must not show the puzzle screenshot.** Otherwise one search reveals the
  answer to the Daily Timeline. Use cover art or a second, non-primary screenshot
- **Server-rendered i18n.** The game's EN/DE switch is client-side, which is fine for a game and
  invisible to search engines. Encyclopedia pages need the language in the URL (`/de/jahre/1998`
  or `/de/years/1998`) and `hreflang`. The decision is needed before E1, not in Sprint 8
- **SEO realism.** Head terms like "video games 1998" belong to Wikipedia and Fandom. A new
  domain wins on the long tail ("games released in March 1998 on PS1", "what came out the same
  year as Half-Life") and on things the others lack, the Play button above all. Thin template
  pages generated from an API are what search engines rank lowest, so every page needs its own
  text or a curated event

---

## Cross-cutting work (not a sprint of its own)

| Item                                  | When                                                                               | Why                                                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Impressum and privacy page** ✅     | Sprint 9 (9g, done)                                                                | a public site in Austria or Germany needs both, and "grow an audience" makes the site public in earnest                               |
| **Screenshot credit and takedown** ✅ | Sprint 9 (9g): global credit + takedown in 14 days; per screenshot in Milestone 12 | the EU has no fair use; the quotation right needs a source credit. A takedown contact and a credit line per screenshot lower the risk |
| **Unit tests (Vitest)**               | Sprint 8                                                                           | scoring and the game loop change, and Sprint 10 will run `scoring.ts` on the server; there are no tests today                         |
| **Cookieless analytics**              | Sprint 10                                                                          | the product goal needs numbers; cookieless means no consent banner. Check Vercel Web Analytics' Hobby limits first                    |
| **Pool size**                         | ongoing                                                                            | endless mode plus a daily means the pool is the product; 300 Normal / 100 Pro is the goal for Sprint 10                               |

---

## Ideas for discussion (not planned)

Raised during roadmap planning. None of these is a decision. Each needs a "yes" before it moves
into a sprint.

1. **Themed weekly decks.** "Nintendo only", "the 90s", "shooters". These reuse the draft and
   publish model and are the Timeline/Hitster content model. Natural after the encyclopedia's E2
   adds genre and platform data
2. **Hint economy.** In endless mode, spend points to reveal the platform or the decade. It adds
   decisions without adding difficulty tiers
3. **Year-guess heat map.** On the result screen, show where you were off. Good for sharing and
   for learning
4. **Community submissions.** Players suggest a game or a Pro crop, and the admin panel reviews
   it through the existing draft mode. The content engine for "grow an audience", but it needs
   moderation and an account model
5. **Sound and haptics.** A satisfying "clack" on a correct placement. This is part of what
   polish means, and it belongs in the redesign's motion and feedback section
6. **PWA / installable.** An icon on the home screen for daily players. Cheap after the redesign
7. **Streamer mode.** A bigger UI, a hidden answer until the reveal, a Twitch-friendly layout.
   Enthusiasts share through streams, not tweets

---

## Risks

| Risk                                                  | Likelihood                    | Mitigation                                                                                 |
| ----------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------ |
| Pro has too few games to be fun at launch             | high                          | Pro is offered only from 100 live Pro games ("Coming soon" before); crop in batches        |
| Screenshot copyright complaint (Abmahnung)            | low today, grows with traffic | Impressum, takedown contact, source credit per screenshot, stay non-commercial while small |
| Leaderboard cheating (endless scores have no ceiling) | **happening** (playtest)      | the server as referee: per-placement reveal, opaque image URLs (Sprint 10)                 |
| Daily answers leak through the encyclopedia           | medium                        | the encyclopedia never shows puzzle screenshots                                            |
| Scope creep kills polish                              | medium                        | one theme per sprint; "Ideas" need a yes before they move                                  |
| RAWG limits or terms change                           | low                           | screenshots are copied to our blob store, so RAWG is used only while curating              |

---

## Decision log

Moved to `docs/decisions.md` (2026-10-04), together with the decisions that were recorded only
in the milestone plans.
