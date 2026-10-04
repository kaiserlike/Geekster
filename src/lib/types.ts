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

/**
 * A card as the referee hands it out before it is placed (Sprint 10b): its image and nothing
 * else. `id` is the card's place in the run (the anchor is 0), never the game's database id.
 */
export interface RunCard {
	id: number;
	screenshot: string;
}

/** A placed card's answer: what a guess is scored against, sent only once it is decided */
export interface CardAnswer {
	name: string;
	year: number;
}

/** `POST /api/runs` */
export interface RunStartResponse {
	runId: string;
	mode: Difficulty;
	/** The first card of the timeline, shown with its year */
	anchor: Game;
	card: RunCard;
	/** Cards still to come after `card` */
	remaining: number;
	lives: number;
	/** A Daily Run's number and UTC day; null for an endless run (10d) */
	daily: DailyInfo | null;
	/** An unfinished Daily Run of this device, picked up where it was left (10d); null otherwise */
	resume: RunResume | null;
}

/** Which Daily Run (10d) */
export interface DailyInfo {
	/** Daily Run #N */
	number: number;
	/** The UTC day, `2026-10-05` */
	date: string;
}

/**
 * Where an unfinished Daily Run stands when the same device starts it again. A bonus round left
 * open counts as skipped, and the run is at its next card
 */
export interface RunResume {
	/** Every card placed so far, the anchor included, by year */
	timeline: Game[];
	streak: number;
	bestStreak: number;
	livesWonBack: number;
	totalScore: number;
	correct: number;
	wrong: number;
	/** The cards placed wrong, by their id (their position in the run) */
	missedIds: number[];
}

/** `GET /api/daily?device=`: today's Daily Run for the welcome screen (10d) */
export interface DailyStatus {
	number: number;
	date: string;
	/** Until the next Daily Run, at midnight UTC */
	msUntilNext: number;
	/** Days in a row this device has finished a Daily Run */
	streak: number;
	/** This device's run today: none, unfinished, or its result */
	today: null | { over: false } | DailyResult;
}

export interface DailyResult {
	over: true;
	score: number;
	/** `o` a hit, `x` a miss, one per card */
	marks: string;
	/** Among today's players; null while it can't be worked out */
	rank: number | null;
	players: number;
}

/** `POST /api/runs/:id/place` */
export interface PlaceResponse {
	correct: boolean;
	/** Where the card goes in the timeline */
	insertAt: number;
	lives: number;
	streak: number;
	bestStreak: number;
	livesWonBack: number;
	lifeRegained: boolean;
	/** A miss only: the answer, and its (zero) round */
	answer: CardAnswer | null;
	roundScore: RoundScore | null;
	totalScore: number;
}

/** `POST /api/runs/:id/bonus` */
export interface BonusResponse {
	answer: CardAnswer;
	roundScore: RoundScore;
	totalScore: number;
	/** The guess arrived after the window closed and was scored as skipped */
	late: boolean;
}

/** `POST /api/runs/:id/next` */
export type NextResponse =
	| { over: false; card: RunCard; remaining: number }
	| { over: true; endReason: RunEnd; standing: Standing | null; marks: string };

/**
 * Where a device stands on the global board of a mode, all-time (Sprint 10c), as the last `next`
 * of a run answers it. Null when it could not be worked out: the score is written either way
 */
export interface Standing {
	/** The device's best run's rank among every player's best; ties share a rank */
	rank: number;
	/** Players on the board: devices, plus each score written without one */
	players: number;
	/** The device's best score in the mode, this run included */
	best: number;
	/** Its best before this run, or null if this was its first */
	previousBest: number | null;
	/** `allTime` for an endless run; `today` for a Daily Run, ranked among today's players (10d) */
	scope: 'allTime' | 'today';
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

/** A row of the global board: one player's best run in the mode and period (Sprint 10c) */
export interface GlobalScoreEntry {
	id: number;
	/** Ties share a rank */
	rank: number;
	playerName: string;
	totalScore: number;
	correctPlacements: number | null;
	bestStreak: number | null;
	createdAt: string | null;
	/** Written by the device that asked; the device id itself never leaves the server */
	mine: boolean;
}

/** `GET /api/scores`: one page of the board */
export interface GlobalBoardPage {
	rows: GlobalScoreEntry[];
	players: number;
	page: number;
	pages: number;
	/** The asking device's own row and the page it is on, wherever that is; null without one */
	me: (GlobalScoreEntry & { page: number }) | null;
}

export interface GameState {
	phase: GamePhase;
	/** Normal or Pro. Set when a run starts and kept by "Play Again". */
	mode: Difficulty;
	/**
	 * The cards placed so far, by year. A card placed correctly has no name or year until its
	 * bonus round is scored (`pendingBonusGuess`): it stands in with its neighbour's year
	 */
	timeline: Game[];
	/** The card to place: its image only (Sprint 10b) */
	currentGame: RunCard | null;
	/** Cards still to come after the current one */
	remaining: number;
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
	/** Where the run put this device on the global board (10c); null until the end, or unknown */
	standing: Standing | null;
	/** The Daily Run being played (10d); null for an endless run. Plays as Normal (`mode`) */
	daily: DailyInfo | null;
	/** One character per placed card at the end of a run, `o` right, `x` missed (10d) */
	marks: string;
	pendingBonusGuess: boolean;
	loading: boolean;
	/** A request to the referee is in flight: the round takes no input until it answers */
	pending: boolean;
	/**
	 * Translation key of a failed request during a run, or null. `error.runLost` means the run
	 * cannot go on; anything else may be retried
	 */
	runError: string | null;
	/** Translation key of the last load failure, or null. */
	error: string | null;
}

export type { Difficulty };

/** What a run is: an endless run in a tier, or the Daily Run (10d), which plays as Normal */
export type RunMode = Difficulty | 'daily';

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
