<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Bindable — the caller owns which screenshot is being viewed. */
		open: boolean;
		src: string;
		alt: string;
		/** Shown under the image; the screenshot URL in practice. */
		caption?: string;
		/**
		 * Optional controls under the image — "Use this screenshot" for the RAWG
		 * picker. Callers that only look at an image pass nothing.
		 */
		actions?: Snippet;
		/** Optional ← / → handlers. Both arrows are hidden unless given. */
		onprevious?: () => void;
		onnext?: () => void;
	}

	let { open = $bindable(), src, alt, caption, actions, onprevious, onnext }: Props = $props();

	const hasSteps = $derived(Boolean(onprevious || onnext));

	function onkeydown(event: KeyboardEvent) {
		if (!open || !hasSteps) return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			onprevious?.();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			onnext?.();
		}
	}
</script>

<svelte:window {onkeydown} />

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-w-[80vw] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 focus:outline-none"
		>
			<Dialog.Title class="sr-only">{alt}</Dialog.Title>
			<Dialog.Description class="sr-only">
				Press Escape or click outside the image to close it.{hasSteps
					? ' Use the left and right arrow keys to step between images.'
					: ''}
			</Dialog.Description>

			<div class="relative">
				<img {src} {alt} class="max-h-[80vh] max-w-[80vw] rounded-lg object-contain shadow-2xl" />
				<Dialog.Close
					aria-label="Close"
					class="absolute -top-3 -right-3 cursor-pointer rounded-full border border-gray-700 bg-gray-900 p-2 text-gray-300 shadow-lg hover:bg-gray-800 hover:text-white"
				>
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						aria-hidden="true"
					>
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</Dialog.Close>
			</div>

			{#if hasSteps}
				<div class="flex items-center gap-2">
					<button
						type="button"
						aria-label="Previous image"
						onclick={onprevious}
						disabled={!onprevious}
						class="cursor-pointer rounded-full border border-gray-700 bg-gray-900 p-2 text-gray-300 hover:bg-gray-800 hover:text-white disabled:cursor-default disabled:opacity-30"
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M15 18l-6-6 6-6" />
						</svg>
					</button>
					<button
						type="button"
						aria-label="Next image"
						onclick={onnext}
						disabled={!onnext}
						class="cursor-pointer rounded-full border border-gray-700 bg-gray-900 p-2 text-gray-300 hover:bg-gray-800 hover:text-white disabled:cursor-default disabled:opacity-30"
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M9 18l6-6-6-6" />
						</svg>
					</button>
				</div>
			{/if}

			{#if actions}
				<div class="flex items-center gap-3">{@render actions()}</div>
			{/if}

			{#if caption}
				<p class="max-w-[80vw] truncate font-mono text-xs text-gray-400">{caption}</p>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
