export interface Game {
	id: number;
	name: string;
	year: number;
	screenshot: string;
}

export type GamePhase = 'welcome' | 'playing' | 'result';

export interface BonusGuess {
	yearGuess: number | null;
	nameGuess: string | null;
}

export interface RoundScore {
	base: number;
	yearBonus: number;
	nameBonus: number;
	streakMultiplier: number;
	total: number;
	yearGuess: number | null;
	nameGuess: string | null;
	actualYear: number;
	actualName: string;
	placementCorrect: boolean;
}

export interface LeaderboardEntry {
	score: number;
	date: string;
	correctPlacements: number;
	wrongPlacements: number;
	livesRemaining: number;
	isWin: boolean;
	bestStreak: number;
}

export interface GlobalScoreEntry {
	id: number;
	playerName: string;
	totalScore: number;
	correctPlacements: number | null;
	wrongPlacements: number | null;
	bestStreak: number | null;
	difficulty: string | null;
	createdAt: string | null;
}

export interface GameState {
	phase: GamePhase;
	timeline: Game[];
	currentGame: Game | null;
	remainingGames: Game[];
	correctPlacements: number;
	wrongPlacements: number;
	lastPlacementCorrect: boolean | null;
	lastPlacedGameId: number | null;
	targetPlacements: number;
	lives: number;
	maxLives: number;
	streak: number;
	totalScore: number;
	roundScores: RoundScore[];
	bestStreak: number;
	pendingBonusGuess: boolean;
	loading: boolean;
	/** Translation key of the last load failure, or null. */
	error: string | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

/** A row of the admin game list. */
export interface AdminGame {
	id: number;
	name: string;
	slug: string;
	year: number;
	/** Draft games are hidden from players however many screenshots they have. */
	published: boolean;
	createdAt: string | null;
	screenshot: string | null;
	screenshotCount: number;
}

export interface AdminScreenshot {
	id: number;
	gameId: number;
	url: string;
	difficulty: Difficulty;
	isPrimary: boolean;
	createdAt: string | null;
}

/** Where a game sits in the admin list, for the detail page's prev/next. */
export interface AdminGameNeighbours {
	previous: { id: number; name: string } | null;
	next: { id: number; name: string } | null;
	/** 1-based index in the current list order; 0 when the game is filtered out. */
	position: number;
	total: number;
}

export interface AdminGameDetail {
	id: number;
	name: string;
	slug: string;
	year: number;
	published: boolean;
	createdAt: string | null;
	screenshots: AdminScreenshot[];
}

/** One screenshot candidate returned by the RAWG lookup. */
export interface RawgCandidate {
	id: number;
	name: string;
	released: string | null;
	year: number | null;
	screenshots: string[];
}
