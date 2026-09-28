<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		gameListQueryString,
		type GameListQuery,
		type GameMissing,
		type GameSort,
		type GameStatus
	} from '$lib/adminList';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import ImageLightbox from '$lib/components/admin/ImageLightbox.svelte';
	import Spinner from '$lib/components/admin/Spinner.svelte';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import type { AdminGame } from '$lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const STATUS_FILTERS: { value: GameStatus; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'draft', label: 'Drafts' },
		{ value: 'published', label: 'Published' }
	];

	const MISSING_FILTERS: { value: GameMissing | null; label: string }[] = [
		{ value: null, label: 'Any' },
		{ value: 'normal', label: 'No Normal' },
		{ value: 'pro', label: 'No Pro' },
		{ value: 'both', label: 'No screenshot' }
	];

	const MISSING_TEXT: Record<GameMissing, string> = {
		normal: ' without a Normal shot',
		pro: ' without a Pro shot',
		both: ' without a screenshot'
	};

	/** Typing fewer characters than this leaves the current result set alone. */
	const SEARCH_MIN_CHARS = 3;
	const SEARCH_DEBOUNCE_MS = 300;

	// The input seeds itself from the URL once and then owns its own value —
	// re-syncing on every load would fight whatever is being typed.
	// svelte-ignore state_referenced_locally
	let searchTerm = $state(data.query.search);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	let deleteTarget: AdminGame | null = $state(null);
	let deleteOpen = $state(false);
	let deleting = $state(false);

	let lightboxUrl: string | null = $state(null);
	let lightboxLabel = $state('');
	let lightboxOpen = $state(false);

	const listQuery = $derived(gameListQueryString(data.query));

	function detailHref(id: number): string {
		return resolve('/admin/games/[id]', { id: String(id) }) + listQuery;
	}

	function listHref(overrides: Partial<GameListQuery>): string {
		return resolve('/admin/games') + gameListQueryString(data.query, overrides);
	}

	function sortHref(column: GameSort): string {
		const direction = data.query.sort === column && data.query.direction === 'asc' ? 'desc' : 'asc';
		return listHref({ sort: column, direction });
	}

	function sortMarker(column: GameSort): string {
		if (data.query.sort !== column) return '';
		return data.query.direction === 'asc' ? ' ▲' : ' ▼';
	}

	/** Searches on its own once the term is long enough to be worth a round trip. */
	function onSearchInput() {
		clearTimeout(searchTimer);
		const term = searchTerm.trim();
		if (term.length > 0 && term.length < SEARCH_MIN_CHARS) return;

		searchTimer = setTimeout(() => {
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- listHref() is a resolve() result plus a query string
			goto(listHref({ search: term }), {
				replaceState: true,
				keepFocus: true,
				noScroll: true
			});
		}, SEARCH_DEBOUNCE_MS);
	}

	function clearSearch() {
		clearTimeout(searchTimer);
		searchTerm = '';
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- listHref() is a resolve() result plus a query string
		goto(listHref({ search: '' }), { keepFocus: true, noScroll: true });
	}

	function openRow(event: MouseEvent, game: AdminGame) {
		// Links and buttons inside the row keep their own behaviour.
		if ((event.target as HTMLElement).closest('a, button, input, select')) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- detailHref() is a resolve() result plus a query string
		goto(detailHref(game.id));
	}

	function openLightbox(url: string, label: string) {
		lightboxUrl = resolveScreenshotUrl(url);
		lightboxLabel = label;
		lightboxOpen = true;
	}

	function askDelete(game: AdminGame) {
		deleteTarget = game;
		deleteOpen = true;
	}

	$effect(() => () => clearTimeout(searchTimer));
</script>

<svelte:head>
	<title>Games — Geekster Admin</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<h1 class="text-2xl font-bold text-white">
		Games <span class="text-base font-normal text-gray-500">({data.games.length})</span>
	</h1>
	<a
		href={resolve('/admin/games/new')}
		class="bg-accent text-on-accent hover:bg-accent-strong rounded-lg px-4 py-2 text-sm font-semibold"
	>
		Add game
	</a>
