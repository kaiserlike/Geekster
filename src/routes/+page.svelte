<script lang="ts">
	import { tick } from 'svelte';
	import { getState } from '$lib/game.svelte';
	import WelcomeScreen from '$lib/components/WelcomeScreen.svelte';
	import GameScreen from '$lib/components/GameScreen.svelte';
	import ResultScreen from '$lib/components/ResultScreen.svelte';
	import { fade } from '$lib/motion';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const gameState = $derived(getState());

	// Each phase starts at the top: a run ends wherever its timeline had scrolled to, and the
	// result screen's "Menu" is often far down. After the first, focus moves to the new screen's
	// heading (`tabindex="-1"`): the button that was pressed is gone, and focus would fall back to
	// the page, where a screen reader says nothing about the new screen
	let firstPhase = true;
	$effect(() => {
		void gameState.phase;
		window.scrollTo({ top: 0, behavior: 'instant' });
		if (firstPhase) {
			firstPhase = false;
			return;
		}
		tick().then(() =>
			document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true })
		);
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
