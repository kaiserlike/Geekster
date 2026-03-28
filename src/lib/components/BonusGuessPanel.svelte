<script lang="ts">
	import { fly } from 'svelte/transition';
	import { ts } from '$lib/i18n.svelte';

	let {
		onSubmit,
		onSkip,
		placementCorrect
	}: {
		onSubmit: (yearGuess: number | null, nameGuess: string | null) => void;
		onSkip: () => void;
		placementCorrect: boolean;
	} = $props();

	let yearInput: string = $state('');
	let nameInput: string = $state('');
	let timeLeft: number = $state(30);
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let yearInputEl: HTMLInputElement | undefined = $state(undefined);

	$effect(() => {
		if (yearInputEl) {
			yearInputEl.focus();
		}

		timerInterval = setInterval(() => {
			timeLeft--;
			if (timeLeft <= 0) {
				handleSubmit();
			}
		}, 1000);

		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		};
	});

	function handleSubmit() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		const yearStr = String(yearInput).trim();
		const nameGuess = nameInput.trim() || null;
		const yearGuess = yearStr ? parseInt(yearStr, 10) : null;
		onSubmit(yearGuess !== null && !isNaN(yearGuess) ? yearGuess : null, nameGuess);
	}

	function handleSkip() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		onSkip();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSubmit();
		}
	}
</script>

<div
	class="mx-auto w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-4"
	in:fly={{ y: 30, duration: 300 }}
>
	<div class="mb-3 flex items-center justify-between">
		<p class="text-sm font-semibold {placementCorrect ? 'text-green-400' : 'text-red-400'}">
			{placementCorrect ? ts('bonus.correctPlacement') : ts('bonus.wrongPlacement')}
			<span class="ml-1 text-gray-400">{ts('bonus.bonusGuess')}</span>
		</p>
		<span
			class="rounded-full px-2 py-0.5 text-xs font-bold tabular-nums {timeLeft <= 5
				? 'bg-red-900 text-red-300'
				: 'bg-gray-800 text-gray-400'}"
		>
			{timeLeft}s
		</span>
	</div>

	<!-- Timer bar -->
	<div class="mb-4 h-1 overflow-hidden rounded-full bg-gray-800">
		<div
			class="h-full rounded-full bg-purple-500 transition-none"
			style="width: {(timeLeft / 30) * 100}%; transition: width 1s linear;"
		></div>
	</div>

	<div class="mb-3 flex gap-3">
		<div class="flex-1">
			<label for="year-guess" class="mb-1 block text-xs text-gray-500"
				>{ts('bonus.releaseYear')}</label
			>
			<input
				id="year-guess"
				type="number"
				placeholder="e.g. 2004"
				bind:value={yearInput}
				bind:this={yearInputEl}
				onkeydown={handleKeydown}
				class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
			/>
		</div>
		<div class="flex-1">
			<label for="name-guess" class="mb-1 block text-xs text-gray-500">{ts('bonus.gameName')}</label
			>
			<input
				id="name-guess"
				type="text"
				placeholder="e.g. Half-Life 2"
				bind:value={nameInput}
				onkeydown={handleKeydown}
				class="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none"
			/>
		</div>
	</div>

	<div class="flex gap-2">
		<button
			onclick={handleSubmit}
			class="flex-1 cursor-pointer rounded-lg bg-purple-600 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-500"
		>
			{ts('bonus.reveal')}
		</button>
		<button
			onclick={handleSkip}
			class="cursor-pointer rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
		>
			{ts('bonus.skip')}
		</button>
	</div>
</div>
