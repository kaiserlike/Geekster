<script lang="ts">
	/**
	 * The encyclopedia's image of a game (12c, decision 12-2): RAWG's key art or a file, cropped
	 * to 16:9 and encoded in the browser like every image, posted to `?/cover`. Players never see
	 * it; the year pages never see a screenshot.
	 */
	import { deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import RawgPicker from '$lib/components/admin/RawgPicker.svelte';
	import ScreenshotUpload from '$lib/components/admin/ScreenshotUpload.svelte';
	import Spinner from '$lib/components/admin/Spinner.svelte';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import type { AdminGameDetail, RawgCandidate } from '$lib/types';

	interface Props {
		game: AdminGameDetail;
		rawgConfigured: boolean;
		blobConfigured: boolean;
		onopen: (url: string) => void;
	}

	let { game, rawgConfigured, blobConfigured, onopen }: Props = $props();

	let removing = $state(false);
	let notice: string | null = $state(null);

	async function saveCover(file: File, sourceUrl: string | null, rawgSlug: string | null) {
		const body = new FormData();
		body.set('cover', file, file.name);
		if (sourceUrl) body.set('sourceUrl', sourceUrl);
		if (rawgSlug) body.set('rawgSlug', rawgSlug);

		// An action's fail() still answers HTTP 200, so read the result itself.
		const response = await fetch('?/cover', { method: 'POST', body });
		const result = deserialize(await response.text());
		if (result.type !== 'success') {
			const message = result.type === 'failure' ? result.data?.error : null;
			throw new Error(typeof message === 'string' ? message : 'The upload failed.');
		}
		await invalidateAll();
		notice = 'Cover saved.';
	}

	function chooseFromRawg(
		file: File,
		sourceUrl: string,
		_selection: unknown,
		candidate: RawgCandidate
	): Promise<void> {
		return saveCover(file, sourceUrl, candidate.slug);
	}
</script>

<section class="rounded-xl border border-gray-800 bg-gray-900 p-6">
	<h2 class="mb-1 text-lg font-semibold text-white">Cover</h2>
	<p class="mb-4 text-xs text-gray-400">
		Shown only on the encyclopedia’s year pages, never in the game. Use key art, never a screenshot:
		a year page that showed a puzzle would give the Daily away. A RAWG image a screenshot was cut
		from is refused; a file cannot be checked.
		{#if game.rawgSlug}
			RAWG page:
			<a
				href="https://rawg.io/games/{game.rawgSlug}"
				target="_blank"
				rel="noopener noreferrer"
				class="hover:text-accent font-mono underline">{game.rawgSlug}</a
			>.
		{/if}
	</p>

	<div class="flex flex-wrap items-start gap-4">
		{#if game.coverUrl}
			<button
				type="button"
				onclick={() => onopen(game.coverUrl!)}
				class="hover:border-accent block cursor-zoom-in overflow-hidden rounded border border-gray-700"
			>
				<img
					src={resolveScreenshotUrl(game.coverUrl)}
					alt="Cover of {game.name}"
					class="aspect-video w-64 object-cover"
				/>
			</button>
			<form
				method="POST"
				action="?/removeCover"
				use:enhance={() => {
					removing = true;
					notice = null;
					return async ({ update }) => {
						removing = false;
						await update();
					};
				}}
			>
				<button
					type="submit"
					disabled={removing}
					class="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:border-red-700 hover:text-red-300 disabled:opacity-60"
				>
					{#if removing}<Spinner label="Removing" />{/if}
					Remove cover
				</button>
			</form>
		{:else}
			<p
				class="flex aspect-video w-64 items-center justify-center rounded border border-dashed border-gray-700 text-xs text-gray-500"
			>
				No cover yet
			</p>
		{/if}
	</div>

	{#if notice}
		<p
			role="status"
			class="mt-3 rounded-lg border border-green-800 bg-green-950/50 p-2 text-xs text-green-200"
		>
			{notice}
		</p>
	{/if}

	<div class="mt-4">
		<label class="mb-1 block text-sm font-medium text-gray-300" for="cover">From a file</label>
		{#if !blobConfigured}
			<p class="mb-2 rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-xs text-amber-200">
				<code>BLOB_READ_WRITE_TOKEN</code> is not set for this environment — uploads will fail.
			</p>
		{/if}
		<ScreenshotUpload
			id="cover"
			name="cover"
			onconfirm={(file) => saveCover(file, null, null)}
			confirmLabel="Use as cover"
		/>
	</div>

	<div class="mt-5 border-t border-gray-800 pt-5">
		<RawgPicker
			kind="cover"
			configured={rawgConfigured}
			gameName={game.name}
			filename={`${game.slug}-cover`}
			chooseLabel="Use as cover"
			onchoose={chooseFromRawg}
		/>
	</div>
</section>
