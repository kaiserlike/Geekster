<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value' | 'type'> {
		label: string;
		value?: string;
		/**
		 * Never `number`: a number field changes its value on a scroll-wheel turn (U12). A year is
		 * `inputmode="numeric"` on a text field instead
		 */
		type?: 'text' | 'search';
		hint?: string;
		/** Shown in `danger` with a ✗, and wired to the input through aria-describedby */
		error?: string;
		id: string;
	}

	let {
		label,
		value = $bindable(''),
		type = 'text',
		hint,
		error,
		id,
		class: className = '',
		...rest
	}: Props = $props();

	const describedBy = $derived(
		[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
			undefined
	);
</script>

<div class="flex min-w-0 flex-col gap-1.5 {className}">
	<label for={id} class="font-ui text-ink-muted text-xs font-bold tracking-[1.5px] uppercase">
		{label}
	</label>
	<input
		{id}
		{type}
		bind:value
		aria-invalid={error ? true : undefined}
		aria-describedby={describedBy}
		class="focus-ring tabular rounded-control bg-surface-sunken font-ui text-ink placeholder:font-body placeholder:text-ink-subtle hover:border-accent focus-visible:border-accent disabled:text-ink-subtle min-h-12 w-full min-w-0 border-[1.5px] px-3 text-[17px] font-bold transition-colors duration-(--duration-fast) ease-out placeholder:font-normal disabled:cursor-not-allowed {error
			? 'border-danger'
			: 'border-line-strong'}"
		{...rest}
	/>
	{#if hint}
		<p id="{id}-hint" class="text-ink-muted text-[13px]">{hint}</p>
	{/if}
	{#if error}
		<p id="{id}-error" class="text-danger text-[13px]">
			<span aria-hidden="true">✗</span>
			{error}
		</p>
	{/if}
</div>
