<script lang="ts">
	import { getState } from '$lib/game.svelte';
	import WelcomeScreen from '$lib/components/WelcomeScreen.svelte';
	import GameScreen from '$lib/components/GameScreen.svelte';
	import ResultScreen from '$lib/components/ResultScreen.svelte';
	import { fade } from 'svelte/transition';

	const gameState = $derived(getState());
</script>

{#if gameState.phase === 'welcome'}
	<div in:fade={{ duration: 300 }}>
		<WelcomeScreen />
	</div>
{:else if gameState.phase === 'playing'}
	<div in:fade={{ duration: 300 }}>
		<GameScreen />
	</div>
{:else if gameState.phase === 'result'}
	<div in:fade={{ duration: 300 }}>
		<ResultScreen />
	</div>
{/if}
