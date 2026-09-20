<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { gameListQueryString } from '$lib/adminList';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import ImageLightbox from '$lib/components/admin/ImageLightbox.svelte';
	import ScreenshotUpload from '$lib/components/admin/ScreenshotUpload.svelte';
	import Spinner from '$lib/components/admin/Spinner.svelte';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import type { RawgCandidate } from '$lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const difficulties = ['easy', 'medium', 'hard'] as const;

	let deleteOpen = $state(false);
	let deleting = $state(false);
	let uploader: ScreenshotUpload | undefined = $state();
	let uploading = $state(false);

	let rawgQuery: string = $state('');
	let rawgResults: RawgCandidate[] = $state([]);
	let rawgError: string | null = $state(null);
	let rawgLoading = $state(false);
	/** The RAWG image currently being imported — also blocks the other tiles. */
	let importingImage: string | null = $state(null);

	let lightboxUrl: string | null = $state(null);
	let lightboxCaption = $state('');
	let lightboxOpen = $state(false);

	const listQuery = $derived(gameListQueryString(data.query));
	const backHref = $derived(resolve('/admin/games') + listQuery);

	function neighbourHref(id: number): string {
		return resolve('/admin/games/[id]', { id: String(id) }) + listQuery;
	}

	function openLightbox(url: string) {
		lightboxUrl = resolveScreenshotUrl(url);
		lightboxCaption = url;
		lightboxOpen = true;
	}

	async function searchRawg(event: SubmitEvent) {
		event.preventDefault();
		const query = rawgQuery.trim() || data.game.name;
		rawgLoading = true;
		rawgError = null;

		try {
			const response = await fetch(`${resolve('/api/admin/rawg')}?q=${encodeURIComponent(query)}`);
			const body = await response.json();
			if (!response.ok) throw new Error(body.error ?? 'The lookup failed.');
			rawgResults = body.results;
			if (rawgResults.length === 0) rawgError = 'RAWG found nothing for that search.';
		} catch (err) {
			rawgError = err instanceof Error ? err.message : 'The lookup failed.';
			rawgResults = [];
		} finally {
			rawgLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{data.game.name} — Geekster Admin</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-start justify-between gap-3">
	<div>
		<!-- the back link carries the list's own sort and filter -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a href={backHref} class="text-xs text-gray-500 hover:text-gray-300">← All games</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
		<h1 class="flex flex-wrap items-center gap-2 text-2xl font-bold text-white">
			{data.game.name}
			{#if !data.game.published}
				<span
					class="rounded border border-amber-700 bg-amber-950/70 px-2 py-0.5 text-xs font-semibold text-amber-300"
				>
					DRAFT
				</span>
			{/if}
		</h1>
		<p class="font-mono text-xs text-gray-500">#{data.game.id} · {data.game.slug}</p>
	</div>

	<div class="flex items-center gap-2">
		<!-- prev/next walk the list order the query string carries -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<nav
			aria-label="Previous and next game"
			class="flex items-center rounded-lg border border-gray-800 bg-gray-900 p-1"
		>
			{#if data.neighbours.previous}
				<a
					href={neighbourHref(data.neighbours.previous.id)}
					title={data.neighbours.previous.name}
					aria-label="Previous game: {data.neighbours.previous.name}"
					class="rounded p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white"
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
				</a>
			{:else}
				<span class="p-1.5 text-gray-700" aria-hidden="true">
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M15 18l-6-6 6-6" />
					</svg>
				</span>
			{/if}

			{#if data.neighbours.position > 0}
				<span class="px-2 text-xs whitespace-nowrap text-gray-500">
					{data.neighbours.position} / {data.neighbours.total}
				</span>
			{/if}

			{#if data.neighbours.next}
				<a
					href={neighbourHref(data.neighbours.next.id)}
					title={data.neighbours.next.name}
					aria-label="Next game: {data.neighbours.next.name}"
					class="rounded p-1.5 text-gray-300 hover:bg-gray-800 hover:text-white"
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
				</a>
			{:else}
				<span class="p-1.5 text-gray-700" aria-hidden="true">
					<svg
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M9 18l6-6-6-6" />
					</svg>
				</span>
			{/if}
		</nav>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->

		<button
			type="button"
			onclick={() => (deleteOpen = true)}
			class="cursor-pointer rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950"
		>
			Delete game
		</button>
	</div>
</div>

{#if form?.error}
	<p
		role="alert"
		class="mb-4 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200"
	>
		{form.error}
	</p>
{:else if form?.saved || form?.uploaded}
	<p class="mb-4 rounded-lg border border-green-800 bg-green-950/50 p-3 text-sm text-green-200">
		Saved.
	</p>
{/if}

{#if data.game.screenshots.length === 0}
	<p
		role="alert"
		class="mb-4 flex items-center gap-2 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-200"
	>
		<span aria-hidden="true">⚠</span>
		This game has no screenshot, so it is hidden from the game. Upload one or import it from RAWG.
	</p>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
	<section class="rounded-xl border border-gray-800 bg-gray-900 p-6">
		<h2 class="mb-4 text-lg font-semibold text-white">Details</h2>
		<div
			class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 {data.game
				.published
				? 'border-gray-800 bg-gray-900/40'
				: 'border-amber-900 bg-amber-950/30'}"
		>
			<div class="text-sm">
				<p class="font-medium {data.game.published ? 'text-gray-200' : 'text-amber-200'}">
					{data.game.published ? 'Published' : 'Draft — hidden from players'}
				</p>
				<p class="mt-0.5 text-xs text-gray-500">
					{#if data.game.published}
						{#if data.game.screenshots.length === 0}
							Published, but it still has no screenshot, so a round never shows it.
						{:else}
							Live: it can appear in a round.
						{/if}
					{:else}
						A draft never appears in a round, however many screenshots it has.
					{/if}
				</p>
			</div>
			<form method="POST" action="?/publish" use:enhance>
				<input type="hidden" name="published" value={data.game.published ? '0' : '1'} />
				<button
					type="submit"
					class="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold {data.game.published
						? 'border border-gray-700 text-gray-300 hover:bg-gray-800'
						: 'bg-amber-600 text-white hover:bg-amber-500'}"
				>
					{data.game.published ? 'Unpublish' : 'Publish'}
				</button>
			</form>
		</div>

		<form method="POST" action="?/update" class="space-y-4">
			<div>
				<label class="mb-1 block text-sm font-medium text-gray-300" for="name">Name</label>
				<input
					id="name"
					name="name"
					required
					value={data.game.name}
					class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-purple-500"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm font-medium text-gray-300" for="year">Release year</label>
				<input
					id="year"
					name="year"
					type="number"
					required
					min="1958"
					max={new Date().getFullYear() + 2}
					value={data.game.year}
					class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-purple-500"
				/>
			</div>
			<div>
				<label class="mb-1 block text-sm font-medium text-gray-300" for="slug">Slug</label>
				<input
					id="slug"
					name="slug"
					value={data.game.slug}
					class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-purple-500"
				/>
				<p class="mt-1 text-xs text-gray-500">
					Renaming the slug does not move files already in the blob store.
				</p>
			</div>
			<button
				type="submit"
				class="cursor-pointer rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-500"
			>
				Save
			</button>
		</form>
	</section>

	<section class="rounded-xl border border-gray-800 bg-gray-900 p-6">
		<h2 class="mb-4 text-lg font-semibold text-white">
			Screenshots <span class="text-sm font-normal text-gray-500">
				({data.game.screenshots.length})</span
			>
		</h2>

		<div class="space-y-4">
			{#each data.game.screenshots as shot (shot.id)}
				<div class="flex gap-3 rounded-lg border border-gray-800 bg-gray-950 p-3">
					<button
						type="button"
						title="View full size"
						onclick={() => openLightbox(shot.url)}
						class="h-20 w-32 shrink-0 cursor-pointer overflow-hidden rounded border border-transparent hover:border-purple-500"
					>
						<img
							src={resolveScreenshotUrl(shot.url)}
							alt="Screenshot of {data.game.name}"
							loading="lazy"
							class="h-full w-full object-cover"
						/>
					</button>
					<div class="min-w-0 flex-1">
						<div class="mb-2 flex items-center gap-2">
							{#if shot.isPrimary}
								<span
									class="rounded bg-purple-600 px-2 py-0.5 text-[10px] font-semibold text-white"
								>
									PRIMARY
								</span>
							{:else}
								<form method="POST" action="?/primary" use:enhance>
									<input type="hidden" name="screenshotId" value={shot.id} />
									<button
										type="submit"
										class="cursor-pointer text-[11px] text-gray-500 hover:text-purple-400"
									>
										Make primary
									</button>
								</form>
							{/if}
						</div>

						<form method="POST" action="?/difficulty" use:enhance class="flex items-center gap-2">
							<input type="hidden" name="screenshotId" value={shot.id} />
							<select
								name="difficulty"
								value={shot.difficulty}
								onchange={(event) => event.currentTarget.form?.requestSubmit()}
								class="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200"
							>
								{#each difficulties as level (level)}
									<option value={level}>{level}</option>
								{/each}
							</select>
							<noscript><button type="submit" class="text-xs text-gray-400">Set</button></noscript>
						</form>

						<div class="mt-2 flex items-center gap-3">
							<!-- an image URL, not an app route -->
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<a
								href={resolveScreenshotUrl(shot.url)}
								target="_blank"
								rel="noopener noreferrer"
								class="truncate text-[11px] text-gray-600 hover:text-gray-400"
							>
								{shot.url}
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</div>
					</div>

					<form method="POST" action="?/deleteScreenshot" use:enhance>
						<input type="hidden" name="screenshotId" value={shot.id} />
						<button type="submit" class="cursor-pointer text-xs text-gray-600 hover:text-red-400">
							Remove
						</button>
					</form>
				</div>
			{:else}
				<p class="rounded-lg border border-dashed border-gray-800 p-4 text-sm text-gray-500">
					No screenshot yet — this game will not appear in a round until it has a primary one.
				</p>
			{/each}
		</div>

		<form
			method="POST"
			action="?/upload"
			enctype="multipart/form-data"
			class="mt-5 border-t border-gray-800 pt-5"
			use:enhance={({ formData }) => {
				// Send the downscaled WebP the component produced, not the original.
				const file = uploader?.takeFile();
				if (file) formData.set('screenshot', file, file.name);
				uploading = true;
				return async ({ update }) => {
					uploading = false;
					await update();
				};
			}}
		>
			<label class="mb-1 block text-sm font-medium text-gray-300" for="screenshot">
				Upload a screenshot
			</label>
			{#if !data.blobConfigured}
				<p
					class="mb-2 rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-xs text-amber-200"
				>
					<code>BLOB_READ_WRITE_TOKEN</code> is not set for this environment — uploads will fail.
				</p>
			{/if}
			<div class="flex gap-2">
				<div class="w-full">
					<ScreenshotUpload bind:this={uploader} required />
				</div>
				<button
					type="submit"
					disabled={uploading}
					class="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-gray-700 px-4 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-60"
				>
					{#if uploading}<Spinner label="Uploading" />{/if}
					Upload
				</button>
			</div>
		</form>

		<div class="mt-5 border-t border-gray-800 pt-5">
			<h3 class="mb-2 text-sm font-medium text-gray-300">Import from RAWG</h3>

			{#if !data.rawgConfigured}
				<p class="rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-xs text-amber-200">
					<code>RAWG_API_KEY</code> is not set for this environment.
				</p>
			{:else}
				<form onsubmit={searchRawg} class="flex gap-2">
					<input
						bind:value={rawgQuery}
						placeholder={data.game.name}
						class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
					/>
					<button
						type="submit"
						disabled={rawgLoading}
						class="flex w-24 cursor-pointer items-center justify-center rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-50"
					>
						{#if rawgLoading}
							<Spinner label="Searching RAWG" />
						{:else}
							Search
						{/if}
					</button>
				</form>

				{#if rawgError}
					<p class="mt-2 text-xs text-red-300">{rawgError}</p>
				{/if}

				{#each rawgResults as candidate (candidate.id)}
					<div class="mt-4">
						<p class="mb-2 text-xs text-gray-400">
							{candidate.name}
							{#if candidate.year}<span class="text-gray-600">· {candidate.year}</span>{/if}
						</p>
						<div class="flex flex-wrap gap-2">
							{#each candidate.screenshots as image (image)}
								<form
									method="POST"
									action="?/rawgImport"
									use:enhance={() => {
										// One import at a time — a second click used to add the
										// same screenshot twice while the first was still running.
										importingImage = image;
										return async ({ update }) => {
											await update();
											importingImage = null;
										};
									}}
								>
									<input type="hidden" name="imageUrl" value={image} />
									<button
										type="submit"
										title="Import this screenshot"
										disabled={importingImage !== null}
										class="relative block cursor-pointer overflow-hidden rounded border border-gray-800 hover:border-purple-500 disabled:cursor-wait disabled:hover:border-gray-800"
									>
										<img
											src={image}
											alt=""
											loading="lazy"
											class="h-16 w-28 object-cover transition-opacity {importingImage !== null
												? 'opacity-30'
												: ''}"
										/>
										{#if importingImage === image}
											<span class="absolute inset-0 flex items-center justify-center text-white">
												<Spinner label="Importing" class="h-6 w-6" />
											</span>
										{/if}
									</button>
								</form>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</section>
</div>

<ConfirmDialog
	bind:open={deleteOpen}
	title="Delete {data.game.name}?"
	description="The game and all of its screenshots are removed from the database, and the screenshot files are deleted from the blob store. This cannot be undone."
>
	{#snippet confirm()}
		<form
			method="POST"
			action="?/delete"
			use:enhance={() => {
				deleting = true;
				return async ({ update }) => {
					deleting = false;
					await update();
				};
			}}
		>
			<button
				type="submit"
				disabled={deleting}
				class="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
			>
				{#if deleting}<Spinner label="Deleting" />{/if}
				Delete game
			</button>
		</form>
	{/snippet}
</ConfirmDialog>

{#if lightboxUrl}
	<ImageLightbox
		bind:open={lightboxOpen}
		src={lightboxUrl}
		alt="Screenshot of {data.game.name}"
		caption={lightboxCaption}
	/>
{/if}
