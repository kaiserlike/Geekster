import type { BonusGuess, Game, GameState } from './types';
import { calculateRoundScore } from './scoring';

const TARGET_PLACEMENTS = 10;
const MAX_LIVES = 3;
const GAMES_PER_ROUND = TARGET_PLACEMENTS + MAX_LIVES + 1;
// An anchor plus one placement is the smallest round that is playable at all.
const MIN_GAMES_PER_ROUND = 2;

function createInitialState(): GameState {
	return {
		phase: 'welcome',
		timeline: [],
		currentGame: null,
		remainingGames: [],
		correctPlacements: 0,
		wrongPlacements: 0,
		lastPlacementCorrect: null,
		lastPlacedGameId: null,
		targetPlacements: TARGET_PLACEMENTS,
		lives: MAX_LIVES,
		maxLives: MAX_LIVES,
		streak: 0,
		totalScore: 0,
		roundScores: [],
		bestStreak: 0,
		pendingBonusGuess: false,
		loading: false,
		error: null
	};
}

const gameState = $state<GameState>(createInitialState());

export function getState(): GameState {
	return gameState;
}

// The database is the single source of truth — there is deliberately no
// client-side fallback dataset. If the API cannot serve a round, there is no
// game: the player sees the error and retries.
async function fetchGames(): Promise<Game[]> {
	const response = await fetch(`/api/games/random?count=${GAMES_PER_ROUND}`);
	if (!response.ok) throw new Error(`/api/games/random responded ${response.status}`);

	const selectedGames: Game[] = await response.json();
	if (!Array.isArray(selectedGames) || selectedGames.length < MIN_GAMES_PER_ROUND) {
		throw new Error('Not enough games available for a round');
	}
	return selectedGames;
}

export async function startGame(): Promise<void> {
	gameState.loading = true;
	gameState.error = null;

	let selectedGames: Game[];
	try {
		selectedGames = await fetchGames();
	} catch (err) {
		console.error('Could not load a game round:', err);
		gameState.loading = false;
		gameState.phase = 'welcome';
		gameState.error = 'error.gamesUnavailable';
		return;
	}

	const anchor = selectedGames[0];
	const remaining = selectedGames.slice(1);

	gameState.phase = 'playing';
	gameState.timeline = [anchor];
	gameState.currentGame = remaining[0];
	gameState.remainingGames = remaining.slice(1);
	gameState.correctPlacements = 0;
	gameState.wrongPlacements = 0;
	gameState.lastPlacementCorrect = null;
	gameState.lastPlacedGameId = null;
	gameState.lives = MAX_LIVES;
	gameState.streak = 0;
	gameState.totalScore = 0;
	gameState.roundScores = [];
	gameState.bestStreak = 0;
	gameState.pendingBonusGuess = false;
	gameState.loading = false;
	gameState.error = null;
	lastPlacedGame = null;
}

// Stored reference to the game being guessed (needed for bonus guess after placement)
let lastPlacedGame: Game | null = null;

export function getLastPlacedGame(): Game | null {
	return lastPlacedGame;
}

export function placeGame(slotIndex: number): void {
	if (!gameState.currentGame) return;

	const game = gameState.currentGame;
	const isCorrect = isPlacementCorrect(game, slotIndex);

	if (isCorrect) {
		gameState.timeline.splice(slotIndex, 0, game);
		gameState.correctPlacements++;
		gameState.lastPlacementCorrect = true;
		gameState.streak++;
		if (gameState.streak > gameState.bestStreak) {
			gameState.bestStreak = gameState.streak;
		}
	} else {
		const correctIndex = findCorrectIndex(game);
		gameState.timeline.splice(correctIndex, 0, game);
		gameState.wrongPlacements++;
		gameState.lastPlacementCorrect = false;
		gameState.lives--;
		gameState.streak = 0;
	}

	// Set reveal state — card stays revealed until advanceToNextGame() is called
	gameState.lastPlacedGameId = game.id;
	lastPlacedGame = game;
	gameState.currentGame = null;
	gameState.pendingBonusGuess = true;
}

export function submitBonusGuess(guess: BonusGuess): void {
	if (!lastPlacedGame || !gameState.pendingBonusGuess) return;

	const roundScore = calculateRoundScore(
		gameState.lastPlacementCorrect === true,
		guess,
		lastPlacedGame.year,
		lastPlacedGame.name,
		gameState.streak
	);

	gameState.roundScores.push(roundScore);
	gameState.totalScore += roundScore.total;
	gameState.pendingBonusGuess = false;
}

export function skipBonusGuess(): void {
	submitBonusGuess({ yearGuess: null, nameGuess: null });
}

export function advanceToNextGame(): void {
	gameState.lastPlacedGameId = null;

	// Check game over (no lives left)
	if (gameState.lives <= 0) {
		gameState.phase = 'result';
		return;
	}

	// Check win condition
	if (gameState.correctPlacements >= TARGET_PLACEMENTS) {
		gameState.phase = 'result';
		return;
	}

	// Draw next game
	if (gameState.remainingGames.length > 0) {
		gameState.currentGame = gameState.remainingGames[0];
		gameState.remainingGames = gameState.remainingGames.slice(1);
	} else {
		// No more games — show result
		gameState.phase = 'result';
	}
}

function isPlacementCorrect(game: Game, slotIndex: number): boolean {
	const timeline = gameState.timeline;

	// Check left neighbor: game's year must be >= left neighbor's year
	if (slotIndex > 0 && game.year < timeline[slotIndex - 1].year) {
		return false;
	}

	// Check right neighbor: game's year must be <= right neighbor's year
	if (slotIndex < timeline.length && game.year > timeline[slotIndex].year) {
		return false;
	}

	return true;
}

function findCorrectIndex(game: Game): number {
	for (let i = 0; i < gameState.timeline.length; i++) {
		if (game.year <= gameState.timeline[i].year) {
			return i;
		}
	}
	return gameState.timeline.length;
}

export async function restartGame(): Promise<void> {
	Object.assign(gameState, createInitialState());
	await startGame();
}

export function resetGame(): void {
	Object.assign(gameState, createInitialState());
}
