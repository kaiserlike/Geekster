<script lang="ts">
	import { tf, ts } from '$lib/i18n.svelte';
	import type { ProGate } from '$lib/modes';
	import type { Difficulty, SegmentOption } from '$lib/types';
	import SegmentedControl from './ui/SegmentedControl.svelte';

	interface Props {
		/** The mode a run would be played in — already Normal while Pro is gated. */
		mode: Difficulty;
		proGate: ProGate;
		onchoose: (mode: Difficulty) => void;
		disabled?: boolean;
		/** The legend for screen readers only, under the Endless Run's heading (10d) */
		hideLegend?: boolean;
		class?: string;
	}

	let {
		mode,
		proGate,
		onchoose,
		disabled = false,
		hideLegend = false,
		class: className = ''
	}: Props = $props();

	const LOCKED_NOTE_ID = 'pro-locked-note';

	// Normal is turquoise, Pro pink: the mode colour the run then carries (the PRO badge)
	const options: SegmentOption<Difficulty>[] = $derived([
		{ value: 'normal', label: ts('mode.normal') },
		{
			value: 'pro',
			label: ts('mode.pro'),
			tone: 'pink',
			disabled: !proGate.open,
			badge: proGate.open ? undefined : ts('mode.comingSoon'),
			describedBy: proGate.open ? undefined : LOCKED_NOTE_ID
		}
	]);
</script>

<div class="flex flex-col gap-2 {className}">
	<SegmentedControl
		legend={ts('mode.legend')}
		name="mode"
		{options}
		value={mode}
		onchange={onchoose}
		{disabled}
		{hideLegend}
	/>
	<p class="text-ink-muted text-center text-[13px] leading-normal">
		{mode === 'pro' ? ts('mode.proHint') : ts('mode.normalHint')}
		{#if !proGate.open}
			<span id={LOCKED_NOTE_ID}>{tf<(min: number) => string>('mode.proLocked')(proGate.min)}</span>
		{/if}
	</p>
</div>
