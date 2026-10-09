<script lang="ts">
	interface Props {
		size?: number;
		class?: string;
	}

	let { size = 13, class: className = '' }: Props = $props();
</script>

<!-- A streak: the Daily's days in a row on the welcome screen, cards in a row in the Daily HUD -->
<svg
	width={size}
	height={Math.round((size * 14) / 12)}
	viewBox="0 0 12 14"
	class={className}
	aria-hidden="true"
>
	<path
		d="M6 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 2 2 2-1-2 0-4 0-6z"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linejoin="round"
	/>
</svg>
