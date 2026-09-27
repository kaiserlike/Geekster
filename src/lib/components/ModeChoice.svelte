<script lang="ts">
	import { tf, ts } from '$lib/i18n.svelte';
	import type { ProGate } from '$lib/modes';
	import type { Difficulty } from '$lib/types';

	interface Props {
		/** The mode a run would be played in — already Normal while Pro is gated. */
		mode: Difficulty;
		proGate: ProGate;
		onchoose: (mode: Difficulty) => void;
		disabled?: boolean;
	}

	let { mode, proGate, onchoose, disabled = false }: Props = $props();

	const options = $derived([
		{ value: 'normal' as const, label: ts('mode.normal'), locked: false },
		{ value: 'pro' as const, label: ts('mode.pro'), locked: !proGate.open }
	]);
</script>

<fieldset class="mb-6" {disabled}>
	<legend
		class="mb-2 w-full text-center text-sm font-semibold tracking-wide text-gray-500 uppercase"
	>
		{ts('mode.legend')}
	</legend>
	<div
		class="mx-auto grid max-w-xs grid-cols-2 gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1"
	>
		{#each options as option (option.value)}
			<label
				class="relative flex min-h-12 flex-col items-center justify-center rounded-lg px-3 py-2 text-base font-bold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-purple-400 {option.locked
					? 'cursor-not-allowed text-gray-600'
					: mode === option.value
						? option.value === 'pro'
							? 'cursor-pointer bg-blue-600 text-white'
							: 'cursor-pointer bg-purple-600 text-white'
						: 'cursor-pointer text-gray-400 hover:text-gray-200'}"
				data-mode={option.value}
				data-locked={option.locked}
			>
				<input
					type="radio"
					name="mode"
					class="sr-only"
					value={option.value}
					checked={mode === option.value}
					disabled={option.locked}
					aria-describedby={option.locked ? 'pro-locked-note' : undefined}
					onchange={() => onchoose(option.value)}
				/>
				{option.label}
				{#if option.locked}
					<span
						class="mt-0.5 rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-300 uppercase"
					>
						{ts('mode.comingSoon')}
					</span>
				{/if}
			</label>
		{/each}
	</div>
	<p class="mt-2 text-center text-sm text-gray-400">
		{mode === 'pro' ? ts('mode.proHint') : ts('mode.normalHint')}
	</p>
	{#if !proGate.open}
		<p id="pro-locked-note" class="mt-1 text-center text-xs text-gray-500">
			{tf<(min: number) => string>('mode.proLocked')(proGate.min)}
		</p>
	{/if}
</fieldset>
