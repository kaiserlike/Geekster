<script lang="ts" generics="T extends string">
	import type { SegmentOption } from '$lib/types';
	import Chip from './Chip.svelte';

	interface Props {
		legend: string;
		/** The radio group's name; unique per page */
		name: string;
		options: SegmentOption<T>[];
		value: T;
		onchange: (value: T) => void;
		disabled?: boolean;
		class?: string;
	}

	let {
		legend,
		name,
		options,
		value,
		onchange,
		disabled = false,
		class: className = ''
	}: Props = $props();

	const SELECTED = {
		accent: 'bg-accent text-on-accent shadow-[0_0_12px_rgb(63_240_228/0.45)]',
		pink: 'bg-pink text-on-accent shadow-[0_0_14px_rgb(255_43_214/0.5)]'
	} as const;
</script>

<fieldset class="m-0 min-w-0 border-0 p-0 {className}" {disabled}>
	<legend
		class="font-ui text-ink-muted mb-2 w-full text-center text-xs font-bold tracking-[3px] uppercase"
	>
		{legend}
	</legend>
	<div
		class="rounded-card border-line-strong bg-surface grid gap-1.5 border-[1.5px] p-1.25"
		style:grid-template-columns="repeat({options.length}, minmax(0, 1fr))"
	>
		{#each options as option (option.value)}
			{@const selected = option.value === value}
			<label
				class="font-ui has-focus-visible:outline-focus relative flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-[7px] px-3 text-base font-bold tracking-[1.5px] uppercase transition-[background-color,color,box-shadow] duration-(--duration-base) ease-out has-focus-visible:outline-2 has-focus-visible:outline-offset-2 {option.disabled ||
				disabled
					? 'text-ink-subtle cursor-not-allowed'
					: selected
						? `cursor-pointer ${SELECTED[option.tone ?? 'accent']}`
						: 'text-ink-muted hover:text-ink cursor-pointer'}"
				data-value={option.value}
				data-locked={option.disabled ?? false}
			>
				<input
					type="radio"
					{name}
					class="sr-only"
					value={option.value}
					checked={selected}
					disabled={option.disabled}
					aria-describedby={option.describedBy}
					onchange={() => onchange(option.value)}
				/>
				{option.label}
				{#if option.badge}
					<Chip tone="pink" size="xs">{option.badge}</Chip>
				{/if}
			</label>
		{/each}
	</div>
</fieldset>
