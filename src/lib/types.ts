import type { RunEnd } from './placement';
import type { Difficulty } from './screenshotTiers';

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

/** A local leaderboard row for an endless solo run (Sprint 8). */
export interface LeaderboardEntry {
	score: number;
	date: string;
	correctPlacements: number;
	wrongPlacements: number;
	bestStreak: number;
	livesWonBack: number;
	endReason: RunEnd;
}

/**
 * A row from the old 10-game mode. Not comparable with endless runs, so these are
 * kept read-only under their own key and shown as "Classic".
 */
export interface ClassicLeaderboardEntry {
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
	/** Normal or Pro. Set when a run starts and kept by "Play Again". */
	mode: Difficulty;
	timeline: Game[];
	currentGame: Game | null;
	remainingGames: Game[];
	correctPlacements: number;
	wrongPlacements: number;
	lastPlacementCorrect: boolean | null;
	lastPlacedGameId: number | null;
	lives: number;
	maxLives: number;
	streak: number;
	totalScore: number;
	roundScores: RoundScore[];
	/** The games placed wrong this run, by id: the result screen marks them in the timeline. */
	missedIds: number[];
	bestStreak: number;
	/** Lives given back by streaks of 10 during this run. */
	livesWonBack: number;
	/** True from the placement that gave a life back until the next card — drives the animation. */
	lifeRegained: boolean;
	/** Why the run ended; null while it is still going. */
	endReason: RunEnd | null;
	pendingBonusGuess: boolean;
	loading: boolean;
	/** Translation key of the last load failure, or null. */
	error: string | null;
}

export type { Difficulty };

/** A row of the admin game list. */
export interface AdminGame {
	id: number;
	name: string;
	slug: string;
	year: number;
	/** Draft games are hidden from players however many screenshots they have. */
	published: boolean;
	createdAt: string | null;
	/** The primary shot of each tier, or null when that tier is empty. */
	normalShot: string | null;
	proShot: string | null;
	screenshotCount: number;
}

export interface AdminScreenshot {
	id: number;
	gameId: number;
	url: string;
	difficulty: Difficulty;
	isPrimary: boolean;
	/** The rawg.io image a RAWG import came from; null for an uploaded file. */
	sourceUrl: string | null;
	/** The 16:9 area kept, in the source image's pixels; null before Sprint 8 slice 3. */
	crop: CropRect | null;
	createdAt: string | null;
}

/** Width and height of an image, in pixels. */
export interface PixelSize {
	width: number;
	height: number;
}

/** A rectangle in an image's own pixels — the part of a screenshot that is kept. */
export interface CropRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * A crop together with the size of the image it was drawn on. The server needs
 * both to check the rectangle, because it never sees the original image.
 */
export interface CropSelection {
	crop: CropRect;
	source: PixelSize;
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

/** One option of `ui/SegmentedControl.svelte` (Sprint 9b). */
export interface SegmentOption<V extends string> {
	value: V;
	label: string;
	/** Selected colour: accent (Normal, the default) or pink (Pro's mode colour) */
	tone?: 'accent' | 'pink';
	disabled?: boolean;
	/** A small pink badge under the label, e.g. COMING SOON on a locked option */
	badge?: string;
	/** An element id that explains a disabled option */
	describedBy?: string;
}

/** Where a round is, between one card and the next (GameScreen). A miss skips `verdict` and `bonus` */
export type RoundStage = 'card' | 'verdict' | 'bonus' | 'reveal';

/** What a placement did: on the card (`PlacementResult`) and in the live region */
export interface PlacementVerdict {
	/** correct ✓ turquoise, wrong ✗ red, life ♥ pink, streak ★ turquoise (10 in a row, lives full) */
	tone: 'correct' | 'wrong' | 'life' | 'streak';
	title: string;
	detail?: string;
}
