<script lang="ts">
	import { Dialog } from 'bits-ui';

	interface Props {
		/** Bindable — the caller owns which screenshot is being viewed. */
		open: boolean;
		src: string;
		alt: string;
		/** Shown under the image; the screenshot URL in practice. */
		caption?: string;
	}

	let { open = $bindable(), src, alt, caption }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-w-[80vw] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 focus:outline-none"
		>
			<Dialog.Title class="sr-only">{alt}</Dialog.Title>
			<Dialog.Description class="sr-only">
				Press Escape or click outside the image to close it.
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

			{#if caption}
				<p class="max-w-[80vw] truncate font-mono text-xs text-gray-400">{caption}</p>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
