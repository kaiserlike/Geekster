<script lang="ts">
	import { getState } from '$lib/game.svelte';
	import WelcomeScreen from '$lib/components/WelcomeScreen.svelte';
	import GameScreen from '$lib/components/GameScreen.svelte';
	import ResultScreen from '$lib/components/ResultScreen.svelte';

	const gameState = $derived(getState());
</script>

{#if gameState.phase === 'welcome'}
	<WelcomeScreen />
{:else if gameState.phase === 'playing'}
	<GameScreen />
{:else if gameState.phase === 'result'}
	<ResultScreen />
{/if}
