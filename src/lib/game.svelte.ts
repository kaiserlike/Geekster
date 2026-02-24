import type { BonusGuess, Game, GameState } from './types';
import { calculateRoundScore } from './scoring';
import gamesData from './data/games.json';

function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

const TARGET_PLACEMENTS = 10;
const MAX_LIVES = 3;

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
		pendingBonusGuess: false
	};
}

const state = $state<GameState>(createInitialState());

export function getState(): GameState {
	return state;
}

export function startGame(): void {
	const allGames = shuffle(gamesData as Game[]);
	// We need targetPlacements + maxLives + 1 games (1 anchor + 10 to place + 3 extra for wrong guesses)
	const selectedGames = allGames.slice(0, TARGET_PLACEMENTS + MAX_LIVES + 1);

	const anchor = selectedGames[0];
	const remaining = selectedGames.slice(1);

	state.phase = 'playing';
	state.timeline = [anchor];
	state.currentGame = remaining[0];
	state.remainingGames = remaining.slice(1);
	state.correctPlacements = 0;
	state.wrongPlacements = 0;
	state.lastPlacementCorrect = null;
	state.lastPlacedGameId = null;
	state.lives = MAX_LIVES;
	state.streak = 0;
	state.totalScore = 0;
	state.roundScores = [];
	state.bestStreak = 0;
	state.pendingBonusGuess = false;
	lastPlacedGame = null;
}

// Stored reference to the game being guessed (needed for bonus guess after placement)
let lastPlacedGame: Game | null = null;

export function getLastPlacedGame(): Game | null {
	return lastPlacedGame;
}

export function placeGame(slotIndex: number): void {
	if (!state.currentGame) return;

	const game = state.currentGame;
	const isCorrect = isPlacementCorrect(game, slotIndex);

	if (isCorrect) {
		state.timeline.splice(slotIndex, 0, game);
		state.correctPlacements++;
		state.lastPlacementCorrect = true;
		state.streak++;
		if (state.streak > state.bestStreak) {
			state.bestStreak = state.streak;
		}
	} else {
		const correctIndex = findCorrectIndex(game);
		state.timeline.splice(correctIndex, 0, game);
		state.wrongPlacements++;
		state.lastPlacementCorrect = false;
		state.lives--;
		state.streak = 0;
	}

	// Set reveal state — card stays revealed until advanceToNextGame() is called
	state.lastPlacedGameId = game.id;
	lastPlacedGame = game;
	state.currentGame = null;
	state.pendingBonusGuess = true;
}

export function submitBonusGuess(guess: BonusGuess): void {
	if (!lastPlacedGame || !state.pendingBonusGuess) return;

	const roundScore = calculateRoundScore(
		state.lastPlacementCorrect === true,
		guess,
		lastPlacedGame.year,
		lastPlacedGame.name,
		state.streak
	);

	state.roundScores.push(roundScore);
	state.totalScore += roundScore.total;
	state.pendingBonusGuess = false;
}

export function skipBonusGuess(): void {
	submitBonusGuess({ yearGuess: null, nameGuess: null });
}

export function advanceToNextGame(): void {
	state.lastPlacedGameId = null;

	// Check game over (no lives left)
	if (state.lives <= 0) {
		state.phase = 'result';
		return;
	}

	// Check win condition
	if (state.correctPlacements >= TARGET_PLACEMENTS) {
		state.phase = 'result';
		return;
	}

	// Draw next game
	if (state.remainingGames.length > 0) {
		state.currentGame = state.remainingGames[0];
		state.remainingGames = state.remainingGames.slice(1);
	} else {
		// No more games — show result
		state.phase = 'result';
	}
}

function isPlacementCorrect(game: Game, slotIndex: number): boolean {
	const timeline = state.timeline;

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
	for (let i = 0; i < state.timeline.length; i++) {
		if (game.year <= state.timeline[i].year) {
			return i;
		}
	}
	return state.timeline.length;
}

export function restartGame(): void {
	Object.assign(state, createInitialState());
	startGame();
}

export function resetGame(): void {
	Object.assign(state, createInitialState());
}
