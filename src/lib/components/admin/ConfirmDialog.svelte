<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';

	interface Props {
		/** Bindable — the caller owns which row the dialog is confirming. */
		open: boolean;
		title: string;
		description: string;
		/** The confirming control, usually the form that posts the destructive action. */
		confirm: Snippet;
	}

	let { open = $bindable(), title, description, confirm }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-2xl focus:outline-none"
		>
			<Dialog.Title class="text-lg font-semibold text-white">{title}</Dialog.Title>
			<Dialog.Description class="mt-2 text-sm text-gray-400">{description}</Dialog.Description>

			<div class="mt-6 flex justify-end gap-2">
				<Dialog.Close
					class="cursor-pointer rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
				>
					Cancel
				</Dialog.Close>
				{@render confirm()}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
