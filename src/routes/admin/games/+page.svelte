<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let pendingDeleteId: number | null = $state(null);

	function sortHref(column: 'name' | 'year' | 'created'): string {
		const direction = data.sort === column && data.direction === 'asc' ? 'desc' : 'asc';
		const query = [`sort=${column}`, `dir=${direction}`];
		if (data.search) query.push(`q=${encodeURIComponent(data.search)}`);
		return `${resolve('/admin/games')}?${query.join('&')}`;
	}

	function sortMarker(column: 'name' | 'year' | 'created'): string {
		if (data.sort !== column) return '';
		return data.direction === 'asc' ? ' ▲' : ' ▼';
	}
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
		class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
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

<form method="GET" class="mb-4 flex gap-2">
	<input
		type="search"
		name="q"
		value={data.search}
		placeholder="Search by name…"
		class="w-full max-w-xs rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
	/>
	<input type="hidden" name="sort" value={data.sort} />
	<input type="hidden" name="dir" value={data.direction} />
	<button
		type="submit"
		class="cursor-pointer rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
	>
		Search
	</button>
	{#if data.search}
		<a
			href={resolve('/admin/games')}
			class="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-300">Clear</a
		>
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
				<tr class="hover:bg-gray-900/60">
					<td class="px-4 py-2">
						{#if game.screenshot}
							<img
								src={resolveScreenshotUrl(game.screenshot)}
								alt=""
								loading="lazy"
								class="h-10 w-16 rounded object-cover"
							/>
						{:else}
							<div
								class="flex h-10 w-16 items-center justify-center rounded bg-gray-800 text-[10px] text-gray-500"
							>
								none
							</div>
						{/if}
					</td>
					<td class="px-4 py-2 text-white">
						<a
							href={resolve('/admin/games/[id]', { id: String(game.id) })}
							class="hover:text-purple-400">{game.name}</a
						>
					</td>
					<td class="px-4 py-2 text-gray-300">{game.year}</td>
					<td class="px-4 py-2 font-mono text-xs text-gray-500">{game.slug}</td>
					<td class="px-4 py-2 text-gray-400">{game.screenshotCount}</td>
					<td class="px-4 py-2 text-gray-600">{game.id}</td>
					<td class="px-4 py-2 text-right whitespace-nowrap">
						<a
							href={resolve('/admin/games/[id]', { id: String(game.id) })}
							class="text-xs text-gray-400 hover:text-white">Edit</a
						>
						{#if pendingDeleteId === game.id}
							<form
								method="POST"
								action="?/delete"
								class="ml-2 inline"
								use:enhance={() => {
									return async ({ update }) => {
										pendingDeleteId = null;
										await update();
									};
								}}
							>
								<input type="hidden" name="id" value={game.id} />
								<button
									type="submit"
									class="cursor-pointer text-xs text-red-400 hover:text-red-300"
								>
									Confirm
								</button>
								<button
									type="button"
									onclick={() => (pendingDeleteId = null)}
									class="ml-1 cursor-pointer text-xs text-gray-500 hover:text-gray-300"
								>
									Cancel
								</button>
							</form>
						{:else}
							<button
								type="button"
								onclick={() => (pendingDeleteId = game.id)}
								class="ml-2 cursor-pointer text-xs text-gray-500 hover:text-red-400"
							>
								Delete
							</button>
						{/if}
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="7" class="px-4 py-8 text-center text-gray-500">
						No games{data.search ? ` matching “${data.search}”` : ''}.
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
