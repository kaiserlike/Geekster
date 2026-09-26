<script lang="ts">
	/**
	 * Search RAWG, preview a candidate at full size, crop it to 16:9, and hand the
	 * result to the caller as a WebP.
	 *
	 * The crop step replaces the image inside the same lightbox rather than
	 * opening a second dialog on top: one focus trap, and Escape means one thing.
	 *
	 * The component owns everything up to the encoded file and nothing after it:
	 * the edit page POSTs it to `?/upload` straight away, while the new-game form
	 * holds on to it until the game it belongs to exists. That split is the whole
	 * reason this is a component — the fetch, the re-encode and the preview are
	 * identical on both pages, only the destination differs.
	 */
	import { resolve } from '$app/paths';
	import ImageLightbox from '$lib/components/admin/ImageLightbox.svelte';
	import ScreenshotCropper from '$lib/components/admin/ScreenshotCropper.svelte';
	import Spinner from '$lib/components/admin/Spinner.svelte';
	import { readImageSize, toWebp } from '$lib/imageEncode';
	import type { CropSelection, PixelSize, RawgCandidate } from '$lib/types';

	interface Props {
		/** Whether `RAWG_API_KEY` is set for this environment. */
		configured: boolean;
		/** Prefills the search box and is the query when the box is left empty. */
		gameName: string;
		/** Basename for the encoded file. The blob is named from the server's slug. */
		filename?: string;
		/** Label on the button inside the lightbox. */
		chooseLabel?: string;
		/**
		 * Handed the cropped WebP the browser produced from the chosen RAWG
		 * image, the rawg.io URL it came from (stored as the screenshot's
		 * `source_url`) and the crop in that image's pixels. A rejection is
		 * rendered inside the lightbox — the operator is looking at the open
		 * dialog, not at the page behind it. Resolving closes it.
		 */
		onchoose: (file: File, sourceUrl: string, selection: CropSelection) => Promise<void> | void;
	}

	let {
		configured,
		gameName,
		filename,
		chooseLabel = 'Use this screenshot',
		onchoose
	}: Props = $props();

	let query = $state('');
	let results: RawgCandidate[] = $state([]);
	let error: string | null = $state(null);
	let searching = $state(false);
	/** The image being fetched and encoded — also blocks every other tile. */
	let busyImage: string | null = $state(null);

	/**
	 * The candidate being previewed. A thumbnail opens the lightbox rather than
	 * importing straight away — the tiles are small, it is easy to pick the wrong
	 * one, and a choice is not cheap to undo.
	 */
	let previewShots: string[] = $state([]);
	let previewIndex = $state(0);
	let previewOpen = $state(false);

	const previewImage = $derived(previewShots[previewIndex] ?? null);

	/**
	 * The image being cropped: the exact bytes the proxy returned, so the crop is
	 * drawn on the same pixels `toWebp()` will cut. Null while previewing.
	 */
	interface CropSource {
		image: string;
		blob: Blob;
		objectUrl: string;
		size: PixelSize;
	}
	let cropSource: CropSource | null = $state(null);
	let encoding = $state(false);

	function dropCrop() {
		if (cropSource) URL.revokeObjectURL(cropSource.objectUrl);
		cropSource = null;
		error = null;
	}

	function setPreviewOpen(open: boolean) {
		previewOpen = open;
		if (!open) dropCrop();
	}

	function openPreview(shots: string[], index: number) {
		dropCrop();
		previewShots = shots;
		previewIndex = index;
		error = null;
		previewOpen = true;
	}

	function stepPreview(delta: number) {
		const next = previewIndex + delta;
		if (next >= 0 && next < previewShots.length) {
			previewIndex = next;
			error = null;
		}
	}

	/**
	 * Fetch the bytes through our own origin and switch the lightbox to the crop
	 * step. There is deliberately no server-side import — one code path for
	 * every image is the point.
	 */
	async function startCrop(image: string) {
		if (busyImage) return;
		busyImage = image;
		error = null;

		try {
			const proxied = `${resolve('/api/admin/rawg/image')}?url=${encodeURIComponent(image)}`;
			const response = await fetch(proxied);
			if (!response.ok) throw new Error((await response.text()) || 'Could not fetch that image.');

			const blob = await response.blob();
			const size = await readImageSize(blob);
			cropSource = { image, blob, objectUrl: URL.createObjectURL(blob), size };
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not load that screenshot.';
		} finally {
			busyImage = null;
		}
	}

	/** Cut and re-encode in the browser, then let the caller decide where it goes. */
	async function finish(selection: CropSelection) {
		if (!cropSource || encoding) return;
		encoding = true;
		error = null;

		try {
			const file = await toWebp(cropSource.blob, {
				filename: filename || 'screenshot',
				crop: selection.crop
			});
			await onchoose(file, cropSource.image, selection);
			setPreviewOpen(false);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not import that screenshot.';
		} finally {
			encoding = false;
		}
	}

	/**
	 * Enter must not reach the form this picker may be sitting inside. The search
	 * is a plain input and a button rather than a `<form>` for the same reason:
	 * the new-game page renders it inside its own create form, and nested forms
	 * are not valid HTML.
	 */
	function onkeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		search();
	}

	async function search() {
		const term = query.trim() || gameName.trim();
		if (!term) {
			error = 'Type a game name to search RAWG for.';
			return;
		}

		searching = true;
		error = null;

		try {
			const response = await fetch(`${resolve('/api/admin/rawg')}?q=${encodeURIComponent(term)}`);
			const body = await response.json();
			if (!response.ok) throw new Error(body.error ?? 'The lookup failed.');
			results = body.results;
			if (results.length === 0) error = 'RAWG found nothing for that search.';
		} catch (err) {
			error = err instanceof Error ? err.message : 'The lookup failed.';
			results = [];
		} finally {
			searching = false;
		}
	}
