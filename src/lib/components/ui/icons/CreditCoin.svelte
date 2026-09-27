<script lang="ts">
	interface Props {
		/** From 48 px the coin carries "CR"; below that it is a plain ring, as beside the HUD number */
		size?: number;
		label?: string;
		class?: string;
	}

	let { size = 20, label, class: className = '' }: Props = $props();

	const LARGE_FROM = 48;
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 96 96"
	class={className}
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : true}
>
	<circle cx="48" cy="48" r="44" fill="var(--color-coin)" />
	{#if size >= LARGE_FROM}
		<circle cx="48" cy="48" r="34" fill="none" stroke="var(--color-coin-rim)" stroke-width="4" />
		<text
			x="48"
			y="60"
			text-anchor="middle"
			font-family="Dela Gothic One, sans-serif"
			font-size="32"
			fill="var(--color-coin-rim)">CR</text
		>
	{:else}
		<circle cx="48" cy="48" r="26" fill="none" stroke="var(--color-coin-rim)" stroke-width="8" />
	{/if}
</svg>
