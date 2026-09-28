<script lang="ts">
	import ImageLightbox from '$lib/components/admin/ImageLightbox.svelte';
	import ScreenshotCropper from '$lib/components/admin/ScreenshotCropper.svelte';
	import { MAX_EDGE, readImageSize, toWebp } from '$lib/imageEncode';
	import type { CropSelection, PixelSize } from '$lib/types';

	interface Props {
		/** Field name the server action reads. */
		name?: string;
		id?: string;
		required?: boolean;
		/** Longest edge the image is scaled down to before uploading. */
		maxEdge?: number;
		/**
		 * Called with the picked file once its crop is confirmed (or once it
		 * turns out the browser cannot decode it, and it goes up as it is), and
		 * with `null` when the input is emptied. The new-game form uses it to
		 * drop a RAWG choice — both feed the same single `screenshot` field, so
		 * the last one wins. A pick cancelled in the crop step is not a pick.
		 */
		onselect?: (file: File | null) => void;
		/**
		 * Where a confirmed crop goes at once. The edit page passes it and uploads
		 * straight into the slot — there is no second "Upload" step to miss. The
		 * crop dialog stays open with the error if it rejects, and the picker is
		 * cleared when it resolves. Without it the WebP waits for `takeFile()`,
		 * as the new-game form needs, since its game does not exist yet.
		 */
		onconfirm?: (file: File, selection: CropSelection) => Promise<void>;
		/** Label of the crop step's confirm button. */
		confirmLabel?: string;
	}

	let {
		name = 'screenshot',
		id = 'screenshot',
		required = false,
		maxEdge = MAX_EDGE,
		onselect,
		onconfirm,
		confirmLabel
	}: Props = $props();

	const ACCEPT = 'image/webp,image/png,image/jpeg,image/gif,image/avif';

	let previewUrl: string | null = $state(null);
	let originalSize = $state(0);
	let processedSize = $state(0);
	let working = $state(false);

	/**
	 * The picked file, kept in memory until the upload so "Crop again" can start
	 * from the original rather than from the already-cropped WebP.
	 */
	let original: File | null = $state(null);
	let originalUrl: string | null = $state(null);
	let originalPixels: PixelSize | null = $state(null);
	let cropOpen = $state(false);
	let cropError: string | null = $state(null);
	let selection: CropSelection | null = $state(null);

	/**
	 * The file the form should send: a WebP of the chosen 16:9 crop, scaled so
	 * its longest edge is at most `maxEdge`. Screenshots arrive at wildly
	 * different sizes and the blob store keeps whatever it is given, so this
	 * normalises them before they leave the browser.
	 */
	let resized: File | null = $state(null);
	let input: HTMLInputElement | undefined = $state();

	export function takeFile(): File | null {
		return resized;
	}

	/** The crop that produced `takeFile()`'s WebP, for the form to send along. */
	export function takeCrop(): CropSelection | null {
		return resized ? selection : null;
	}

	/** Drops the selection, the preview and the input's own file. */
	export function clear() {
		reset();
		if (input) input.value = '';
	}

	/** Everything `clear()` drops except the file input itself. */
	function reset() {
		revoke();
		if (originalUrl) URL.revokeObjectURL(originalUrl);
		originalUrl = null;
		original = null;
		originalPixels = null;
		selection = null;
		resized = null;
		originalSize = 0;
		processedSize = 0;
		cropOpen = false;
	}

	function revoke() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
	}

	/** Bumped by every pick, so a slow decode of an earlier one cannot land late. */
	let pickNumber = 0;

	async function handleChange(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
		const pick = ++pickNumber;

		reset();
		originalSize = file?.size ?? 0;
		if (!file) {
			onselect?.(null);
			return;
		}

		working = true;
		try {
			const pixels = await readImageSize(file);
			if (pick !== pickNumber) return;
			originalPixels = pixels;
			original = file;
			originalUrl = URL.createObjectURL(file);
			cropError = null;
			cropOpen = true;
		} catch (err) {
			if (pick !== pickNumber) return;
			// The browser cannot decode it, so it cannot be cropped either. Fall back
			// to uploading the untouched file the input already holds.
			console.error('Could not pre-process the image:', err);
			previewUrl = URL.createObjectURL(file);
			onselect?.(file);
		} finally {
			if (pick === pickNumber) working = false;
		}
	}

	async function applyCrop(chosen: CropSelection) {
		if (!original || working) return;
		const pick = pickNumber;
		working = true;
		cropError = null;
		try {
			const encoded = await toWebp(original, {
				maxEdge,
				filename: original.name,
				crop: chosen.crop
			});
			if (pick !== pickNumber) return;
			if (onconfirm) {
				await onconfirm(encoded, chosen);
				if (pick === pickNumber) clear();
				return;
			}
			revoke();
			resized = encoded;
			selection = chosen;
			processedSize = encoded.size;
			previewUrl = URL.createObjectURL(encoded);
			cropOpen = false;
			// Only a confirmed crop counts as a pick: the new-game form drops its
			// RAWG choice here, not when a file is merely opened and then cancelled.
			onselect?.(original);
		} catch (err) {
			if (pick === pickNumber) {
				cropError = err instanceof Error ? err.message : 'Could not add the screenshot.';
			}
		} finally {
			if (pick === pickNumber) working = false;
		}
	}

	/**
	 * Closing the first crop without confirming drops the pick — there is no
	 * crop to upload. Closing a "Crop again" keeps the crop already chosen.
	 * While the crop is being encoded the dialog stays open: Escape then would
	 * race the encode that is about to set the result.
	 */
	function setCropOpen(open: boolean) {
		if (!open && working) return;
		cropOpen = open;
		if (!open && !resized) clear();
	}

	function kb(bytes: number): string {
		return `${Math.round(bytes / 1024)} kB`;
	}

	$effect(() => () => {
		revoke();
		if (originalUrl) URL.revokeObjectURL(originalUrl);
	});
</script>

<input
	bind:this={input}
	{id}
	{name}
	{required}
	type="file"
	accept={ACCEPT}
	onchange={handleChange}
	class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-gray-800 file:px-3 file:py-1.5 file:text-gray-200"
/>

{#if working && !cropOpen}
	<p class="mt-2 text-xs text-gray-500">Preparing the image…</p>
{:else if previewUrl}
	<div class="mt-2 flex items-center gap-3">
		<img src={previewUrl} alt="Preview" class="h-20 w-32 rounded object-cover" />
		<div class="text-xs text-gray-500">
			<p>
				{kb(originalSize)}
				{#if processedSize > 0}→ {kb(processedSize)} WebP{/if}
			</p>
			{#if selection}
				<p class="font-mono">
					{selection.crop.width}×{selection.crop.height} of {selection.source.width}×{selection
						.source.height}
				</p>
				<button
					type="button"
					onclick={() => (cropOpen = true)}
					class="text-accent hover:text-accent-strong cursor-pointer"
				>
					Crop again
				</button>
			{/if}
		</div>
	</div>
{/if}

{#if originalUrl && originalPixels}
	<ImageLightbox
		bind:open={() => cropOpen, setCropOpen}
		src={originalUrl}
		alt="Crop the screenshot"
		content={cropStep}
	/>
{/if}

{#snippet cropStep()}
	{#if originalUrl && originalPixels}
		<ScreenshotCropper
			src={originalUrl}
			source={originalPixels}
			initial={selection?.crop}
			{confirmLabel}
			busy={working}
			error={cropError}
			onconfirm={applyCrop}
			oncancel={() => setCropOpen(false)}
		/>
	{/if}
{/snippet}
