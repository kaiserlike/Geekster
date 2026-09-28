<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/**
		 * accent = Normal and progress, pink = Pro, NEW, COMING SOON, neutral = a spent multiplier,
		 * multiplier = the live ×N chip (with the RGB split), mystery = the "????" year
		 */
		tone?: 'accent' | 'pink' | 'neutral' | 'multiplier' | 'mystery';
		size?: 'xs' | 'sm' | 'md';
		class?: string;
		children: Snippet;
	}

	let { tone = 'accent', size = 'sm', class: className = '', children }: Props = $props();

	const TONES = {
		accent: 'rounded-chip bg-accent font-ui font-bold text-on-accent',
		pink: 'rounded-chip bg-pink font-ui font-bold text-on-accent',
		neutral: 'rounded-thumb bg-line font-ui font-bold text-ink-muted',
		multiplier:
			'rounded-thumb bg-accent font-ui font-bold text-on-accent shadow-[-2px_0_0_var(--color-magenta)]',
		mystery:
			'rounded-chip border border-line bg-bg/85 font-display tracking-[2px] text-ink text-shadow-[-1.5px_0_0_var(--color-magenta),1.5px_0_0_var(--color-accent)]'
	} as const;

	// xs is decoration-sized (COMING SOON inside a segment); the others are ≥ 12 px
	const SIZES = {
		xs: 'px-1.5 text-[10px] tracking-[1.5px]',
		sm: 'px-2 py-px text-xs tracking-[1px]',
		md: 'px-2.5 py-0.5 text-sm tracking-[1px]'
	} as const;
</script>

<span class="tabular inline-flex items-center uppercase {TONES[tone]} {SIZES[size]} {className}">
	{@render children()}
</span>
