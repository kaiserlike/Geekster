// The game's text in both languages, and the one pure lookup. `i18n.svelte.ts` wraps it in the
// player's reactive language; server-rendered pages whose language is in the URL (the
// encyclopedia) reach it through the same wrapper, which reads the URL first. Never set a
// language on the server: module state there is shared by every request.

export type Locale = 'de' | 'en';

export const LOCALES: readonly Locale[] = ['de', 'en'];

export function isLocale(value: unknown): value is Locale {
	return value === 'de' || value === 'en';
}

export const translations = {
	// Layout
	'footer.impressum': { en: 'Legal notice', de: 'Impressum' },
	'footer.privacy': { en: 'Privacy', de: 'Datenschutz' },
	'footer.credit': {
		en: 'Screenshots © their respective rights holders, source:',
		de: 'Screenshots © der jeweiligen Rechteinhaber, Quelle:'
	},
	'footer.newTab': { en: '(opens in a new tab)', de: '(öffnet in einem neuen Tab)' },

	// Legal pages (the prose itself is per language in the route, not in this table)
	'legal.back': { en: 'Back to the game', de: 'Zurück zum Spiel' },
	'legal.updated': { en: 'Last updated', de: 'Stand' },

	// Welcome screen
	'welcome.pitch': { en: 'Put video games in order.', de: 'Bring Videospiele in Reihenfolge.' },
	'welcome.pitchDetail': {
		en: 'Place every screenshot on the timeline by its release year. One wrong call costs a life. The run lasts until all three are gone.',
		de: 'Leg jeden Screenshot nach seinem Erscheinungsjahr auf die Zeitleiste. Jeder Fehler kostet ein Leben. Der Lauf geht, bis alle drei weg sind.'
	},
	'welcome.back': { en: 'Welcome back.', de: 'Willkommen zurück.' },
	'welcome.yourBest': { en: 'Your best:', de: 'Dein Rekord:' },
	'welcome.startGame': { en: 'Start run', de: 'Run starten' },
	'welcome.loading': { en: 'Loading', de: 'Laden' },
	'welcome.howToPlay': { en: 'How to play', de: 'So wird gespielt' },
	'welcome.rule1': {
		en: 'You start with one game on the timeline showing its release year',
		de: 'Du startest mit einem Spiel auf der Zeitleiste, das sein Erscheinungsjahr zeigt'
	},
	'welcome.rule2': {
		en: 'Drag the new screenshot to the right spot, or tap a slot to place it',
		de: 'Ziehe den neuen Screenshot an die richtige Stelle oder tippe auf einen Slot'
	},
	'welcome.rule3.pre': { en: 'You have', de: 'Du hast' },
	'welcome.rule3.lives': { en: '3 lives', de: '3 Leben' },
	'welcome.rule3.post': {
		en: '— each wrong placement costs one',
		de: '— jede falsche Platzierung kostet eins'
	},
	'welcome.rule4.pre': {
		en: 'After each placement, guess the',
		de: 'Rate nach jeder Platzierung das'
	},
	'welcome.rule4.year': { en: 'year', de: 'Jahr' },
	'welcome.rule4.and': { en: 'and', de: 'und den' },
	'welcome.rule4.name': { en: 'name', de: 'Namen' },
	'welcome.rule4.post': {
		en: 'for bonus points. Missed the spot? The name still earns a consolation',
		de: 'für Bonuspunkte. Daneben gelegen? Für den Namen gibt es trotzdem ein Trostpflaster'
	},
	'welcome.rule5.pre': { en: 'Every', de: 'Jede' },
	'welcome.rule5.streak': {
		en: (n: number) => `streak of ${n}`,
		de: (n: number) => `${n}er-Serie`
	},
	'welcome.rule5.post': {
		en: (max: number) => `wins a life back, up to ${max}`,
		de: (max: number) => `bringt ein Leben zurück, bis zu ${max}`
	},
	'welcome.rule6': {
		en: 'The run lasts until your last life is gone, or until you have placed every game. How far can you get?',
		de: 'Der Lauf geht, bis dein letztes Leben weg ist oder du jedes Spiel platziert hast. Wie weit kommst du?'
	},

	// Mode choice (Sprint 8)
	// The Daily Run and the Endless Run on the welcome screen (10d)
	'daily.name': { en: 'Daily Run', de: 'Daily Run' },
	'daily.title': {
		en: (n: number) => `Daily Run #${n}`,
		de: (n: number) => `Daily Run #${n}`
	},
	'daily.short': {
		en: (n: number) => `Daily #${n}`,
		de: (n: number) => `Daily #${n}`
	},
	'daily.pitch': {
		en: '10 games, the same for everyone. One try.',
		de: '10 Spiele, für alle dieselben. Ein Versuch.'
	},
	'daily.play': { en: "Play today's Daily", de: 'Daily Run spielen' },
	'daily.continue': { en: "Continue today's Daily", de: 'Daily Run fortsetzen' },
	'daily.streak': {
		en: (n: number) => (n === 1 ? '1 day in a row' : `${n} days in a row`),
		de: (n: number) => (n === 1 ? '1 Tag in Folge' : `${n} Tage in Folge`)
	},
	'daily.place': {
		en: (rank: number, players: number) =>
			`Place ${rank} of ${players} ${players === 1 ? 'player' : 'players'} today`,
		de: (rank: number, players: number) =>
			`Platz ${rank} von ${players} ${players === 1 ? 'Spieler' : 'Spielern'} heute`
	},
	'daily.board': { en: "Today's board", de: 'Heutige Bestenliste' },
	'daily.next': {
		en: (time: string) => `Next Daily Run in ${time}`,
		de: (time: string) => `Nächster Daily Run in ${time}`
	},
	'daily.hoursMinutes': {
		en: (h: number, m: number) => (h > 0 ? `${h} h ${m} min` : `${m} min`),
		de: (h: number, m: number) => (h > 0 ? `${h} Std. ${m} Min.` : `${m} Min.`)
	},
	'daily.marks': {
		en: (hits: number, misses: number) => `${hits} placed right, ${misses} missed`,
		de: (hits: number, misses: number) => `${hits} richtig platziert, ${misses} falsch`
	},
	'daily.unavailable': {
		en: "Today's Daily Run isn't available right now.",
		de: 'Der heutige Daily Run ist gerade nicht verfügbar.'
	},
	'daily.loading': { en: "Loading today's Daily Run", de: 'Heutiger Daily Run wird geladen' },
	'daily.complete': { en: 'Daily Run complete!', de: 'Daily Run geschafft!' },
	'daily.perfect': { en: 'Perfect Daily Run!', de: 'Perfekter Daily Run!' },
	'endless.title': { en: 'Endless Run', de: 'Endless Run' },
	'endless.pitch': {
		en: 'Until your three lives are gone.',
		de: 'Bis deine drei Leben weg sind.'
	},
	'mode.legend': { en: 'Mode', de: 'Modus' },
	'mode.normal': { en: 'Normal', de: 'Normal' },
	'mode.pro': { en: 'Pro', de: 'Pro' },
	'mode.comingSoon': { en: 'Coming soon', de: 'Bald verfügbar' },
	'mode.normalHint': {
		en: 'Full screenshots. Bonus points up to 3 years off, and for part of a name.',
		de: 'Ganze Screenshots. Bonuspunkte bis 3 Jahre daneben und für einen Teil des Namens.'
	},
	'mode.proHint': {
		en: 'Details and close-ups. Bonus only for the exact year or one off, and the (almost) exact name.',
		de: 'Details und Ausschnitte. Bonus nur für das genaue Jahr oder eins daneben und den (fast) genauen Namen.'
	},
	'mode.proLocked': {
		en: (min: number) => `Pro opens once ${min} games have a Pro screenshot.`,
		de: (min: number) => `Pro öffnet, sobald ${min} Spiele einen Pro-Screenshot haben.`
	},

	// The first-run coach mark (9e), on the first card of the first run
	'coach.title': { en: 'Your first card', de: 'Deine erste Karte' },
	'coach.body': {
		en: (name: string, year: number) =>
			`${name} is from ${year}. Is this card older? Put it above. Newer? Below.`,
		de: (name: string, year: number) =>
			`${name} ist von ${year}. Ist diese Karte älter? Dann darüber. Neuer? Darunter.`
	},
	'coach.dismiss': { en: 'Close the tip', de: 'Tipp schließen' },

	// Load errors
	'error.title': {
		en: 'The game could not be started',
		de: 'Das Spiel konnte nicht gestartet werden'
	},
	'error.gamesUnavailable': {
		en: 'The game data is currently unavailable. Please try again in a moment.',
		de: 'Die Spieldaten sind gerade nicht verfügbar. Bitte versuche es gleich noch einmal.'
	},
	'error.proUnavailable': {
		en: 'Pro is not available right now. Normal is selected instead.',
		de: 'Pro ist gerade nicht verfügbar. Stattdessen ist Normal ausgewählt.'
	},
	'error.retry': { en: 'Try again', de: 'Erneut versuchen' },
	'error.dailyPlayed': {
		en: "You've played today's Daily Run already. A new one starts at midnight UTC.",
		de: 'Du hast den heutigen Daily Run schon gespielt. Ein neuer beginnt um Mitternacht UTC.'
	},
	// A request during a run failed (Sprint 10b: every move is checked by the server)
	'error.runRetry': {
		en: 'That did not reach the server. Check your connection and try again.',
		de: 'Das ist nicht beim Server angekommen. Prüfe deine Verbindung und versuch es noch einmal.'
	},
	'error.runLost': {
		en: 'This run cannot go on. It may be open in another tab. Start a new one from the menu.',
		de: 'Dieser Lauf kann nicht weitergehen. Vielleicht ist er in einem anderen Tab offen. Starte im Menü einen neuen.'
	},
	'game.checking': { en: 'Checking…', de: 'Wird geprüft …' },

	// Game screen - HUD
	'hud.label': { en: 'Run status', de: 'Laufstatus' },
	'hud.lives': {
		en: (n: number, of: number) => `${n} of ${of} lives`,
		de: (n: number, of: number) => `${n} von ${of} Leben`
	},
	'hud.streakCount': {
		en: (n: number) => `Streak ${n}`,
		de: (n: number) => `Serie ${n}`
	},
	// The Daily HUD: the card it is at, out of the Daily's ten
	'hud.card': { en: 'Card', de: 'Karte' },
	'hud.cardSpoken': {
		en: (n: number, of: number) => `Card ${n} of ${of}`,
		de: (n: number, of: number) => `Karte ${n} von ${of}`
	},
	// "10 in a row" at the start of a lap, "3 more in a row" during it
	'hud.toNextLife': {
		en: (n: number, fresh: boolean) => (fresh ? `${n} in a row` : `${n} more in a row`),
		de: (n: number, fresh: boolean) => (fresh ? `${n} in Folge` : `Noch ${n} in Folge`)
	},
	'hud.plusLife': { en: '+1 life', de: '+1 Leben' },
	// The endless HUD: the ladder's heading, and the charging heart's count beside the lives
	'hud.multiplier': { en: 'Multiplier', de: 'Multiplikator' },
	// Only in the ladder's accessible name: on screen, lives full is the absence of a charging heart
	'hud.livesFullSpoken': { en: 'all lives full', de: 'alle Leben voll' },
	// The ladder's accessible name: the whole state in words
	'hud.meterLabel': {
		en: (streak: number, m: string, rest: string) => `Streak ${streak}, multiplier ${m}, ${rest}`,
		de: (streak: number, m: string, rest: string) => `Serie ${streak}, Multiplikator ${m}, ${rest}`
	},
	'hud.creditsShort': { en: 'CR', de: 'CR' },
	'hud.credits': {
		en: (n: string) => `${n} credits`,
		de: (n: string) => `${n} Credits`
	},

	// Placement feedback: the card turned into its verdict, and the live region
	'verdict.correct': { en: 'Correct', de: 'Richtig' },
	'verdict.correctDetail': {
		en: (points: number, streak: number) => `+${points} · streak ${streak}`,
		de: (points: number, streak: number) => `+${points} · Serie ${streak}`
	},
	'verdict.wrong': { en: 'Wrong', de: 'Falsch' },
	'verdict.wrongDetail': {
		en: (name: string, year: number, livesLeft: number) =>
			`${name} is from ${year} · ${livesLeft > 0 ? '−1 life' : 'no lives left'}`,
		de: (name: string, year: number, livesLeft: number) =>
			`${name} ist von ${year} · ${livesLeft > 0 ? '−1 Leben' : 'keine Leben mehr'}`
	},
	'verdict.wrongYear': {
		en: (year: number, livesLeft: number) =>
			`It is from ${year} · ${livesLeft > 0 ? '−1 life' : 'no lives left'}`,
		de: (year: number, livesLeft: number) =>
			`Es ist von ${year} · ${livesLeft > 0 ? '−1 Leben' : 'keine Leben mehr'}`
	},
	'consolation.title': { en: 'Name known', de: 'Name gewusst' },
	'consolation.detail': {
		en: (name: string) => `Consolation for “${name}”`,
		de: (name: string) => `Trostpflaster für „${name}“`
	},
	'verdict.inARow': {
		en: (n: number) => `${n} in a row`,
		de: (n: number) => `${n} in Folge`
	},
	'verdict.lifeBack': { en: '+1 life won back', de: '+1 Leben zurückgewonnen' },
	'verdict.livesFull': {
		en: (m: string) => `Lives already full · ${m} holds`,
		de: (m: string) => `Leben schon voll · ${m} bleibt`
	},

	// Timeline
	'timeline.heading': { en: 'Your timeline', de: 'Deine Zeitleiste' },
	'timeline.oldestFirst': { en: 'oldest at the top', de: 'älteste oben' },
	// The card just placed, while its name is still the bonus question
	'timeline.decadeShort': {
		en: (decade: number) => `${String(decade).slice(2)}s`,
		de: (decade: number) => `${String(decade).slice(2)}er`
	},
	'timeline.justPlaced': { en: 'Just placed', de: 'Gerade platziert' },
	'timeline.youPutItHere': { en: 'You put it here', de: 'Hier hast du sie hingelegt' },
	'timeline.belongsHere': { en: 'Belongs here', de: 'Gehört hierher' },
	'timeline.scrolling': { en: 'Scrolling', de: 'Scrollt' },
	'timeline.ruler': { en: 'Jump to a decade', de: 'Zu einem Jahrzehnt springen' },
	'timeline.rulerDecade': {
		en: (decade: number, count: number) => `${decade}s, ${count} ${count === 1 ? 'card' : 'cards'}`,
		de: (decade: number, count: number) =>
			`${decade}er, ${count} ${count === 1 ? 'Karte' : 'Karten'}`
	},

	// The card to place
	'card.incoming': { en: 'Incoming — place it', de: 'Neue Karte — platziere sie' },
	'card.number': {
		en: (n: number) => `Card ${n}`,
		de: (n: number) => `Karte ${n}`
	},
	'card.alt': { en: 'The game to place', de: 'Das Spiel zum Platzieren' },
	'card.dragLabel': {
		en: 'The game to place. Drag it onto a slot in the timeline, or use a slot button',
		de: 'Das Spiel zum Platzieren. Zieh es auf einen Slot der Zeitleiste oder nimm einen Slot-Button'
	},
	'card.hintTouch': {
		en: 'Drag it onto a slot, or tap one.',
		de: 'Zieh sie auf einen Slot oder tipp einen an.'
	},
	'card.hintPointer': {
		en: 'Drag it onto a slot, or click one.',
		de: 'Zieh sie auf einen Slot oder klick einen an.'
	},
	'card.keys': { en: 'Keyboard:', de: 'Tastatur:' },
	'card.keysToSlot': { en: 'to a slot,', de: 'zu einem Slot,' },
	'card.keysToPlace': { en: 'to place.', de: 'zum Platzieren.' },
	'card.zoom': { en: 'Show full size', de: 'In voller Größe zeigen' },
	'card.zoomClose': { en: 'Close', de: 'Schließen' },
	'card.zoomHint': {
		en: 'Press Escape or click beside the image to close it.',
		de: 'Escape oder ein Klick neben das Bild schließt es.'
	},
	'card.dragging': { en: 'Dragging', de: 'Ziehen' },
	'card.draggingHint': {
		en: 'Drop it on a slot, or let go to cancel',
		de: 'Leg sie auf einen Slot, oder lass los zum Abbrechen'
	},
	// The playing screen's heading, for a screen reader only: the screen shows the card instead
	'game.heading': { en: 'Your run', de: 'Dein Run' },
	'game.nextGame': { en: 'Next card', de: 'Nächste Karte' },
	'game.showResult': { en: 'Result', de: 'Ergebnis' },
	'game.answer': { en: 'Answer', de: 'Antwort' },

	// Timeline slots
	'slot.dropHere': { en: 'Drop here', de: 'Hier ablegen' },
	'slot.placeHere': { en: 'Place here', de: 'Hier platzieren' },
	// A slot's accessible name is "Place here, " + one of these (the visible text comes first)
	'slot.first': {
		en: (name: string, year: number) => `before ${name} (${year})`,
		de: (name: string, year: number) => `vor ${name} (${year})`
	},
	'slot.between': {
		en: (a: string, ay: number, b: string, by: number) => `between ${a} (${ay}) and ${b} (${by})`,
		de: (a: string, ay: number, b: string, by: number) => `zwischen ${a} (${ay}) und ${b} (${by})`
	},
	'slot.last': {
		en: (name: string, year: number) => `after ${name} (${year})`,
		de: (name: string, year: number) => `nach ${name} (${year})`
	},

	// Bonus guess panel
	'bonus.round': { en: 'Bonus round', de: 'Bonusrunde' },
	'bonus.seconds': {
		en: (n: number) => `${n} s`,
		de: (n: number) => `${n} s`
	},
	'bonus.secondsLeft': {
		en: (n: number) => `${n} seconds left`,
		de: (n: number) => `Noch ${n} Sekunden`
	},
	'bonus.releaseYear': { en: 'Release year', de: 'Erscheinungsjahr' },
	'bonus.gameName': { en: 'Game name', de: 'Spielname' },
	'bonus.yearPlaceholder': { en: 'e.g. 2004', de: 'z. B. 2004' },
	'bonus.namePlaceholder': { en: 'Title', de: 'Titel' },
	'bonus.hint': {
		en: (year: number, name: number) =>
			`Up to +${year} for the year, +${name} for the name. Both optional.`,
		de: (year: number, name: number) =>
			`Bis zu +${year} für das Jahr, +${name} für den Namen. Beides freiwillig.`
	},
	'bonus.consolation': { en: 'Consolation', de: 'Trostpflaster' },
	'bonus.consolationHint': {
		en: (name: number) => `Know the game anyway? Up to +${name} for the name.`,
		de: (name: number) => `Kennst du das Spiel trotzdem? Bis zu +${name} für den Namen.`
	},
	'bonus.reveal': { en: 'Reveal', de: 'Aufdecken' },
	'bonus.skip': { en: 'Skip', de: 'Überspringen' },

	// Score reveal
	'score.placement': { en: 'Placement', de: 'Platzierung' },
	'score.year': { en: 'Year', de: 'Jahr' },
	'score.name': { en: 'Name', de: 'Name' },
	'score.exact': { en: 'exact', de: 'exakt' },
	'score.close': { en: 'close', de: 'knapp' },
	'score.nope': { en: 'nope', de: 'daneben' },
	'score.offBy': {
		en: (n: number) => `${n} off`,
		de: (n: number) => `${n} daneben`
	},
	'score.skipped': { en: 'skipped', de: 'übersprungen' },
	'score.streak': {
		en: (n: number) => `Streak ${n}`,
		de: (n: number) => `Serie ${n}`
	},
	'score.round': { en: 'Round', de: 'Runde' },

	// Result screen
	'result.gameOver': { en: 'Game Over', de: 'Game Over' },
	'result.perfectRun': { en: 'Perfect run!', de: 'Perfekter Lauf!' },
	'result.poolCleared': { en: 'Pool cleared!', de: 'Alle Spiele geschafft!' },
	'result.perfectRunHint': {
		en: 'Every game we have, placed without a single mistake.',
		de: 'Jedes Spiel, das wir haben, ohne einen einzigen Fehler platziert.'
	},
	'result.poolClearedHint': {
		en: 'You placed every game we have. We need more games!',
		de: 'Du hast jedes Spiel platziert, das wir haben. Wir brauchen mehr Spiele!'
	},
	'result.personalBest': { en: 'New personal best', de: 'Neuer persönlicher Rekord' },
	'result.rank': {
		en: (n: number) => `#${n} of your runs`,
		de: (n: number) => `Platz ${n} deiner Läufe`
	},
	'result.globalRank': {
		en: (rank: number, players: number) => `#${rank} of ${players} worldwide`,
		de: (rank: number, players: number) => `Platz ${rank} von ${players} weltweit`
	},
	'result.yourBest': {
		en: (score: string) => `Your best: ${score} CR`,
		de: (score: string) => `Dein Rekord: ${score} CR`
	},
	'result.playingAs': {
		en: (name: string) => `On the board as ${name}`,
		de: (name: string) => `Auf der Bestenliste als ${name}`
	},
	'result.placements': { en: 'Placed', de: 'Platziert' },
	'result.mistakes': { en: 'Misses', de: 'Fehler' },
	'result.bestShort': { en: 'Best', de: 'Serie' },
	'result.livesBackShort': { en: 'Back', de: 'zurück' },
	'result.bestStreak': { en: 'Best streak', de: 'Beste Serie' },
	'result.livesWonBack': { en: 'Lives won back', de: 'Leben zurückgewonnen' },
	'result.namesKnown': { en: 'Names known', de: 'Namen erkannt' },
	'result.yearsExact': { en: 'Years exact', de: 'Jahre exakt' },
	'result.of': { en: 'of', de: 'von' },
	'result.yourTimeline': {
		en: (n: number) => `Your timeline · ${n}`,
		de: (n: number) => `Deine Zeitleiste · ${n}`
	},
	'result.missed': { en: 'misplaced', de: 'falsch platziert' },
	'result.missedLegend': { en: '✗ = misplaced', de: '✗ = falsch platziert' },
	'result.more': {
		en: (n: number) => `+ ${n} more`,
		de: (n: number) => `+ ${n} weitere`
	},
	'result.playAgain': { en: 'Play again', de: 'Nochmal' },
	'result.mainMenu': { en: 'Menu', de: 'Menü' },

	// Leaderboard
	'leaderboard.title': { en: 'Leaderboard', de: 'Bestenliste' },
	'leaderboard.local': { en: 'This device', de: 'Gerät' },
	'leaderboard.new': { en: 'New', de: 'Neu' },
	'leaderboard.placedCount': {
		en: (n: number) => `${n} placed`,
		de: (n: number) => `${n} platziert`
	},
	'leaderboard.empty': {
		en: 'No runs yet. Your first one lands here.',
		de: 'Noch keine Läufe. Dein erster landet hier.'
	},
	'leaderboard.loading': {
		en: 'Loading the global leaderboard',
		de: 'Globale Bestenliste wird geladen'
	},
	'leaderboard.win': { en: 'Win', de: 'Sieg' },
	'leaderboard.loss': { en: 'Loss', de: 'Niederlage' },
	'leaderboard.perfect': { en: 'Perfect', de: 'Perfekt' },
	'leaderboard.cleared': { en: 'Cleared', de: 'Geschafft' },
	'leaderboard.classic': { en: 'Classic', de: 'Klassisch' },
	'leaderboard.classicHint': {
		en: 'Runs from the old 10-game mode. Kept for the record, not comparable with endless runs.',
		de: 'Läufe aus dem alten 10-Spiele-Modus. Zur Erinnerung behalten, nicht mit endlosen Läufen vergleichbar.'
	},
	'leaderboard.global': { en: 'Global', de: 'Global' },
	'leaderboard.noGlobalScores': {
		en: 'No global scores yet',
		de: 'Noch keine globalen Punkte'
	},
	'leaderboard.globalUnavailable': {
		en: 'Global leaderboard unavailable',
		de: 'Globale Bestenliste nicht verfügbar'
	},
	'leaderboard.seeAll': { en: 'Full leaderboard', de: 'Ganze Bestenliste' },
	'leaderboard.you': { en: 'You', de: 'Du' },

	// The display name (10c)
	'name.title': { en: 'Put your name on the board', de: 'Trag dich in die Bestenliste ein' },
	'name.hint': {
		en: 'This run is on the global board as "Anonymous". Pick a name for it and your next runs.',
		de: 'Dieser Lauf steht als „Anonymous“ in der globalen Bestenliste. Wähl einen Namen dafür und für deine nächsten Läufe.'
	},
	'name.label': { en: 'Display name', de: 'Anzeigename' },
	'name.rules': {
		en: '2–20 characters: letters, digits, space, . _ -',
		de: '2–20 Zeichen: Buchstaben, Ziffern, Leerzeichen, . _ -'
	},
	'name.save': { en: 'Save', de: 'Speichern' },
	'name.notNow': { en: 'Not now', de: 'Jetzt nicht' },
	'name.saved': {
		en: (name: string) => `Saved. You're on the board as ${name}.`,
		de: (name: string) => `Gespeichert. Du stehst als ${name} in der Bestenliste.`
	},
	'name.short': { en: 'At least 2 characters', de: 'Mindestens 2 Zeichen' },
	'name.long': { en: 'At most 20 characters', de: 'Höchstens 20 Zeichen' },
	'name.chars': {
		en: 'Only letters, digits, spaces and . _ -',
		de: 'Nur Buchstaben, Ziffern, Leerzeichen und . _ -'
	},
	'name.blocked': { en: 'Please pick another name', de: 'Bitte wähl einen anderen Namen' },
	'name.failed': {
		en: "Couldn't save it. Try again.",
		de: 'Das hat nicht geklappt. Versuch es nochmal.'
	},

	// /leaderboard (10c)
	'board.mode': { en: 'Mode', de: 'Modus' },
	'board.daily': { en: 'Daily', de: 'Daily' },
	'board.todayHint': {
		en: "Today's Daily Run, since 00:00 UTC. One try per player.",
		de: 'Der heutige Daily Run, seit 00:00 UTC. Ein Versuch pro Spieler.'
	},
	'board.today': { en: 'Today', de: 'Heute' },
	'board.period': { en: 'Period', de: 'Zeitraum' },
	'board.allTime': { en: 'All time', de: 'Gesamt' },
	'board.week': { en: 'This week', de: 'Diese Woche' },
	'board.weekHint': {
		en: 'Since Monday, 00:00 UTC. One row per player: their best run.',
		de: 'Seit Montag, 00:00 UTC. Eine Zeile pro Spieler: der beste Lauf.'
	},
	'board.allTimeHint': {
		en: 'One row per player: their best run.',
		de: 'Eine Zeile pro Spieler: der beste Lauf.'
	},
	'board.players': {
		en: (n: number) => (n === 1 ? '1 player' : `${n} players`),
		de: (n: number) => (n === 1 ? '1 Spieler' : `${n} Spieler`)
	},
	'board.emptyWeek': { en: 'No scores this week yet', de: 'Diese Woche noch keine Punkte' },
	'board.previous': { en: 'Previous', de: 'Zurück' },
	'board.next': { en: 'Next', de: 'Weiter' },
	'board.page': {
		en: (page: number, pages: number) => `Page ${page} of ${pages}`,
		de: (page: number, pages: number) => `Seite ${page} von ${pages}`
	},
	'board.goToPage': {
		en: (page: number) => `Your row, page ${page}`,
		de: (page: number) => `Deine Zeile, Seite ${page}`
	},
	'board.yourName': { en: 'Your name', de: 'Dein Name' },
	'board.nameHint': {
		en: 'Used for your next runs. Scores already on the board keep the name they were saved with.',
		de: 'Gilt für deine nächsten Läufe. Ergebnisse in der Bestenliste behalten den Namen, mit dem sie gespeichert wurden.'
	},
	'board.noName': {
		en: 'No name yet: your runs go on the board as "Anonymous".',
		de: 'Noch kein Name: deine Läufe stehen als „Anonymous“ in der Bestenliste.'
	},
	'board.change': { en: 'Change', de: 'Ändern' },
	'board.cancel': { en: 'Cancel', de: 'Abbrechen' },

	// Sharing a result (10e): the shared text itself is in src/lib/share.ts
	'share.button': { en: 'Share result', de: 'Ergebnis teilen' },
	'share.label': { en: 'Share your result', de: 'Ergebnis teilen' },
	'share.copied': {
		en: 'Copied. Paste it anywhere.',
		de: 'Kopiert. Füg es ein, wo du willst.'
	},
	'share.download': { en: 'Download image', de: 'Bild herunterladen' },
	'share.failed': {
		en: "Couldn't copy. Here is the text:",
		de: 'Kopieren ging nicht. Hier ist der Text:'
	},

	// The encyclopedia (Milestone 12): server-rendered in the URL's language
	'years.title': { en: 'Video games by year', de: 'Videospiele nach Jahr' },
	'years.description': {
		en: 'What happened in video games, year by year: the games, the consoles, the technology, with our own notes and fun facts.',
		de: 'Was in der Welt der Videospiele passiert ist, Jahr für Jahr: die Spiele, die Konsolen, die Technik, mit eigenen Notizen und Fun Facts.'
	},
	'years.decade': {
		en: (decade: number) => `The ${decade}s`,
		de: (decade: number) => `Die ${decade}er`
	},
	'years.gamesCount': {
		en: (n: number) => (n === 1 ? '1 game to play' : `${n} games to play`),
		de: (n: number) => (n === 1 ? '1 Spiel zum Spielen' : `${n} Spiele zum Spielen`)
	},
	'years.empty': {
		en: 'The first years are being written. Come back soon.',
		de: 'Die ersten Jahre entstehen gerade. Schau bald wieder vorbei.'
	}
} as const;

export type TranslationKey = keyof typeof translations;
export type TranslationValue = string | ((...args: never[]) => string);

/** A key's text, or text function, in one language */
export function translate(locale: Locale, key: TranslationKey): TranslationValue {
	return translations[key][locale] as TranslationValue;
}

/** A key known only at runtime; unknown keys come back unchanged instead of throwing */
export function translateKey(locale: Locale, key: string): string {
	const entry = (translations as Record<string, Record<Locale, TranslationValue>>)[key];
	return entry ? (entry[locale] as string) : key;
}
