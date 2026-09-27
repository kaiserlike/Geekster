<script lang="ts">
	interface Props {
		/** full = a life, empty = a lost one, socket = the slot a regained life fills */
		variant?: 'full' | 'empty' | 'socket';
		size?: number;
		/** Hearts are usually described by their container (the lives' label), so decorative by default */
		label?: string;
		class?: string;
	}

	let { variant = 'full', size = 24, label, class: className = '' }: Props = $props();

	const PATH =
		'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	class="{variant === 'full' ? 'drop-shadow-[0_0_5px_rgb(255_61_154/0.9)]' : ''} {className}"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : true}
	data-variant={variant}
>
	{#if variant === 'full'}
		<path d={PATH} fill="var(--color-life)" />
	{:else if variant === 'empty'}
		<path d={PATH} fill="none" stroke="var(--color-life-empty)" stroke-width="2" />
	{:else}
		<path
			d={PATH}
			fill="none"
			stroke="var(--color-life)"
			stroke-width="2"
			stroke-dasharray="3 2.5"
		/>
	{/if}
</svg>