</div>

{#if data.error}
	<p
		role="alert"
		class="mb-4 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200"
	>
		{data.error}
	</p>
{/if}

{#if form?.error}
	<p
		role="alert"
		class="mb-4 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200"
	>
		{form.error}
	</p>
{/if}

{#if data.missingNormal > 0}
	<!-- the filter link is a resolve() result with a query string appended -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<p
		class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-sm text-amber-200"
	>
		<span aria-hidden="true">⚠</span>
		{data.missingNormal}
		{data.missingNormal === 1 ? 'game has' : 'games have'} no Normal screenshot and never appear in a
		round.
		{#if data.query.missing === 'normal'}
			<a href={listHref({ missing: null })} class="underline hover:text-white">Show all games</a>
		{:else}
			<a href={listHref({ missing: 'normal' })} class="underline hover:text-white">Show them</a>
		{/if}
	</p>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/if}

<!-- the status links are resolve() results with a query string appended -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="mb-4 flex flex-wrap items-center gap-2 text-sm">
	<span class="text-gray-500">Status</span>
	{#each STATUS_FILTERS as filter (filter.value)}
		<a
			href={listHref({ status: filter.value })}
			aria-current={data.query.status === filter.value ? 'page' : undefined}
			class="rounded-lg border px-3 py-1 {data.query.status === filter.value
				? 'border-accent bg-accent-soft text-white'
				: 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'}"
		>
			{filter.label}{#if filter.value === 'draft' && data.drafts > 0}
				<span class="ml-1 text-amber-400">{data.drafts}</span>
			{/if}
		</a>
	{/each}
	<span class="ml-3 text-gray-500">Slots</span>
	{#each MISSING_FILTERS as filter (filter.value ?? 'any')}
		<a
			href={listHref({ missing: filter.value })}
			aria-current={data.query.missing === filter.value ? 'page' : undefined}
			class="rounded-lg border px-3 py-1 {data.query.missing === filter.value
				? 'border-accent bg-accent-soft text-white'
				: 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'}"
		>
			{filter.label}{#if filter.value === 'normal' && data.missingNormal > 0}
				<span class="ml-1 text-amber-400">{data.missingNormal}</span>
			{:else if filter.value === 'pro' && data.missingPro > 0}
				<span class="ml-1 text-gray-500">{data.missingPro}</span>
			{/if}
		</a>
	{/each}
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->

<form method="GET" class="mb-4 flex gap-2">
	<label class="sr-only" for="game-search">Search games by name</label>
	<input
		id="game-search"
		type="search"
		name="q"
		bind:value={searchTerm}
		oninput={onSearchInput}
		placeholder="Search by name…"
		class="focus:border-accent w-full max-w-xs rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none"
	/>
	<input type="hidden" name="sort" value={data.query.sort} />
	<input type="hidden" name="dir" value={data.query.direction} />
	{#if data.query.missing}
		<input type="hidden" name="missing" value={data.query.missing} />
	{/if}
	{#if data.query.status !== 'all'}
		<input type="hidden" name="status" value={data.query.status} />
	{/if}
	<noscript>
		<button
			type="submit"
			class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
		>
			Search
		</button>
	</noscript>
	{#if data.query.search}
		<button
			type="button"
			onclick={clearSearch}
			class="cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-300"
		>
			Clear
		</button>
	{/if}
</form>

<div class="overflow-x-auto rounded-xl border border-gray-800">
	<table class="w-full text-left text-sm">
		<!-- the sort links are resolve() results with a query string appended -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<thead class="bg-gray-900 text-gray-400">
			<tr>
				<th class="px-4 py-3 font-medium">Shot</th>
				<th class="px-4 py-3 font-medium">
					<a href={sortHref('name')} class="hover:text-white">Name{sortMarker('name')}</a>
				</th>
				<th class="px-4 py-3 font-medium">
					<a href={sortHref('year')} class="hover:text-white">Year{sortMarker('year')}</a>
				</th>
				<th class="px-4 py-3 font-medium">Slug</th>
				<th class="px-4 py-3 font-medium">Shots</th>
				<th class="px-4 py-3 font-medium">
					<a href={sortHref('created')} class="hover:text-white">ID{sortMarker('created')}</a>
				</th>
				<th class="px-4 py-3"></th>
			</tr>
		</thead>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
		<tbody class="divide-y divide-gray-800">
			{#each data.games as game (game.id)}
				<!--
					The whole row opens the game. The name cell is a real link, so this
					is a mouse shortcut on top of a control that is already keyboard
					reachable — no extra role or key handler belongs on the <tr>.
				-->
				<tr class="cursor-pointer hover:bg-gray-900/60" onclick={(event) => openRow(event, game)}>
					<td class="px-4 py-2">
						{#if game.normalShot ?? game.proShot}
							{@const shot = (game.normalShot ?? game.proShot) as string}
							<button
								type="button"
								title="View full size"
								onclick={() => openLightbox(shot, game.name)}
								class="hover:border-accent block cursor-pointer overflow-hidden rounded border border-transparent"
							>
								<img
									src={resolveScreenshotUrl(shot)}
									alt="Screenshot of {game.name}"
									loading="lazy"
									class="h-10 w-16 object-cover"
								/>
							</button>
						{:else}
							<div
								title="No screenshot — this game never appears in a round"
								class="flex h-10 w-16 items-center justify-center rounded border border-red-900 bg-red-950/50 text-red-400"
								aria-hidden="true"
							>
								⚠
							</div>
						{/if}
					</td>
					<td class="px-4 py-2 text-white">
						<!-- the detail link carries the list's own sort and filter -->
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a href={detailHref(game.id)} class="hover:text-accent">{game.name}</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
						<!--
							Two different states that must never be mistaken for each other:
							amber DRAFT is a deliberate choice, red NO SCREENSHOT is a gap.
							A game can carry both.
						-->
						{#if !game.published}
							<span
								class="ml-2 rounded border border-amber-700 bg-amber-950/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300"
							>
								DRAFT
							</span>
						{/if}
						{#if game.normalShot || game.proShot}
							<!-- which slots are filled; an unfilled one simply has no chip -->
							{#if game.normalShot}
								<span
									class="ml-2 rounded bg-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-100"
								>
									NORMAL
								</span>
							{/if}
							{#if game.proShot}
								<span
									class="ml-2 rounded bg-sky-800 px-1.5 py-0.5 text-[10px] font-semibold text-sky-100"
								>
									PRO
								</span>
							{/if}
						{:else}
							<span
								class="ml-2 rounded bg-red-950 px-1.5 py-0.5 text-[10px] font-semibold text-red-300"
							>
								NO SCREENSHOT
							</span>
						{/if}
					</td>
					<td class="px-4 py-2 text-gray-300">{game.year}</td>
					<td class="px-4 py-2 font-mono text-xs text-gray-500">{game.slug}</td>
					<td class="px-4 py-2 {game.screenshotCount === 0 ? 'text-red-400' : 'text-gray-400'}">
						{game.screenshotCount}
					</td>
					<td class="px-4 py-2 text-gray-600">{game.id}</td>
					<td class="px-4 py-2 text-right whitespace-nowrap">
						<button
							type="button"
							onclick={() => askDelete(game)}
							class="cursor-pointer text-xs text-gray-500 hover:text-red-400"
						>
							Delete
						</button>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="7" class="px-4 py-8 text-center text-gray-500">
						No {data.query.status === 'all' ? '' : data.query.status}
						games{data.query.search ? ` matching “${data.query.search}”` : ''}{data.query.missing
							? MISSING_TEXT[data.query.missing]
							: ''}.
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<ConfirmDialog
	bind:open={deleteOpen}
	title="Delete {deleteTarget?.name ?? 'this game'}?"
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
					deleteOpen = false;
					await update();
				};
			}}
		>
			<input type="hidden" name="id" value={deleteTarget?.id ?? ''} />
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
		alt="Screenshot of {lightboxLabel}"
		caption={lightboxLabel}
	/>
{/if}
