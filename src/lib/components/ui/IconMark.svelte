<script lang="ts">
	import HorizonGrid from './HorizonGrid.svelte';

	interface Props {
		/** The square's edge in px: 16, 32, 180, 192, 512 */
		size: number;
		/**
		 * Opaque corners (apple-touch-icon: iOS rounds it itself) or a full-bleed maskable icon
		 * with the mark inside the centre 80 % safe zone
		 */
		fill?: 'none' | 'opaque' | 'maskable';
	}

	let { size, fill = 'none' }: Props = $props();

	// The mark inside a maskable icon keeps to the centre 80 %
	const MASKABLE_SAFE_ZONE = 0.8;
	// The horizon grid only from 180 px up: below that it is noise
	const GRID_FROM = 180;

	const mark = $derived(fill === 'maskable' ? Math.round(size * MASKABLE_SAFE_ZONE) : size);
	// Proportions from the canvas's Brand board, with fixed values where a fraction of 16 or 32 px
	// would fall between pixels
	const radius = $derived(mark <= 16 ? 4 : mark <= 32 ? 7 : mark * 0.22);
	const border = $derived(mark <= 16 ? 1 : mark <= 32 ? 1.5 : mark * (mark >= 256 ? 0.015 : 0.022));
	const glyph = $derived(mark <= 16 ? 12 : mark <= 32 ? 21 : mark * 0.64);
	const split = $derived(mark <= 16 ? 1 : mark <= 32 ? 1.5 : mark * 0.03);
	const glow = $derived(mark >= GRID_FROM ? `, 0 0 ${mark * 0.09}px rgb(63 240 228 / 0.6)` : '');
</script>

<div
	class="flex items-center justify-center {fill === 'none' ? '' : 'bg-bg'}"
	style:width="{size}px"
	style:height="{size}px"
>
	<div
		class="bg-bg relative flex items-center justify-center overflow-hidden"
		style:width="{mark}px"
		style:height="{mark}px"
		style:border-radius="{radius}px"
		style:box-shadow="inset 0 0 0 {border}px var(--color-magenta)"
	>
		{#if mark >= GRID_FROM}
			<HorizonGrid opacity={0.45} fade={false} class="absolute bottom-0 left-0 h-[45%] w-full" />
		{/if}
		<span
			class="font-display text-focus relative leading-none"
			style:font-size="{glyph}px"
			style:text-shadow="-{split}px 0 0 var(--color-magenta), {split}px 0 0 var(--color-accent){glow}"
		>
			G
		</span>
	</div>
</div>
