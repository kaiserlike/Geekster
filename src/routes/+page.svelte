<script lang="ts">
	import { getState } from '$lib/game.svelte';
	import WelcomeScreen from '$lib/components/WelcomeScreen.svelte';
	import GameScreen from '$lib/components/GameScreen.svelte';
	import ResultScreen from '$lib/components/ResultScreen.svelte';
	import { fade } from '$lib/motion';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const gameState = $derived(getState());

	// Each phase starts at the top: a run ends wherever its timeline had scrolled to, and the
	// result screen's "Menu" is often far down
	$effect(() => {
		void gameState.phase;
		window.scrollTo({ top: 0, behavior: 'instant' });
	});
</script>

{#if gameState.phase === 'welcome'}
	<div in:fade={{ duration: 300 }}>
		<WelcomeScreen proGate={data.proGate} />
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
