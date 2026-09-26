import type { BonusGuess, Game, GameState } from './types';
import { calculateRoundScore } from './scoring';
import {
	applyPlacement,
	findCorrectIndex,
	isPlacementCorrect,
	MAX_LIVES,
	runOutcome
} from './placement';

// A solo run is endless, so it gets the whole shuffled live pool in one request.
// A few hundred rows is small; revisit at about 1000 games (the API caps `count` there).
const POOL_FETCH_LIMIT = 1000;
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
		lives: MAX_LIVES,
		maxLives: MAX_LIVES,
		streak: 0,
		totalScore: 0,
		roundScores: [],
		bestStreak: 0,
		livesWonBack: 0,
		lifeRegained: false,
		endReason: null,
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
	const response = await fetch(`/api/games/random?count=${POOL_FETCH_LIMIT}`);
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
	gameState.livesWonBack = 0;
	gameState.lifeRegained = false;
	gameState.endReason = null;
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
	const isCorrect = isPlacementCorrect(gameState.timeline, game.year, slotIndex);
	const insertAt = isCorrect ? slotIndex : findCorrectIndex(gameState.timeline, game.year);
	gameState.timeline.splice(insertAt, 0, game);

	if (isCorrect) gameState.correctPlacements++;
	else gameState.wrongPlacements++;
	gameState.lastPlacementCorrect = isCorrect;
	const { lives, streak, bestStreak, livesWonBack, lifeRegained } = applyPlacement(
		{
			lives: gameState.lives,
			maxLives: gameState.maxLives,
			streak: gameState.streak,
			bestStreak: gameState.bestStreak,
			livesWonBack: gameState.livesWonBack
		},
		isCorrect
	);
	Object.assign(gameState, { lives, streak, bestStreak, livesWonBack, lifeRegained });

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
	gameState.lifeRegained = false;

	// Endless: only the last life or an empty pool ends a solo run.
	const outcome = runOutcome(gameState.lives, gameState.remainingGames.length);
	if (outcome) {
		gameState.endReason = outcome;
		gameState.phase = 'result';
		return;
	}

	gameState.currentGame = gameState.remainingGames[0];
	gameState.remainingGames = gameState.remainingGames.slice(1);
}

export async function restartGame(): Promise<void> {
	Object.assign(gameState, createInitialState());
	await startGame();
}

export function resetGame(): void {
	Object.assign(gameState, createInitialState());
}
