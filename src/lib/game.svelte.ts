import { invalidateAll } from '$app/navigation';
import type {
	BonusGuess,
	BonusResponse,
	Difficulty,
	Game,
	GameState,
	NextResponse,
	PlaceResponse,
	RunStartResponse
} from './types';
import { DEFAULT_DIFFICULTY } from './screenshotTiers';
import { MAX_LIVES } from './placement';

// Since Sprint 10b the server is the referee: it keeps the run's order, decides every placement
// and scores every bonus. This module is the client of its four calls (`/api/runs`, then
// `place`, `bonus`, `next` on the run) and keeps `GameState` in the shape the components read.
// A card arrives as an image; its name and year come only once it is placed (a miss) or its
// bonus round is scored. Nothing here scores or judges anything.

function createInitialState(mode: Difficulty = DEFAULT_DIFFICULTY): GameState {
	return {
		phase: 'welcome',
		mode,
		timeline: [],
		currentGame: null,
		remaining: 0,
		correctPlacements: 0,
		wrongPlacements: 0,
		lastPlacementCorrect: null,
		lastPlacedGameId: null,
		lives: MAX_LIVES,
		maxLives: MAX_LIVES,
		streak: 0,
		totalScore: 0,
		roundScores: [],
		missedIds: [],
		bestStreak: 0,
		livesWonBack: 0,
		lifeRegained: false,
		endReason: null,
		pendingBonusGuess: false,
		loading: false,
		pending: false,
		runError: null,
		error: null
	};
}

const gameState = $state<GameState>(createInitialState());

export function getState(): GameState {
	return gameState;
}

// The run's id: its only credential with the server, never shown
let runId: string | null = null;

/** The referee answered with an error */
class RunRequestError extends Error {
	constructor(readonly status: number) {
		super(`run request responded ${status}`);
	}
}

async function post<T>(path: string, body: unknown): Promise<T> {
	const response = await fetch(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!response.ok) throw new RunRequestError(response.status);
	return response.json();
}

// 404, 409 and 410 come back the same however often they are retried: the run is gone, moved
// on in another tab, or lost a game. Anything else (offline, a 503) is worth another try
const RUN_LOST = new Set([404, 409, 410]);

function failed(err: unknown): void {
	console.error('Run request failed:', err);
	gameState.runError =
		err instanceof RunRequestError && RUN_LOST.has(err.status) ? 'error.runLost' : 'error.runRetry';
}

/** One request at a time: the round takes no input while the referee decides */
async function exclusive<T>(request: () => Promise<T>): Promise<T | null> {
	if (gameState.pending) return null;
	gameState.pending = true;
	gameState.runError = null;
	try {
		return await request();
	} catch (err) {
		failed(err);
		return null;
	} finally {
		gameState.pending = false;
	}
}

/**
 * Starts a run in `mode` — the welcome screen passes the playable one, so a
 * closed Pro gate has already become Normal. Without it, the last run's mode.
 */
export async function startGame(mode: Difficulty = gameState.mode): Promise<void> {
	gameState.mode = mode;
	gameState.loading = true;
	gameState.error = null;

	let run: RunStartResponse;
	try {
		run = await post<RunStartResponse>('/api/runs', { mode });
	} catch (err) {
		// The database is the single source of truth — there is deliberately no client-side
		// fallback dataset. If the server cannot start a run, there is no game: the player sees
		// the error and retries.
		console.error('Could not start a run:', err);
		gameState.loading = false;
		gameState.phase = 'welcome';
		// 409: Pro closed between the welcome screen loading and this request
		if (err instanceof RunRequestError && err.status === 409) {
			// Re-run the page load: the gate comes back closed, the welcome screen
			// selects Normal, and "Try again" starts a Normal run.
			gameState.error = 'error.proUnavailable';
			await invalidateAll().catch(() => {
				// The load failed too; the message is already showing and a reload fixes it.
			});
		} else {
			gameState.error = 'error.gamesUnavailable';
		}
		return;
	}

	runId = run.runId;
	Object.assign(gameState, createInitialState(mode), {
		phase: 'playing',
		timeline: [run.anchor],
		currentGame: run.card,
		remaining: run.remaining,
		lives: run.lives
	});
	lastPlacedGame = null;
}

// The card just placed, as the timeline holds it (needed for the verdict and the reveal)
let lastPlacedGame: Game | null = null;

