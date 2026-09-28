<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Bindable: the caller owns whether it is open */
		open: boolean;
		src: string;
		alt: string;
		/** The close button's label, in the shown language */
		closeLabel: string;
		/** What the dialog is, for a screen reader ("Press Escape …") */
		description: string;
		/** Drawn over the image's top-left corner, e.g. the ???? chip */
		badge?: Snippet;
	}

	let { open = $bindable(), src, alt, closeLabel, description, badge }: Props = $props();
</script>

<!--
	A screenshot at full size (Sprint 9d feedback), the game's counterpart of the admin panel's
	ImageLightbox: bits-ui's dialog brings the focus trap, Escape and click-outside; this brings the
	tokens. It opens without motion, so there is nothing for reduced motion to switch off. Always
	16:9 and as large as the screen allows, like the card it enlarges: a small seed screenshot is
	scaled up rather than shown at its own 320 px
-->
<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="bg-bg/90 fixed inset-0 z-[200] backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-[200] w-[min(94vw,calc(88dvh*16/9))] -translate-x-1/2 -translate-y-1/2 focus:outline-none"
		>
			<Dialog.Title class="sr-only">{alt}</Dialog.Title>
			<Dialog.Description class="sr-only">{description}</Dialog.Description>
			<div class="relative">
				<img
					{src}
					{alt}
					class="rounded-card border-accent shadow-glow-card block aspect-video w-full border-2 object-cover"
				/>
				{#if badge}
					<div class="absolute top-3 left-3">{@render badge()}</div>
				{/if}
				<Dialog.Close
					aria-label={closeLabel}
					title={closeLabel}
					class="focus-ring rounded-control border-line-strong bg-surface-raised text-ink hover:border-accent absolute top-3 right-3 inline-flex size-11 items-center justify-center border-[1.5px]"
				>
					<svg
						class="size-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						aria-hidden="true"
					>
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</Dialog.Close>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
