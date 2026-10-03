<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ConfirmDialog from '$lib/components/admin/ConfirmDialog.svelte';
	import Spinner from '$lib/components/admin/Spinner.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type Row = (typeof data.rows)[number];

	let deleteOpen: boolean = $state(false);
	let deleteTarget: Row | null = $state(null);
	let deleting: boolean = $state(false);

	const MODES = [
		{ value: '', label: 'All modes' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'pro', label: 'Pro' }
	];

	/** This list's query string with `changes` applied */
	function query(changes: { mode?: string; page?: number }): string {
		const mode = changes.mode ?? data.query.mode ?? '';
		const page = changes.page ?? 1;
		return new URLSearchParams({
			...(mode ? { mode } : {}),
			...(data.query.q ? { q: data.query.q } : {}),
			...(page > 1 ? { page: String(page) } : {})
		}).toString();
	}

	function askDelete(row: Row) {
		deleteTarget = row;
		deleteOpen = true;
	}
</script>

<svelte:head>
	<title>Scores — Geekster Admin</title>
</svelte:head>

<h1 class="mb-1 text-2xl font-bold text-white">Scores</h1>
<p class="mb-6 text-sm text-gray-400">
	Every row of the global board, newest first: {data.total}. The public board shows each device's
	best per mode; deleting a row takes it off for good (a player's next best moves up).
</p>

{#if form?.error}
	<p class="mb-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
		{form.error}
	</p>
{:else if form?.deleted}
	<p class="mb-4 rounded-lg border border-green-900 bg-green-950/40 p-3 text-sm text-green-300">
		Score {form.deleted} deleted.
	</p>
{/if}

<div class="mb-4 flex flex-wrap items-center gap-2">
	{#each MODES as mode (mode.value)}
		<a
			href="{resolve('/admin/scores')}?{query({ mode: mode.value })}"
			class="rounded-lg border px-3 py-1.5 text-sm {(data.query.mode ?? '') === mode.value
				? 'border-accent text-white'
				: 'border-gray-700 text-gray-400 hover:bg-gray-800'}">{mode.label}</a
		>
	{/each}
	<form method="GET" class="ml-auto flex gap-2">
		{#if data.query.mode}
			<input type="hidden" name="mode" value={data.query.mode} />
		{/if}
		<label class="sr-only" for="score-search">Search by player name</label>
		<input
			id="score-search"
			type="search"
			name="q"
			value={data.query.q}
			placeholder="Player name…"
			class="focus:border-accent w-48 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none"
		/>
		<button
			type="submit"
			class="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
			>Search</button
		>
	</form>
</div>

{#if data.rows.length === 0}
	<p class="rounded-xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-500">
		No scores{data.query.q ? ` matching “${data.query.q}”` : ''}.
	</p>
{:else}
	<div class="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900">
		<table class="w-full text-left text-sm">
			<thead class="text-xs text-gray-500">
				<tr>
					<th class="px-4 py-3 font-medium">Player</th>
					<th class="px-4 py-3 font-medium">Score</th>
					<th class="px-4 py-3 font-medium">Mode</th>
					<th class="px-4 py-3 font-medium">Correct / wrong</th>
					<th class="px-4 py-3 font-medium">Streak</th>
					<th class="px-4 py-3 font-medium">When (UTC)</th>
					<th class="px-4 py-3"><span class="sr-only">Actions</span></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-800">
				{#each data.rows as row (row.id)}
					<tr>
						<td class="px-4 py-2 text-white">
							{row.playerName}
							{#if !row.refereed}
								<span class="ml-1 text-xs text-amber-400" title="Written before the referee"
									>unrefereed</span
								>
							{/if}
						</td>
						<td class="px-4 py-2 text-gray-300">{row.totalScore}</td>
						<td class="px-4 py-2 text-gray-400">{row.difficulty ?? '—'}</td>
						<td class="px-4 py-2 text-gray-400"
							>{row.correctPlacements ?? '—'} / {row.wrongPlacements ?? '—'}</td
						>
						<td class="px-4 py-2 text-gray-400">{row.bestStreak ?? '—'}</td>
						<td class="px-4 py-2 text-xs text-gray-500">{row.createdAt ?? '—'}</td>
						<td class="px-4 py-2 text-right">
							<button
								type="button"
								onclick={() => askDelete(row)}
								class="cursor-pointer rounded-lg px-3 py-1 text-xs text-red-400 hover:bg-red-950/50"
								>Delete</button
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.pages > 1}
		<nav class="mt-4 flex items-center justify-between text-sm text-gray-400" aria-label="Pages">
			{#if data.query.page > 1}
				<a
					href="{resolve('/admin/scores')}?{query({ page: data.query.page - 1 })}"
					class="rounded-lg border border-gray-700 px-3 py-1.5 hover:bg-gray-800">← Newer</a
				>
			{:else}
				<span></span>
			{/if}
			<span>Page {data.query.page} of {data.pages}</span>
			{#if data.query.page < data.pages}
				<a
					href="{resolve('/admin/scores')}?{query({ page: data.query.page + 1 })}"
					class="rounded-lg border border-gray-700 px-3 py-1.5 hover:bg-gray-800">Older →</a
				>
			{:else}
				<span></span>
			{/if}
		</nav>
	{/if}
{/if}

<ConfirmDialog
	bind:open={deleteOpen}
	title="Delete {deleteTarget?.playerName ?? 'this score'}'s score?"
	description="{deleteTarget?.totalScore ?? ''} CR ({deleteTarget?.difficulty ??
		''}, {deleteTarget?.createdAt ?? ''}) is removed from the global board. This cannot be undone."
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
				Delete score
			</button>
		</form>
	{/snippet}
</ConfirmDialog>
