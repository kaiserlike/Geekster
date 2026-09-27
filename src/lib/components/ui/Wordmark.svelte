<script lang="ts">
	interface Props {
		/** Font size in px. The token sizes are 27 (header), 44 (welcome) and 68 (desktop welcome) */
		size?: number;
		/** Flat: no split, no glow — favicons below 32 px, print, the admin panel */
		flat?: boolean;
		/** The pink `// TIMELINE PROTOCOL v9` line under it; never shown without the wordmark */
		tagline?: boolean;
		/** Render as the page's h1 (welcome) instead of a plain span (header) */
		heading?: boolean;
		class?: string;
	}

	let {
		size = 27,
		flat = false,
		tagline = false,
		heading = false,
		class: className = ''
	}: Props = $props();

	// The split is a fixed offset, never a blur: 2.5 px up to header size, 3 px above, 4 px at OG size
	const offset = $derived(size >= 80 ? 4 : size > 40 ? 3 : 2.5);
	const shadow = $derived(
		flat
			? 'none'
			: `-${offset}px 0 0 var(--color-magenta), ${offset}px 0 0 var(--color-accent), 0 0 ${Math.round(size / 5)}px rgb(63 240 228 / 0.5), 0 0 ${Math.round(size / 2.5)}px rgb(29 233 214 / 0.25)`
	);
</script>

<span class="inline-flex flex-col items-center gap-1.5 {className}">
	<svelte:element
		this={heading ? 'h1' : 'span'}
		class="font-display text-focus m-0 leading-none font-normal"
		style:font-size="{size}px"
		style:letter-spacing="{size >= 40 ? 2 : 1.5}px"
		style:text-shadow={shadow}
	>
		GEEKSTER
	</svelte:element>
	{#if tagline}
		<span
			class="font-ui text-pink font-bold"
			style:font-size="{Math.max(10, Math.round(size / 4))}px"
			style:letter-spacing="{size >= 60 ? 5 : 3}px"
			aria-hidden="true"
		>
			// TIMELINE PROTOCOL v9
		</span>
	{/if}
</span>
