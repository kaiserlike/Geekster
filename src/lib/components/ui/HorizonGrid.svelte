<script lang="ts">
	interface Props {
		/** 0.3 by the tokens; brand assets go a little higher */
		opacity?: number;
		/** Fade out over the top third, as behind a screen; off where the grid is a frame's floor */
		fade?: boolean;
		class?: string;
	}

	let { opacity = 0.3, fade = true, class: className = '' }: Props = $props();

	// A synthwave floor: horizontal lines closing up towards the horizon, rays from its centre
	const HORIZONTALS = [60, 105, 160, 225, 298];
	const RAYS = [-800, -250, 200, 600, 1000, 1450, 2000];
</script>

<!-- Decoration only: never behind text, since every text-bearing surface is opaque -->
<svg
	aria-hidden="true"
	viewBox="0 0 1200 300"
	preserveAspectRatio="none"
	class="pointer-events-none blur-[0.5px] {fade ? 'mask-t-from-65%' : ''} {className}"
	style:opacity
>
	<g stroke="var(--color-grid)" stroke-width="1.5" vector-effect="non-scaling-stroke">
		{#each HORIZONTALS as y (y)}
			<line x1="0" y1={y} x2="1200" y2={y} vector-effect="non-scaling-stroke" />
		{/each}
		{#each RAYS as x (x)}
			<line x1="600" y1="10" x2={x} y2="300" vector-effect="non-scaling-stroke" />
		{/each}
	</g>
</svg>
