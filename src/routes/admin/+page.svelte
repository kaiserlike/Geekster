<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tiles = $derived(
		data.stats
			? [
					{ label: 'Games', value: data.stats.games },
					{ label: 'Screenshots', value: data.stats.screenshots },
					{ label: 'On Vercel Blob', value: data.stats.screenshotsOnBlob },
					{ label: 'Without a shot', value: data.stats.gamesWithoutScreenshot },
					{ label: 'Scores submitted', value: data.stats.scores }
				]
			: []
	);
</script>

<svelte:head>
	<title>Dashboard — Geekster Admin</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold text-white">Dashboard</h1>

{#if data.error}
	<p
		role="alert"
		class="mb-4 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200"
	>
		{data.error}
	</p>
{/if}

<div class="mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
	{#each tiles as tile (tile.label)}
		<div class="rounded-xl border border-gray-800 bg-gray-900 p-4">
			<p class="text-2xl font-bold text-white">{tile.value}</p>
			<p class="text-xs text-gray-500">{tile.label}</p>
		</div>
	{/each}
</div>

{#if data.stats && data.stats.gamesWithoutScreenshot > 0}
	<p class="mb-8 rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-sm text-amber-200">
		{data.stats.gamesWithoutScreenshot} game{data.stats.gamesWithoutScreenshot === 1 ? '' : 's'} have
		no primary screenshot and will never appear in a round.
	</p>
{/if}

<div class="grid gap-6 lg:grid-cols-2">
	<section class="rounded-xl border border-gray-800 bg-gray-900 p-6">
		<h2 class="mb-4 text-lg font-semibold text-white">Quick add</h2>

		{#if form?.error}
			<p
				role="alert"
				class="mb-3 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200"
			>
				{form.error}
			</p>
		{/if}

		<form method="POST" action="?/quickAdd" class="flex flex-wrap items-end gap-3">
			<div class="min-w-40 flex-1">
				<label class="mb-1 block text-sm font-medium text-gray-300" for="quick-name">Name</label>
				<input
					id="quick-name"
					name="name"
					required
					class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-purple-500"
				/>
			</div>
			<div class="w-28">
				<label class="mb-1 block text-sm font-medium text-gray-300" for="quick-year">Year</label>
				<input
					id="quick-year"
					name="year"
					type="number"
					required
					min="1958"
					max={new Date().getFullYear() + 2}
					class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-purple-500"
				/>
			</div>
			<button
				type="submit"
				class="cursor-pointer rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-500"
			>
				Add
			</button>
		</form>

		{#if data.recentGames.length > 0}
			<h3 class="mt-6 mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
				Recently added
			</h3>
			<ul class="space-y-1 text-sm">
				{#each data.recentGames as game (game.id)}
					<li>
						<a
							href={resolve('/admin/games/[id]', { id: String(game.id) })}
							class="text-gray-300 hover:text-purple-400"
						>
							{game.name}
						</a>
						<span class="text-gray-600">· {game.year}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="rounded-xl border border-gray-800 bg-gray-900 p-6">
		<h2 class="mb-4 text-lg font-semibold text-white">Recent scores</h2>
		{#if data.recentScores.length === 0}
			<p class="text-sm text-gray-500">No scores submitted yet.</p>
		{:else}
			<table class="w-full text-left text-sm">
				<thead class="text-xs text-gray-500">
					<tr>
						<th class="pb-2 font-medium">Player</th>
						<th class="pb-2 font-medium">Score</th>
						<th class="pb-2 font-medium">Correct</th>
						<th class="pb-2 font-medium">Streak</th>
						<th class="pb-2 font-medium">When</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-800">
					{#each data.recentScores as score (score.id)}
						<tr>
							<td class="py-2 text-white">{score.playerName}</td>
							<td class="py-2 text-gray-300">{score.totalScore}</td>
							<td class="py-2 text-gray-400">{score.correctPlacements ?? '—'}</td>
							<td class="py-2 text-gray-400">{score.bestStreak ?? '—'}</td>
							<td class="py-2 text-xs text-gray-600">{score.createdAt ?? '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</div>