export function getLastPlacedGame(): Game | null {
	return lastPlacedGame;
}

/**
 * Places the card in `slotIndex`. `onPlaced` runs in the same tick as the state change, so the
 * screen moves on (verdict, reveal) before anything renders in between.
 */
export async function placeGame(slotIndex: number, onPlaced: () => void): Promise<void> {
	const card = gameState.currentGame;
	if (!card || !runId) return;
	const id = runId;

	const result = await exclusive(() =>
		post<PlaceResponse>(`/api/runs/${id}/place`, { position: card.id, slot: slotIndex })
	);
	if (!result || gameState.currentGame !== card) return;

	const { timeline } = gameState;
	// A hit keeps its answer for the bonus round: until then it stands in with its neighbour's
	// year, which keeps the timeline in order and is never shown (the row is hidden)
	const neighbour = timeline[result.insertAt - 1] ?? timeline[result.insertAt];
	const placed: Game = {
		id: card.id,
		screenshot: card.screenshot,
		name: result.answer?.name ?? '',
		year: result.answer?.year ?? neighbour.year
	};
	timeline.splice(result.insertAt, 0, placed);

	if (result.correct) gameState.correctPlacements++;
	else {
		gameState.wrongPlacements++;
		gameState.missedIds.push(card.id);
	}
	const { lives, streak, bestStreak, livesWonBack, lifeRegained, totalScore } = result;
	Object.assign(gameState, { lives, streak, bestStreak, livesWonBack, lifeRegained, totalScore });
	gameState.lastPlacementCorrect = result.correct;
	gameState.lastPlacedGameId = card.id;
	// The timeline's own (reactive) row, so the bonus round's answer fills both
	lastPlacedGame = timeline[result.insertAt];
	gameState.currentGame = null;
	// A miss is scored and revealed at once; a hit opens the bonus round
	if (result.roundScore) gameState.roundScores.push(result.roundScore);
	gameState.pendingBonusGuess = result.correct;
	onPlaced();
}

/** Sends the bonus guess (or a skip); `onScored` runs in the same tick as the reveal */
export async function submitBonusGuess(guess: BonusGuess, onScored: () => void): Promise<void> {
	const placed = lastPlacedGame;
	if (!placed || !gameState.pendingBonusGuess || !runId) return;
	const id = runId;

	const result = await exclusive(() =>
		post<BonusResponse>(`/api/runs/${id}/bonus`, { position: placed.id, ...guess })
	);
	if (!result || lastPlacedGame !== placed) return;

	// The card's answer, now that it is decided
	Object.assign(placed, result.answer);
	gameState.roundScores.push(result.roundScore);
	gameState.totalScore = result.totalScore;
	gameState.pendingBonusGuess = false;
	onScored();
}

export function skipBonusGuess(onScored: () => void): Promise<void> {
	return submitBonusGuess({ yearGuess: null, nameGuess: null }, onScored);
}

/** The next card, or the result: `onNext` runs in the same tick, before either renders */
export async function advanceToNextGame(onNext: () => void): Promise<void> {
	const placed = lastPlacedGame;
	if (!placed || !runId) return;
	const id = runId;

	const result = await exclusive(() =>
		post<NextResponse>(`/api/runs/${id}/next`, { position: placed.id })
	);
	if (!result || lastPlacedGame !== placed) return;

	gameState.lastPlacedGameId = null;
	gameState.lifeRegained = false;
	lastPlacedGame = null;

	// Endless: only the last life or an empty pool ends a solo run, and the server says which.
	// The score is on the global board already: the server wrote it with this answer
	if (result.over) {
		gameState.endReason = result.endReason;
		gameState.phase = 'result';
		runId = null;
	} else {
		gameState.currentGame = result.card;
		gameState.remaining = result.remaining;
	}
	onNext();
}

/** "Play Again": a new run in the same mode, skipping the welcome screen. */
export async function restartGame(): Promise<void> {
	const { mode } = gameState;
	Object.assign(gameState, createInitialState(mode));
	await startGame(mode);
}

/** "Main Menu". The welcome screen picks the mode again from the player's stored choice. */
export function resetGame(): void {
	runId = null;
	lastPlacedGame = null;
	Object.assign(gameState, createInitialState(gameState.mode));
}
