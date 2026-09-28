<script lang="ts">
	/**
	 * Crop an existing screenshot again (US-8.8), without searching RAWG.
	 *
	 * What it crops from depends on what was kept:
	 * - a RAWG shot has its `source_url`, so the original is fetched again
	 *   through the proxy and the crop can widen as well as tighten. It opens on
	 *   the stored rectangle, which is in that original's pixels
	 * - an uploaded file kept only its cropped WebP, so that is what is cropped —
	 *   tighter only. The server maps the result back into the original's pixels
	 *
	 * The result replaces this shot's image, or becomes a new shot in either tier
	 * — which is how a Normal shot becomes the source of a Pro detail. The bytes
	 * still take the one pipeline: into the browser, `toWebp()`, `?/upload`.
	 */
	import { untrack } from 'svelte';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ImageLightbox from '$lib/components/admin/ImageLightbox.svelte';
	import ScreenshotCropper from '$lib/components/admin/ScreenshotCropper.svelte';
	import Spinner from '$lib/components/admin/Spinner.svelte';
	import { appendCrop } from '$lib/crop';
	import { readImageSize, toWebp } from '$lib/imageEncode';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '$lib/screenshotTiers';
	import type { AdminScreenshot, CropRect, CropSelection, PixelSize } from '$lib/types';

	interface Props {
		shot: AdminScreenshot;
		/** Basename for the encoded file. */
		filename: string;
		/** Called once the dialog has closed, saved or not. */
		onclose: () => void;
	}

	let { shot, filename, onclose }: Props = $props();

	type Target = 'replace' | Difficulty;

	let open = $state(true);
	let busy = $state(false);
	let error: string | null = $state(null);
	let target: Target = $state('replace');

	interface Loaded {
		blob: Blob;
		objectUrl: string;
		size: PixelSize;
		initial: CropRect | null;
	}
	let loaded: Loaded | null = $state(null);

	// The shot is fixed for the life of the dialog; the caller remounts it per shot.
	// svelte-ignore state_referenced_locally
	const base: 'source' | 'stored' = shot.sourceUrl ? 'source' : 'stored';

	function fits(rect: CropRect, size: PixelSize): boolean {
		return rect.x + rect.width <= size.width && rect.y + rect.height <= size.height;
	}

	async function load() {
		try {
			const url = shot.sourceUrl
				? `${resolve('/api/admin/rawg/image')}?url=${encodeURIComponent(shot.sourceUrl)}`
				: resolveScreenshotUrl(shot.url);
			const response = await fetch(url);
			if (!response.ok) throw new Error('Could not fetch the image to crop.');
			const blob = await response.blob();
			const size = await readImageSize(blob);
			if (!open || destroyed) return;
			// Only the RAWG original shares the stored rectangle's pixel space.
			const initial = base === 'source' && shot.crop && fits(shot.crop, size) ? shot.crop : null;
			loaded = { blob, objectUrl: URL.createObjectURL(blob), size, initial };
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not load the image.';
		}
	}

	/** Set on unmount, so a load that finishes afterwards creates no object URL. */
	let destroyed = false;

	$effect(() => {
		untrack(load);
		return () => {
			destroyed = true;
			if (loaded) URL.revokeObjectURL(loaded.objectUrl);
		};
	});

	function setOpen(value: boolean) {
		if (!value && busy) return;
		open = value;
		if (!value) onclose();
	}

	async function save(selection: CropSelection) {
		if (!loaded || busy) return;
		busy = true;
		error = null;

		try {
			const file = await toWebp(loaded.blob, { filename, crop: selection.crop });
			const body = new FormData();
			body.set('screenshot', file, file.name);
			body.set('difficulty', target === 'replace' ? shot.difficulty : target);
			body.set('recropOf', String(shot.id));
			body.set('cropBase', base);
			if (target === 'replace') body.set('replace', '1');
			appendCrop(body, selection);

			const response = await fetch('?/upload', { method: 'POST', body });
			const result = deserialize(await response.text());
			if (result.type !== 'success') {
				const message = result.type === 'failure' ? result.data?.error : null;
				throw new Error(typeof message === 'string' ? message : 'The upload failed.');
			}
			await invalidateAll();
			busy = false;
			setOpen(false);
		} catch (err) {
			error = err instanceof Error ? err.message : 'The upload failed.';
		} finally {
			busy = false;
		}
	}
</script>

<ImageLightbox
	bind:open={() => open, setOpen}
	src={loaded?.objectUrl ?? ''}
	alt="Crop this screenshot again"
	content={cropStep}
/>

{#snippet cropStep()}
	<div class="flex w-[min(80vw,960px)] flex-col gap-3">
		<fieldset class="flex flex-wrap items-center gap-2 text-xs text-gray-300">
			<legend class="sr-only">What the new crop becomes</legend>
			{#each ['replace', ...DIFFICULTIES] as option (option)}
				<label
					class="has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:ring-accent cursor-pointer rounded-md border border-gray-700 px-3 py-1 has-[:checked]:text-white has-[:focus-visible]:ring-2"
				>
					<input
						type="radio"
						name="recrop-target"
						value={option}
						bind:group={target}
						class="sr-only"
					/>
					{option === 'replace'
						? 'Replace this shot'
						: `Add as a new ${DIFFICULTY_LABELS[option as Difficulty]} shot`}
				</label>
			{/each}
		</fieldset>
		<p class="text-[11px] text-gray-500">
			{base === 'source'
				? 'Cropping the RAWG original again — the crop can widen as well as tighten.'
				: 'An uploaded file keeps only its cropped image, so this crops that — tighter only.'}
		</p>

		{#if loaded}
			<ScreenshotCropper
				src={loaded.objectUrl}
				source={loaded.size}
				initial={loaded.initial}
				confirmLabel={target === 'replace' ? 'Replace' : 'Add shot'}
				{busy}
				{error}
				onconfirm={save}
				oncancel={() => setOpen(false)}
			/>
		{:else if error}
			<p role="alert" class="text-sm text-red-300">{error}</p>
		{:else}
			<p class="flex items-center gap-2 text-sm text-gray-400">
				<Spinner label="Loading" /> Loading the image…
			</p>
		{/if}
	</div>
{/snippet}
