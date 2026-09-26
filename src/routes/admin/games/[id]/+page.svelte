<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { gameListQueryString } from '$lib/adminList';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import ImageLightbox from '$lib/components/admin/ImageLightbox.svelte';
	import RawgPicker from '$lib/components/admin/RawgPicker.svelte';
	import RecropDialog from '$lib/components/admin/RecropDialog.svelte';
	import ScreenshotUpload from '$lib/components/admin/ScreenshotUpload.svelte';
	import Spinner from '$lib/components/admin/Spinner.svelte';
	import TierToggle from '$lib/components/admin/TierToggle.svelte';
	import { appendCrop } from '$lib/crop';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '$lib/screenshotTiers';
	import type { CropSelection } from '$lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const TIER_TEXT: Record<Difficulty, { chip: string; empty: string }> = {
		normal: {
			chip: 'bg-emerald-800 text-emerald-100',
			empty: 'No Normal shot — this game never appears in a Normal round.'
		},
		pro: {
			chip: 'bg-sky-800 text-sky-100',
			empty: 'No Pro shot — Pro rounds will skip this game.'
		}
	};

	let deleteOpen = $state(false);
	let deleting = $state(false);
	/**
	 * Adding to a slot that already has a primary: whether the new shot takes
	 * over. On by default — adding a shot to a filled slot is almost always
	 * meant to change what players see. The old one stays as an extra.
	 */
	let makePrimary = $state(true);

	/** Confirms the last add next to where it happened, and marks the new shot. */
	let notice: { screenshotId: number; text: string } | null = $state(null);
	const slotElements: Partial<Record<Difficulty, HTMLElement>> = $state({});

	/** The shot being cropped again, if any. */
	let recropShot: PageData['game']['screenshots'][number] | null = $state(null);

	let lightboxUrl: string | null = $state(null);
	let lightboxCaption = $state('');
	let lightboxOpen = $state(false);

	const shotsByTier = $derived(
		Object.fromEntries(
			DIFFICULTIES.map((tier) => [
				tier,
				data.game.screenshots.filter((shot) => shot.difficulty === tier)
			])
		) as Record<Difficulty, PageData['game']['screenshots']>
	);
	const hasNormal = $derived(shotsByTier.normal.length > 0);

	/**
	 * Where the next upload or RAWG import goes. It follows the first empty slot
	 * until the operator picks one, and that pick is forgotten on another game.
	 */
	interface TierChoice {
		gameId: number;
		tier: Difficulty;
	}
	// Cast rather than annotated: TypeScript narrows an annotated `null` to
	// `never` inside the `$derived` below.
	let chosenTier = $state(null as TierChoice | null);
	const defaultTier: Difficulty = $derived(
		!hasNormal ? 'normal' : shotsByTier.pro.length === 0 ? 'pro' : 'normal'
	);
	const addTier: Difficulty = $derived(
		chosenTier?.gameId === data.game.id ? chosenTier.tier : defaultTier
	);
	let addArea: HTMLElement | undefined = $state();

	function chooseTier(tier: Difficulty) {
		chosenTier = { gameId: data.game.id, tier };
	}

	function addTo(tier: Difficulty) {
		chooseTier(tier);
		addArea?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

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

	/**
	 * Every add on this page goes through here: a cropped file the moment its
	 * crop is confirmed, a RAWG import the moment it is chosen. Both have already
	 * been cropped and re-encoded in the browser — one code path for every image
	 * is the point — and land in the slot picked above, straight away.
	 */
	async function addShot(file: File, selection: CropSelection, sourceUrl: string | null = null) {
		const tier = addTier;
		const takesOver = shotsByTier[tier].length > 0 && makePrimary;
		const body = new FormData();
		body.set('screenshot', file, file.name);
		body.set('difficulty', tier);
		if (sourceUrl) body.set('sourceUrl', sourceUrl);
		if (takesOver) body.set('makePrimary', '1');
		appendCrop(body, selection);

		// An action's fail() still answers HTTP 200, so read the result itself.
		const upload = await fetch('?/upload', { method: 'POST', body });
		const result = deserialize(await upload.text());
		if (result.type !== 'success') {
			const message = result.type === 'failure' ? result.data?.error : null;
			throw new Error(typeof message === 'string' ? message : 'The upload failed.');
		}

		await invalidateAll();
		const label = DIFFICULTY_LABELS[tier];
		notice = {
			screenshotId: Number(result.data?.screenshotId),
			text:
				shotsByTier[tier].length === 1
					? `Added the ${label} shot.`
					: takesOver
						? `Added to ${label} as its primary — the previous one stays as an extra.`
						: `Added to ${label} as an extra — the primary is unchanged.`
		};
		slotElements[tier]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}

	function uploadChosen(file: File, sourceUrl: string, selection: CropSelection) {
		return addShot(file, selection, sourceUrl);
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

{#if data.warning}
	<p
		role="alert"
		class="mb-4 rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-sm text-amber-200"
	>
		{data.warning} Add one below.
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
						{#if !hasNormal}
							Published, but it has no Normal screenshot, so a round never shows it.
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

		<!-- enhanced so a save never reloads the page (and drops a pick in progress) -->
		<form
			method="POST"
			action="?/update"
			class="space-y-4"
			use:enhance={() =>
				async ({ update }) => {
					notice = null;
					await update({ reset: false });
				}}
		>
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
			<div class="flex flex-wrap items-center gap-3">
				<button
					type="submit"
					class="cursor-pointer rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-500"
				>
					Save details
				</button>
				<p class="text-xs text-gray-500">
					Name, year and slug only — screenshots are saved as you add them.
				</p>
			</div>
		</form>
	</section>

	<section class="rounded-xl border border-gray-800 bg-gray-900 p-6">
		<h2 class="mb-4 text-lg font-semibold text-white">
			Screenshots <span class="text-sm font-normal text-gray-500">
				({data.game.screenshots.length})</span
			>
		</h2>

		<div class="space-y-6">
			{#each DIFFICULTIES as tier (tier)}
				{@const other = tier === 'normal' ? 'pro' : 'normal'}
				<div bind:this={slotElements[tier]} class="scroll-mt-4">
					<h3 class="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
						<span class="rounded px-2 py-0.5 text-[10px] font-semibold {TIER_TEXT[tier].chip}">
							{DIFFICULTY_LABELS[tier].toUpperCase()}
						</span>
						<span class="text-xs font-normal text-gray-500">{shotsByTier[tier].length}</span>
					</h3>

					<div class="space-y-3">
						{#each shotsByTier[tier] as shot (shot.id)}
							<div
								class="flex gap-3 rounded-lg border bg-gray-950 p-3 {notice?.screenshotId ===
								shot.id
									? 'border-purple-500 ring-1 ring-purple-500'
									: 'border-gray-800'}"
							>
								<button
									type="button"
									title="View full size"
									onclick={() => openLightbox(shot.url)}
									class="h-20 w-32 shrink-0 cursor-pointer overflow-hidden rounded border border-transparent hover:border-purple-500"
								>
									<img
										src={resolveScreenshotUrl(shot.url)}
										alt="{DIFFICULTY_LABELS[tier]} screenshot of {data.game.name}"
										loading="lazy"
										class="h-full w-full object-cover"
									/>
								</button>
								<div class="min-w-0 flex-1">
									<div class="mb-2 flex flex-wrap items-center gap-3">
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
										<button
											type="button"
											onclick={() => (recropShot = shot)}
											class="cursor-pointer text-[11px] text-gray-500 hover:text-purple-400"
										>
											Crop again
										</button>
										<!-- a move never displaces the other slot's primary -->
										<form method="POST" action="?/move" use:enhance>
											<input type="hidden" name="screenshotId" value={shot.id} />
											<input type="hidden" name="difficulty" value={other} />
											<button
												type="submit"
												class="cursor-pointer text-[11px] text-gray-500 hover:text-purple-400"
											>
												Move to {DIFFICULTY_LABELS[other]}
											</button>
										</form>
									</div>

									<div class="flex flex-col gap-0.5">
										<!-- image URLs, not app routes -->
										<!-- eslint-disable svelte/no-navigation-without-resolve -->
										<a
											href={resolveScreenshotUrl(shot.url)}
											target="_blank"
											rel="noopener noreferrer"
											class="truncate text-[11px] text-gray-600 hover:text-gray-400"
										>
											{shot.url}
										</a>
										{#if shot.crop}
											<span class="font-mono text-[11px] text-gray-600">
												Crop {shot.crop.width}×{shot.crop.height} at {shot.crop.x},{shot.crop.y}
											</span>
										{/if}
										{#if shot.sourceUrl}
											<a
												href={shot.sourceUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="truncate text-[11px] text-gray-600 hover:text-gray-400"
											>
												Source: {shot.sourceUrl}
											</a>
										{/if}
										<!-- eslint-enable svelte/no-navigation-without-resolve -->
									</div>
								</div>

								<form method="POST" action="?/deleteScreenshot" use:enhance>
									<input type="hidden" name="screenshotId" value={shot.id} />
									<button
										type="submit"
										class="cursor-pointer text-xs text-gray-600 hover:text-red-400"
									>
										Remove
									</button>
								</form>
							</div>
						{:else}
							<div
								class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-4 text-sm {tier ===
								'normal'
									? 'border-red-900 text-red-300'
									: 'border-gray-800 text-gray-500'}"
							>
								<span>{TIER_TEXT[tier].empty}</span>
								<button
									type="button"
									onclick={() => addTo(tier)}
									class="cursor-pointer text-xs text-purple-400 hover:text-purple-300"
								>
									Add a {DIFFICULTY_LABELS[tier]} shot ↓
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div bind:this={addArea} class="mt-5 scroll-mt-4 border-t border-gray-800 pt-5">
			<h3 class="mb-2 text-sm font-medium text-gray-300">Add a screenshot</h3>
			<TierToggle bind:value={() => addTier, chooseTier} name="add-tier" />
			{#if shotsByTier[addTier].length > 0}
				<label class="mt-2 flex cursor-pointer items-start gap-2 text-xs text-gray-400">
					<input
						type="checkbox"
						bind:checked={makePrimary}
						class="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-purple-500"
					/>
					<span>
						Make it the {DIFFICULTY_LABELS[addTier]} primary — the shot players see. The current one stays
						as an extra.
					</span>
				</label>
			{:else}
				<p class="mt-1 text-xs text-gray-500">
					The {DIFFICULTY_LABELS[addTier]} slot is empty, so the new shot becomes its primary.
				</p>
			{/if}
			<p class="mt-1 text-xs text-gray-500">
				A file or a RAWG shot is added the moment its crop is confirmed — no separate save.
			</p>
			{#if notice}
				<p
					role="status"
					class="mt-3 rounded-lg border border-green-800 bg-green-950/50 p-2 text-xs text-green-200"
				>
					{notice.text}
				</p>
			{/if}
		</div>

		<div class="mt-4">
			<label class="mb-1 block text-sm font-medium text-gray-300" for="screenshot">
				From a file
			</label>
			{#if !data.blobConfigured}
				<p
					class="mb-2 rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-xs text-amber-200"
				>
					<code>BLOB_READ_WRITE_TOKEN</code> is not set for this environment — uploads will fail.
				</p>
			{/if}
			<ScreenshotUpload
				onconfirm={(file, selection) => addShot(file, selection)}
				confirmLabel="Add to {DIFFICULTY_LABELS[addTier]}"
			/>
		</div>

		<div class="mt-5 border-t border-gray-800 pt-5">
			<RawgPicker
				configured={data.rawgConfigured}
				gameName={data.game.name}
				filename={data.game.slug}
				onchoose={uploadChosen}
			/>
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

{#if recropShot}
	{#key recropShot.id}
		<RecropDialog shot={recropShot} filename={data.game.slug} onclose={() => (recropShot = null)} />
	{/key}
{/if}

{#if lightboxUrl}
	<ImageLightbox
		bind:open={lightboxOpen}
		src={lightboxUrl}
		alt="Screenshot of {data.game.name}"
		caption={lightboxCaption}
	/>
{/if}
