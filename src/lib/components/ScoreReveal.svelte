<script lang="ts">
	import type { RoundScore } from '$lib/types';
	import { fly } from 'svelte/transition';

	let { roundScore }: { roundScore: RoundScore } = $props();

	let showBase: boolean = $state(false);
	let showYear: boolean = $state(false);
	let showName: boolean = $state(false);
	let showMultiplier: boolean = $state(false);
	let showTotal: boolean = $state(false);

	$effect(() => {
		const timers = [
			setTimeout(() => (showBase = true), 200),
			setTimeout(() => (showYear = true), 500),
			setTimeout(() => (showName = true), 800),
			setTimeout(() => (showMultiplier = true), 1100),
			setTimeout(() => (showTotal = true), 1400)
		];

		return () => timers.forEach(clearTimeout);
	});
</script>

<div class="mx-auto w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900/80 p-4">
	<div class="space-y-1.5 text-sm">
		{#if showBase}
			<div
				class="flex justify-between {roundScore.base > 0 ? 'text-green-400' : 'text-gray-500'}"
				in:fly={{ x: -20, duration: 250 }}
			>
				<span>Placement</span>
				<span class="font-bold tabular-nums">+{roundScore.base}</span>
			</div>
		{/if}

		{#if showYear}
			<div
				class="flex justify-between {roundScore.yearBonus > 0 ? 'text-blue-400' : 'text-gray-500'}"
				in:fly={{ x: -20, duration: 250 }}
			>
				<span>
					Year
					{#if roundScore.yearGuess !== null}
						<span class="text-xs text-gray-500">
							(guessed {roundScore.yearGuess}, actual {roundScore.actualYear})
						</span>
					{:else}
						<span class="text-xs text-gray-500">(skipped)</span>
					{/if}
				</span>
				<span class="font-bold tabular-nums">+{roundScore.yearBonus}</span>
			</div>
		{/if}

		{#if showName}
			<div
				class="flex justify-between {roundScore.nameBonus > 0 ? 'text-pink-400' : 'text-gray-500'}"
				in:fly={{ x: -20, duration: 250 }}
			>
				<span>
					Name
					{#if roundScore.nameGuess}
						<span class="text-xs text-gray-500">(guessed "{roundScore.nameGuess}")</span>
					{:else}
						<span class="text-xs text-gray-500">(skipped)</span>
					{/if}
				</span>
				<span class="font-bold tabular-nums">+{roundScore.nameBonus}</span>
			</div>
		{/if}

		{#if showMultiplier && roundScore.streakMultiplier > 1}
			<div class="flex justify-between text-orange-400" in:fly={{ x: -20, duration: 250 }}>
				<span>Streak bonus</span>
				<span class="font-bold tabular-nums">&times;{roundScore.streakMultiplier.toFixed(1)}</span>
			</div>
		{/if}

		{#if showTotal}
			<div
				class="flex justify-between border-t border-gray-700 pt-1.5 text-white"
				in:fly={{ y: 10, duration: 300 }}
			>
				<span class="font-bold">Round total</span>
				<span class="text-lg font-bold text-purple-400 tabular-nums">
					+{roundScore.total.toLocaleString()}
				</span>
			</div>
		{/if}
	</div>
</div>
