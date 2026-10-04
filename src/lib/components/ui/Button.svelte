<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		/**
		 * primary = the one action on a screen, secondary = its alternative, ghost = a text button,
		 * pink = the Daily Run's action (10d), the primary in the Daily's colour
		 */
		variant?: 'primary' | 'secondary' | 'ghost' | 'pink';
		/** sm 44 px (the minimum target), md 52 px, lg 56 px (START RUN) */
		size?: 'sm' | 'md' | 'lg';
		/** Shows a spinner and blocks clicks; the label stays so the width does not jump */
		loading?: boolean;
		fullWidth?: boolean;
		/** The button element, for a caller that moves focus to it */
		ref?: HTMLButtonElement | null;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		fullWidth = false,
		ref = $bindable(null),
		disabled = false,
		type = 'button',
		class: className = '',
		children,
		...rest
	}: Props = $props();

	const SIZES = {
		sm: 'min-h-11 px-4 text-sm',
		md: 'min-h-13 px-6 text-[15px]',
		lg: 'min-h-14 px-6 text-[17px]'
	} as const;

	const VARIANTS = {
		primary:
			'bg-accent text-on-accent shadow-glow-accent tracking-[2px] enabled:hover:bg-[#a6fbf5] enabled:hover:shadow-[0_0_28px_rgb(63_240_228/0.85)] enabled:active:translate-y-px disabled:bg-[#0c2a36] disabled:text-ink-subtle disabled:shadow-none',
		secondary:
			'border-[1.5px] border-line-strong bg-surface-sunken text-ink enabled:hover:border-accent enabled:hover:bg-accent-soft enabled:active:translate-y-px disabled:text-ink-subtle',
		ghost: 'bg-transparent text-accent enabled:hover:text-ink disabled:text-ink-subtle',
		pink: 'bg-pink text-on-accent shadow-glow-card tracking-[2px] enabled:hover:bg-[#ff7ae6] enabled:active:translate-y-px disabled:bg-[#0c2a36] disabled:text-ink-subtle disabled:shadow-none'
	} as const;
</script>

<button
	bind:this={ref}
	{type}
	disabled={disabled || loading}
	aria-busy={loading || undefined}
	class="focus-ring rounded-control font-ui inline-flex items-center justify-center gap-2.5 font-bold tracking-[1.5px] uppercase transition-[background-color,border-color,box-shadow,color,translate] duration-(--duration-fast) ease-out select-none disabled:cursor-not-allowed {SIZES[
		size
	]} {VARIANTS[variant]} {fullWidth ? 'w-full' : ''} {className}"
	{...rest}
>
	{#if loading}
		<svg class="size-4.5 motion-safe:animate-spin" viewBox="0 0 18 18" aria-hidden="true">
			<circle
				cx="9"
				cy="9"
				r="7"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-dasharray="30 14"
			/>
		</svg>
	{/if}
	{@render children()}
</button>
