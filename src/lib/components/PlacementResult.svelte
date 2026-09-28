<script lang="ts">
	import type { ToastMessage } from '$lib/types';
	import { ts } from '$lib/i18n.svelte';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import { fade } from '$lib/motion';

	interface Props {
		/** The screenshot of the card just placed, where the card to place was */
		screenshot: string;
		/** What the placement did: the same words the live region speaks */
		message: ToastMessage;
		/** The verdict is up: until then the card shows as it was (a phone may still be scrolling) */
		shown: boolean;
		/** A correct placement: a tap goes on to the bonus round at once */
		onskip?: () => void;
		/**
		 * A miss: one line (thumbnail, ✗, the answer) that stays pinned while the page scrolls to
		 * the ghost, so the answer is always in view
		 */
		compact?: boolean;
	}

	let { screenshot, message, shown, onskip, compact = false }: Props = $props();

	// Colour is never alone: every tone has its own symbol (as the toast had)
	const TONES = {
		correct: {
			icon: '✓',
			frame: 'border-accent shadow-glow-accent',
			box: 'border-accent bg-accent-soft',
			mark: 'text-accent',
			detail: 'text-[#bdf7f2]'
		},
		streak: {
			icon: '★',
			frame: 'border-accent shadow-glow-accent',
			box: 'border-accent bg-accent-soft',
			mark: 'text-accent',
			detail: 'text-[#bdf7f2]'
		},
		life: {
			icon: '♥',
			frame: 'border-life shadow-glow-life',
			box: 'border-life bg-[#2a0c22]',
			mark: 'text-life',
			detail: 'text-[#ffc2e2]'
		},
		wrong: {
			icon: '✗',
			frame: 'border-danger shadow-glow-danger',
			box: 'border-danger bg-[#2a0c18]',
			mark: 'text-[#ff6b85]',
			detail: 'text-[#ffc2cd]'
		}
	} as const;

	const tone = $derived(TONES[message.tone]);
</script>

<!--
	The card to place turns into its verdict (user idea, 2026-09-28): the screenshot stays where it
	was, its frame takes the verdict's colour and an opaque panel with the verdict comes up over it.
	A correct one then turns into the bonus round (GameScreen); a miss stays until "Next card"
-->
{#if compact}
	<div
		class="rounded-card flex items-center gap-3 border-[1.5px] p-1.5 pr-3.5 shadow-[0_8px_24px_rgb(0_0_0/0.6)] {tone.box}"
		aria-hidden="true"
		data-verdict={message.tone}
		data-verdict-strip
	>
		<img
			src={resolveScreenshotUrl(screenshot)}
			alt=""
			class="rounded-thumb h-13.5 w-24 shrink-0 object-cover"
		/>
		<span class="font-ui text-2xl leading-none font-bold {tone.mark}">{tone.icon}</span>
		<div class="flex min-w-0 flex-col">
			<span class="font-ui text-ink text-[15px] font-bold tracking-[1.5px] uppercase"
				>{message.title}</span
			>
			{#if message.detail}
				<span class="text-[13px] {tone.detail}">{message.detail}</span>
			{/if}
		</div>
	</div>
{:else}
	<svelte:element
		this={onskip ? 'button' : 'div'}
		type={onskip ? 'button' : undefined}
		onclick={onskip}
		out:fade={{ duration: 200 }}
		aria-hidden="true"
		tabindex={onskip ? -1 : undefined}
		class="block w-full text-left lg:mx-auto lg:max-w-[calc((100dvh-26rem)*16/9)]"
		data-verdict={message.tone}
	>
		<div
			class="rounded-card relative overflow-hidden border-2 transition-[border-color,box-shadow] duration-(--duration-slow) {shown
				? tone.frame
				: 'border-accent shadow-glow-card'}"
		>
			<img
				src={resolveScreenshotUrl(screenshot)}
				alt={ts('card.alt')}
				class="block aspect-video w-full object-cover"
			/>
			<div class="absolute inset-0 flex items-center justify-center p-4">
				<div
					class="rounded-card flex max-w-full flex-col items-center gap-1 border-2 px-6 py-4 text-center shadow-[0_8px_24px_rgb(0_0_0/0.6)] transition-[opacity,scale] duration-(--duration-slow) ease-(--ease-overshoot) motion-reduce:transition-opacity motion-reduce:duration-(--duration-fast) {tone.box} {shown
						? 'scale-100 opacity-100'
						: 'scale-75 opacity-0'}"
				>
					<span class="font-ui text-4xl leading-none font-bold {tone.mark}">{tone.icon}</span>
					<span class="font-display text-ink text-2xl tracking-[2px] uppercase lg:text-3xl"
						>{message.title}</span
					>
					{#if message.detail}
						<span class="text-sm lg:text-base {tone.detail}">{message.detail}</span>
					{/if}
				</div>
			</div>
		</div>
	</svelte:element>
{/if}