</script>

<h3 class="mb-2 text-sm font-medium text-gray-300">Import from RAWG</h3>

{#if !configured}
	<p class="rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-xs text-amber-200">
		<code>RAWG_API_KEY</code> is not set for this environment.
	</p>
{:else}
	<div class="flex gap-2">
		<input
			bind:value={query}
			{onkeydown}
			placeholder={gameName || 'Game name'}
			aria-label="Search RAWG"
			class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
		/>
		<button
			type="button"
			onclick={() => search()}
			disabled={searching}
			class="flex w-24 cursor-pointer items-center justify-center rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
		>
			{#if searching}
				<Spinner label="Searching RAWG" />
			{:else}
				Search
			{/if}
		</button>
	</div>

	{#if error}
		<p class="mt-2 text-xs text-red-300">{error}</p>
	{/if}

	{#each results as candidate (candidate.id)}
		<div class="mt-4">
			<p class="mb-2 text-xs text-gray-400">
				{candidate.name}
				{#if candidate.year}<span class="text-gray-600">· {candidate.year}</span>{/if}
			</p>
			<div class="flex flex-wrap gap-2">
				{#each candidate.screenshots as image, index (image)}
					<!--
						One choice at a time — a second click used to import the same
						screenshot twice while the first was still running.
					-->
					<button
						type="button"
						title="Preview this screenshot"
						onclick={() => openPreview(candidate.screenshots, index)}
						disabled={busyImage !== null}
						class="relative block cursor-pointer overflow-hidden rounded border border-gray-800 hover:border-purple-500 disabled:cursor-wait disabled:hover:border-gray-800"
					>
						<img
							src={image}
							alt=""
							loading="lazy"
							class="h-16 w-28 object-cover transition-opacity {busyImage !== null
								? 'opacity-30'
								: ''}"
						/>
						{#if busyImage === image}
							<span class="absolute inset-0 flex items-center justify-center text-white">
								<Spinner label="Importing" class="h-6 w-6" />
							</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/each}
{/if}

{#if previewImage}
	<ImageLightbox
		bind:open={() => previewOpen, setPreviewOpen}
		src={previewImage}
		alt="RAWG screenshot {previewIndex + 1} of {previewShots.length}"
		caption={cropSource ? undefined : `${previewIndex + 1} / ${previewShots.length}`}
		onprevious={!cropSource && previewIndex > 0 ? () => stepPreview(-1) : undefined}
		onnext={!cropSource && previewIndex < previewShots.length - 1
			? () => stepPreview(1)
			: undefined}
		content={cropSource ? cropStep : undefined}
		actions={cropSource ? undefined : chooseAction}
	/>
{/if}

{#snippet cropStep()}
	{#if cropSource}
		{#key cropSource.objectUrl}
			<ScreenshotCropper
				src={cropSource.objectUrl}
				source={cropSource.size}
				cancelLabel="Back"
				busy={encoding}
				{error}
				onconfirm={finish}
				oncancel={dropCrop}
			/>
		{/key}
	{/if}
{/snippet}

{#snippet chooseAction()}
	{#if previewImage}
		<div class="flex flex-col items-center gap-2">
			<button
				type="button"
				onclick={() => startCrop(previewImage)}
				disabled={busyImage !== null}
				class="flex cursor-pointer items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
			>
				{#if busyImage}<Spinner label="Importing" />{/if}
				{chooseLabel}
			</button>
			<!-- The error would otherwise render behind the open lightbox. -->
			{#if error}
				<p role="alert" class="max-w-sm text-center text-xs text-red-300">{error}</p>
			{/if}
		</div>
	{/if}
{/snippet}
