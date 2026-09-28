<script lang="ts">
	import type { ToastMessage } from '$lib/types';
	import { fly } from '$lib/motion';

	interface Props {
		/** null clears it. The live region itself always exists, or a reader would miss the first one */
		message: ToastMessage | null;
		class?: string;
	}

	let { message, class: className = '' }: Props = $props();

	// Colour is never alone: every tone has its own symbol
	const TONES = {
		correct: {
			icon: '✓',
			box: 'border-accent bg-accent-soft',
			mark: 'text-accent',
			detail: 'text-[#bdf7f2]'
		},
		wrong: {
			icon: '✗',
			box: 'border-danger bg-[#2a0c18]',
			mark: 'text-[#ff6b85]',
			detail: 'text-[#ffc2cd]'
		},
		life: {
			icon: '♥',
			box: 'border-life bg-[#2a0c22]',
			mark: 'text-life',
			detail: 'text-[#ffc2e2]'
		},
		streak: {
			icon: '★',
			box: 'border-accent bg-accent-soft',
			mark: 'text-accent',
			detail: 'text-[#bdf7f2]'
		}
	} as const;
</script>

<!-- Sits in the flow under the HUD, never over it (U7), and is announced politely -->
<div role="status" aria-live="polite" aria-atomic="true" class={className}>
	{#if message}
		{@const tone = TONES[message.tone]}
		<div
			in:fly={{ y: -8 }}
			class="rounded-control flex items-center gap-2.5 border-[1.5px] px-3.5 py-2.5 text-sm shadow-[0_8px_24px_rgb(0_0_0/0.6)] {tone.box}"
			data-tone={message.tone}
		>
			<span class="font-ui font-bold {tone.mark}" aria-hidden="true">{tone.icon}</span>
			<span class="font-ui text-ink font-bold tracking-[1.5px] uppercase">{message.title}</span>
			{#if message.detail}
				<span class={tone.detail}>{message.detail}</span>
			{/if}
		</div>
	{/if}
</div>
