<script lang="ts">
	import type { ToastMessage } from '$lib/types';
	import Toast from './ui/Toast.svelte';

	interface Props {
		/** A new object shows it again for its full time, even with the same text */
		message: ToastMessage | null;
		class?: string;
	}

	let { message, class: className = '' }: Props = $props();

	// Long enough to read the detail line, short enough to be gone before the next card (U7)
	const SHOW_MS = 2500;

	let shown: ToastMessage | null = $state(null);

	$effect(() => {
		shown = message;
		if (!message) return;
		const timer = setTimeout(() => (shown = null), SHOW_MS);
		return () => clearTimeout(timer);
	});
</script>

<!-- In the flow under the HUD, never over it; the live region stays mounted between messages -->
<Toast message={shown} class={className} />
