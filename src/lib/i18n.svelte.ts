export type Locale = 'de' | 'en';

const STORAGE_KEY = 'geekster-locale';

function loadLocale(): Locale {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'en' || stored === 'de') return stored;
	}
	return 'de';
}

let current: Locale = $state(loadLocale());

export function getLocale(): Locale {
	return current;
}

/** A number in the shown language's notation: 2,340 in English, 2.340 in German */
export function formatNumber(n: number, fractionDigits = 0): string {
	return n.toLocaleString(current === 'de' ? 'de-DE' : 'en-US', {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits
	});
}

/** The streak multiplier as the HUD writes it: ×1.5, ×1,5 in German */
export function formatMultiplier(m: number): string {
	return `×${formatNumber(m, 1)}`;
}

export function setLocale(locale: Locale): void {
	current = locale;
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, locale);
	}
}

const translations = {
	// Layout
	'footer.poweredBy': { en: 'Game data powered by', de: 'Spieldaten bereitgestellt von' },

	// Welcome screen
	'welcome.subtitle': {
		en: 'How well do you know your video game history?',
		de: 'Wie gut kennst du die Geschichte der Videospiele?'
	},
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
	'welcome.rule4.post': { en: 'for bonus points', de: 'für Bonuspunkte' },
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
	'welcome.topScoresClassic': { en: 'Top Scores (Classic)', de: 'Bestenliste (Klassisch)' },
	'welcome.startGame': { en: 'Start Game', de: 'Spiel starten' },
	'welcome.loading': { en: 'Loading...', de: 'Laden...' },
	'welcome.topScores': { en: 'Top Scores', de: 'Bestenliste' },
	'welcome.topScoresPro': { en: 'Top Scores (Pro)', de: 'Bestenliste (Pro)' },

	// Mode choice (Sprint 8)
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

	// Game screen - HUD (Sprint 9c: the bar is the streak)
	'hud.label': { en: 'Run status', de: 'Laufstatus' },
	'hud.lives': {
		en: (n: number, of: number) => `${n} of ${of} lives`,
		de: (n: number, of: number) => `${n} von ${of} Leben`
	},
	'hud.streakCount': {
		en: (n: number) => `Streak ${n}`,
		de: (n: number) => `Serie ${n}`
	},
	// "10 in a row" at the start of a lap, "3 more in a row" during it
	'hud.toNextLife': {
		en: (n: number, fresh: boolean) => (fresh ? `${n} in a row` : `${n} more in a row`),
		de: (n: number, fresh: boolean) => (fresh ? `${n} in Folge` : `Noch ${n} in Folge`)
	},
	'hud.plusLife': { en: '+1 life', de: '+1 Leben' },
	'hud.multiplierUpTo': {
		en: (max: string) => `In a row, up to ${max}`,
		de: (max: string) => `In Folge bis ${max}`
	},
	'hud.multiplierMax': { en: 'Max multiplier', de: 'Maximaler Multiplikator' },
	// Only in the bar's accessible name: on screen, lives full is the absence of the socket
	'hud.livesFullSpoken': { en: 'all lives full', de: 'alle Leben voll' },
	// The progress bar's accessible name: the whole state in words
	'hud.meterLabel': {
		en: (streak: number, m: string, rest: string) => `Streak ${streak}, multiplier ${m}, ${rest}`,
		de: (streak: number, m: string, rest: string) => `Serie ${streak}, Multiplikator ${m}, ${rest}`
	},
	'hud.creditsShort': { en: 'CR', de: 'CR' },
	'hud.credits': {
		en: (n: string) => `${n} credits`,
		de: (n: string) => `${n} Credits`
	},

	// Placement feedback (the toast under the HUD)
	'toast.correct': { en: 'Correct', de: 'Richtig' },
	'toast.correctDetail': {
		en: (points: number, streak: number) => `+${points} · streak ${streak}`,
		de: (points: number, streak: number) => `+${points} · Serie ${streak}`
	},
	'toast.wrong': { en: 'Wrong', de: 'Falsch' },
	'toast.wrongDetail': {
		en: (name: string, year: number, livesLeft: number) =>
			`${name} is from ${year} · ${livesLeft > 0 ? '−1 life' : 'no lives left'}`,
		de: (name: string, year: number, livesLeft: number) =>
			`${name} ist von ${year} · ${livesLeft > 0 ? '−1 Leben' : 'keine Leben mehr'}`
	},
	'toast.inARow': {
		en: (n: number) => `${n} in a row`,
		de: (n: number) => `${n} in Folge`
	},
	'toast.lifeBack': { en: '+1 life won back', de: '+1 Leben zurückgewonnen' },
	'toast.livesFull': {
		en: (m: string) => `Lives already full · ${m} holds`,
		de: (m: string) => `Leben schon voll · ${m} bleibt`
	},

	// Timeline
	'timeline.heading': { en: 'Your timeline', de: 'Deine Zeitleiste' },
	'timeline.oldestFirst': { en: 'oldest at the top', de: 'älteste oben' },
	'timeline.decade': {
		en: (decade: number) => `${decade}s`,
		de: (decade: number) => `${decade}er`
	},
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
	'result.points': { en: 'points', de: 'Punkte' },
	'result.placements': { en: 'Placed', de: 'Platziert' },
	'result.mistakes': { en: 'Mistakes', de: 'Fehler' },
	'result.bestStreak': { en: 'Best streak', de: 'Beste Serie' },
	'result.livesWonBack': { en: 'Lives won back', de: 'Leben zurückgewonnen' },
	'result.yourTimeline': { en: 'Your Timeline', de: 'Deine Zeitleiste' },
	'result.playAgain': { en: 'Play Again', de: 'Nochmal spielen' },
	'result.mainMenu': { en: 'Main Menu', de: 'Hauptmenü' },

	// Leaderboard
	'leaderboard.title': { en: 'Leaderboard', de: 'Bestenliste' },
	'leaderboard.score': { en: 'Score', de: 'Punkte' },
	'leaderboard.result': { en: 'Result', de: 'Ergebnis' },
	'leaderboard.streak': { en: 'Streak', de: 'Serie' },
	'leaderboard.date': { en: 'Date', de: 'Datum' },
	'leaderboard.win': { en: 'Win', de: 'Sieg' },
	'leaderboard.loss': { en: 'Loss', de: 'Niederlage' },
	'leaderboard.placed': { en: 'Placed', de: 'Platziert' },
	'leaderboard.perfect': { en: 'Perfect', de: 'Perfekt' },
	'leaderboard.cleared': { en: 'Cleared', de: 'Geschafft' },
	'leaderboard.classic': { en: 'Classic', de: 'Klassisch' },
	'leaderboard.classicHint': {
		en: 'Runs from the old 10-game mode. Kept for the record, not comparable with endless runs.',
		de: 'Läufe aus dem alten 10-Spiele-Modus. Zur Erinnerung behalten, nicht mit endlosen Läufen vergleichbar.'
	},
	'leaderboard.local': { en: 'Local', de: 'Lokal' },
	'leaderboard.global': { en: 'Global', de: 'Global' },
	'leaderboard.player': { en: 'Player', de: 'Spieler' },
	'leaderboard.noGlobalScores': {
		en: 'No global scores yet',
		de: 'Noch keine globalen Punkte'
	},
	'leaderboard.globalUnavailable': {
		en: 'Global leaderboard unavailable',
		de: 'Globale Bestenliste nicht verfügbar'
	}
} as const;

type TranslationKey = keyof typeof translations;
type TranslationValue = string | ((...args: never[]) => string);

export function t(key: TranslationKey): TranslationValue {
	const entry = translations[key];
	return entry[current] as TranslationValue;
}

export function ts(key: TranslationKey): string {
	return t(key) as string;
}

export function tf<T extends (...args: never[]) => string>(key: TranslationKey): T {
	return t(key) as T;
}

/**
 * Translates a key that is only known at runtime — e.g. the error key stored in
 * the game state. Unknown keys are returned unchanged instead of throwing.
 */
export function tk(key: string): string {
	const entry = (translations as Record<string, Record<Locale, TranslationValue>>)[key];
	return entry ? (entry[current] as string) : key;
}
