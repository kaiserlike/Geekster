# What a good Normal and a good Pro shot look like

Give the crop agents this file word for word: the owner wrote the Pro rules in German, and their
wording is the reference. The lessons below come from the owner's corrections in real batches.

## Pro — the owner's rules (verbatim)

- Immer ein **RAWG-Screenshot**, meist stark zugeschnitten: Die Breite des Ausschnitts ist **40–60 % der Quellbreite**. Er sitzt oft an einem Rand oder in einer Ecke, selten in der Mitte.
- **Umgebung statt Hauptfigur:** Architektur, Landschaft, ein markantes Detail (ein Schild, ein Baum, ein Gebäude, ein Gegner am Rand). Die Hauptfigur ist nicht zu sehen, oder nur angeschnitten bzw. klein.
- **Kein typisches HUD, keine Schrift, kein Logo, kein Wasserzeichen.**
- **Ein Hinweis muss bleiben:** der Look des Spiels, seine Farbwelt, ein typisches Element. Erkennbar, aber man muss genau hinschauen. Nicht unlesbar dunkel, nicht nur Himmel oder Boden.
- Beispiele aus Produktion: Hi-Fi Rush (ein Stück der Comic-Stadt unten rechts), Neon White (die weißen Türme ohne die Figur), Death Stranding (Landschaft ohne Sam), Black Myth: Wukong (der kahle Baum, der Held angeschnitten), Inside (Nebel und Schild ohne den Jungen).
- **Immer ein anderes RAWG-Bild als der Normal-Primary des Spiels.** Sonst verrät die Normal-Karte den Pro-Ausschnitt.
- Der Ausschnitt muss mindestens **640×360** groß sein. Bei älteren Spielen (2000–2008) mit kleinen Quellbildern (800–1024 px) darf er deshalb **60–75 %** der Breite haben.
- **Wasserzeichen in Ecken:** RAWG-Bilder tragen oft ein kleines Wasserzeichen in einer Ecke (AG.RU, XTG, #XboxE3, Publisher-Logo). Der Ausschnitt muss es sicher ausschließen.

## Pro — what the owner's own shots and corrections add

- Measured on the owner's shots: 51–62 % of the source width, almost always touching an edge
  (often y=0 or the left/right edge); up to ~75 % on small sources.
- **1990s and sources ≤ 800 px:** 640 px is impossible; ≥ 480 px wide and ≤ 75 % of the source is
  accepted (the owner's own 1990s Pro shots are 347–437 px). Run `shots.mjs` with `MIN_W=480`.
- **A sliver of the hero is welcome** as a subtle clue — Halo: "the first outlines of the suit,
  very little"; Max Payne: "a bit of the black jacket at the edge, nothing else". Never more.
- **An enemy may be partly visible at the edge.** As the subject (Big Daddy, Tallneck, Limbo's
  spider, a colossus, a Titan, the HEV suit) it is too obvious.
- **A companion that is the game's hero is the hero:** the cat in Stray had to go entirely.
- **Avoid a game's most famous place** (Counter-Strike's Dust arch was "too easy"); prefer a less
  iconic spot in the same look. The opposite also happens: an empty canyon of Brothers was "too
  hard" — the owner then wanted the village with the brothers cut off at the bottom edge.
- **In-world signage is fine** when it names neither the game nor a brand and is not UI. Readable
  words that give the game away are not.
- **HUD remnants hide well:** a crosshair in the exact centre of every frame (Portal, CS — on a
  640×360 source no ≥ 480 crop can avoid the centre, so the game is unusable for Pro), a faint HUD
  frame in a corner (Braid's puzzle outline), radar circles, counters, verb bars, cursors,
  selection circles, subtitles.
- **Original release look only:** RAWG often lists remake, remaster, HD or mod screenshots for old
  games (1920×1080 for a 1990s game, modern lighting). The player dates the picture, so use them
  only if the art is identical, and say so.

## Normal

The Normal card is the easy tier: the player should recognise the game, so it shows the game as a
player remembers it.

- A RAWG screenshot (or a file the owner gives), cropped 16:9; usually the largest 16:9 area, moved
  or tightened only to cut off a logo, title, watermark, black bars or an edge HUD.
- A typical scene: the hero or an iconic place is fine and wanted. No title screen, menu, box art,
  key art, concept art or fan art.
- No game logo or title anywhere, no watermark, no copyright line; some HUD is acceptable when it is
  the game's normal look, but none that names the game.
- Prefer ≥ 960×540 output; never below 640×360 unless the source is a small 1990s frame.
- The Normal must not be the image a Pro shot of the same game was cut from, and not the game's
  cover (`cover_source_url`): the encyclopedia shows covers, a year page would give it away.
- Check the Normal is really this game — production has had a bus simulator as Journey's Normal,
  Aladdin as Myst's and a RAWG logo on Red Dead Redemption's. Report any wrong current shot you see.

## Which games

- The year is the first full release (Early Access does not count); check RAWG's year against the
  database and flag every mismatch. A remake on RAWG under the same name is the wrong game.
- Wii and GameCube games usually have only ~520 px shots on RAWG; skip them.
- Watch for RAWG lists where nearly every shot carries a logo or watermark (Spore, Frostpunk, Halo
  Infinite, Spiritfarer, Trine, Mass Effect, Worms): crop around it or skip the game.
