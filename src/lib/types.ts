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
}
