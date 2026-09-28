<script lang="ts">
	import { fly, fade } from 'svelte/transition';

	interface Props {
		message: string | null;
		type: 'correct' | 'wrong' | 'life' | null;
	}

	let { message, type }: Props = $props();
</script>

{#if message}
	<div
		in:fly={{ y: -40, duration: 300 }}
		out:fade={{ duration: 200 }}
		class="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-6 py-3 text-lg font-bold whitespace-nowrap shadow-lg {type ===
		'life'
			? 'bg-pink-600'
			: type === 'correct'
				? 'bg-green-600'
				: 'bg-red-600'}"
	>
		{message}
	</div>
{/if}
