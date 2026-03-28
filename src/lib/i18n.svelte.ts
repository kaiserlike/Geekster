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
	'welcome.rule5.pre': { en: 'Get', de: 'Platziere' },
	'welcome.rule5.games': { en: '10 games', de: '10 Spiele' },
	'welcome.rule5.post': { en: 'in the right order to win!', de: 'richtig, um zu gewinnen!' },
	'welcome.startGame': { en: 'Start Game', de: 'Spiel starten' },
	'welcome.topScores': { en: 'Top Scores', de: 'Bestenliste' },

	// Game screen - HUD
	'hud.life': { en: 'LIFE', de: 'LEBEN' },
	'hud.correct': { en: 'correct', de: 'richtig' },
	'hud.rupees': { en: 'RUPEES', de: 'RUBINE' },
	'hud.streak': { en: 'streak', de: 'Serie' },

	// Game screen - placement
	'game.dropOnSlot': { en: 'Drop on a slot below', de: 'Auf einen Slot ziehen' },
	'game.placeInTimeline': {
		en: 'Place this game in the timeline',
		de: 'Platziere dieses Spiel in der Zeitleiste'
	},
	'game.correct': { en: 'Correct!', de: 'Richtig!' },
	'game.wrong': { en: 'Wrong!', de: 'Falsch!' },
	'game.livesRemaining': {
		en: (n: number) => `${n} ${n === 1 ? 'life' : 'lives'} remaining`,
		de: (n: number) => `${n} ${n === 1 ? 'Leben' : 'Leben'} übrig`
	},
	'game.noLivesLeft': { en: 'No lives left!', de: 'Keine Leben mehr!' },
	'game.nextGame': { en: 'Next Game', de: 'Nächstes Spiel' },

	// Game screen - answer reveal
	'game.answer': { en: 'Answer', de: 'Antwort' },
	'game.yearGuess': { en: 'Year guess:', de: 'Jahr geraten:' },
	'game.nameGuess': { en: 'Name guess:', de: 'Name geraten:' },
	'game.exact': { en: 'Exact!', de: 'Exakt!' },
	'game.close': { en: 'Close!', de: 'Knapp!' },
	'game.nope': { en: 'Nope', de: 'Nein' },
	'game.offByYears': {
		en: (n: number) => `Off by ${n} ${n === 1 ? 'year' : 'years'}`,
		de: (n: number) => `${n} ${n === 1 ? 'Jahr' : 'Jahre'} daneben`
	},

	// Timeline slots
	'slot.dropHere': { en: 'Drop here', de: 'Hier ablegen' },
	'slot.placeHere': { en: 'Place here', de: 'Hier platzieren' },

	// Bonus guess panel
	'bonus.correctPlacement': { en: 'Correct placement!', de: 'Richtig platziert!' },
	'bonus.wrongPlacement': { en: 'Wrong placement', de: 'Falsch platziert' },
	'bonus.bonusGuess': { en: '— Bonus guess?', de: '— Bonusrunde?' },
	'bonus.releaseYear': { en: 'Release year', de: 'Erscheinungsjahr' },
	'bonus.gameName': { en: 'Game name', de: 'Spielname' },
	'bonus.reveal': { en: 'Reveal', de: 'Aufdecken' },
	'bonus.skip': { en: 'Skip', de: 'Überspringen' },

	// Score reveal
	'score.placement': { en: 'Placement', de: 'Platzierung' },
	'score.year': { en: 'Year', de: 'Jahr' },
	'score.name': { en: 'Name', de: 'Name' },
	'score.guessed': { en: 'guessed', de: 'geraten' },
	'score.actual': { en: 'actual', de: 'tatsächlich' },
	'score.skipped': { en: 'skipped', de: 'übersprungen' },
	'score.streakBonus': { en: 'Streak bonus', de: 'Serienbonus' },
	'score.roundTotal': { en: 'Round total', de: 'Rundensumme' },

	// Result screen
	'result.youWin': { en: 'You win!', de: 'Gewonnen!' },
	'result.gameOver': { en: 'Game Over', de: 'Verloren' },
	'result.points': { en: 'points', de: 'Punkte' },
	'result.correct': { en: 'correct', de: 'richtig' },
	'result.wrong': { en: 'wrong', de: 'falsch' },
	'result.life': { en: 'life', de: 'Leben' },
	'result.lives': { en: 'lives', de: 'Leben' },
	'result.remaining': { en: 'remaining', de: 'übrig' },
	'result.bestStreak': { en: 'best streak', de: 'beste Serie' },
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
	'leaderboard.loss': { en: 'Loss', de: 'Niederlage' }
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
