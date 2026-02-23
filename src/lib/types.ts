export interface Game {
	id: number;
	name: string;
	year: number;
	screenshot: string;
}

export type GamePhase = 'welcome' | 'playing' | 'result';

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
}
