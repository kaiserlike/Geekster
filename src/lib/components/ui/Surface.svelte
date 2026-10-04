<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** The element to render: a panel is usually a section, a HUD a header */
		as?: 'div' | 'section' | 'header' | 'aside' | 'article';
		tone?: 'surface' | 'raised' | 'sunken';
		/**
		 * line = a quiet edge, magenta = the HUD frame with its glow, danger = a wrong moment (with
		 * its own fill). danger-glow and life-glow are the HUD frame's moments: a wrong placement,
		 * a life won back. They keep the tone's fill
		 */
		frame?: 'none' | 'line' | 'magenta' | 'accent' | 'danger' | 'danger-glow' | 'life-glow';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		class?: string;
		children: Snippet;
	}

	let {
		as = 'div',
		tone = 'surface',
		frame = 'line',
		padding = 'md',
		class: className = '',
		children
	}: Props = $props();

	// Every text-bearing surface is opaque: decoration never shows through text
	const TONES = {
		surface: 'bg-surface',
		raised: 'bg-surface-raised',
		sunken: 'bg-surface-sunken'
	} as const;

	const FRAMES = {
		none: '',
		line: 'border border-line',
		magenta: 'border-[1.5px] border-magenta shadow-glow-magenta',
		// The Endless Run's card beside the Daily's magenta one (10d)
		accent: 'border-[1.5px] border-accent shadow-glow-accent-soft',
		danger: 'border-[1.5px] border-danger',
		'danger-glow': 'border-[1.5px] border-danger shadow-glow-danger',
		'life-glow': 'border-[1.5px] border-life shadow-glow-life'
	} as const;

	const PADDING = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' } as const;

	// A danger frame brings its own fill, whatever the tone
	const fill = $derived(frame === 'danger' ? 'bg-danger-soft' : TONES[tone]);
</script>

<svelte:element
	this={as}
	class="rounded-card {fill} {FRAMES[frame]} {PADDING[padding]} {className}"
>
	{@render children()}
</svelte:element>
