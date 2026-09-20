<script lang="ts">
	interface Props {
		/** Announced to screen readers while the spinner is on screen. */
		label?: string;
		/** Tailwind size classes — the colour comes from the parent. */
		class?: string;
	}

	let { label = 'Loading', class: className = 'h-4 w-4' }: Props = $props();
</script>

<svg class="animate-spin {className}" viewBox="0 0 24 24" fill="none" role="img" aria-label={label}>
	<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
	<path
		class="opacity-75"
		fill="currentColor"
		d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4zm2 5.3A8 8 0 0 1 4 12H0c0 3.3 1.3 6.3 3.5 8.5l2.5-3.2z"
	/>
</svg>
