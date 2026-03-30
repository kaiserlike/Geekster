<script lang="ts">
	import type { LeaderboardEntry, GlobalScoreEntry } from '$lib/types';
	import { ts } from '$lib/i18n.svelte';

	let {
		entries,
		compact = false,
		highlightIndex = -1
	}: {
		entries: LeaderboardEntry[];
		compact?: boolean;
		highlightIndex?: number;
	} = $props();

	const displayEntries = $derived(compact ? entries.slice(0, 5) : entries);

	let activeTab: 'local' | 'global' = $state('local');
	let globalScores: GlobalScoreEntry[] = $state([]);
	let globalLoading: boolean = $state(false);
	let globalError: boolean = $state(false);

	async function fetchGlobalScores() {
		if (globalScores.length > 0) return;
		globalLoading = true;
		globalError = false;
		try {
			const res = await fetch('/api/scores?limit=20');
			if (!res.ok) throw new Error();
			globalScores = await res.json();
		} catch {
			globalError = true;
		} finally {
			globalLoading = false;
		}
	}

	function selectTab(tab: 'local' | 'global') {
		activeTab = tab;
		if (tab === 'global') {
			fetchGlobalScores();
		}
	}
</script>

{#if displayEntries.length > 0 || !compact}
	<div class="w-full">
		{#if !compact}
			<div class="mb-3 flex justify-center gap-2">
				<button
					onclick={() => selectTab('local')}
					class="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors {activeTab ===
					'local'
						? 'bg-purple-600 text-white'
						: 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
				>
					{ts('leaderboard.local')}
				</button>
				<button
					onclick={() => selectTab('global')}
					class="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors {activeTab ===
					'global'
						? 'bg-purple-600 text-white'
						: 'bg-gray-800 text-gray-400 hover:text-gray-200'}"
				>
					{ts('leaderboard.global')}
				</button>
			</div>
		{/if}

		{#if activeTab === 'local' || compact}
			{#if displayEntries.length > 0}
				{#if compact}
					<h3 class="mb-3 text-center text-lg font-semibold text-gray-300">
						{ts('leaderboard.title')}
					</h3>
				{/if}
				<div class="overflow-hidden rounded-lg border border-gray-800">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-gray-800 bg-gray-900 text-gray-500">
								<th class="px-3 py-2 text-left font-medium">#</th>
								<th class="px-3 py-2 text-right font-medium">{ts('leaderboard.score')}</th>
								{#if !compact}
									<th class="px-3 py-2 text-center font-medium">{ts('leaderboard.result')}</th>
									<th class="px-3 py-2 text-right font-medium">{ts('leaderboard.streak')}</th>
								{/if}
								<th class="px-3 py-2 text-right font-medium">{ts('leaderboard.date')}</th>
							</tr>
						</thead>
						<tbody>
							{#each displayEntries as entry, i (i)}
								<tr
									class="border-b border-gray-800/50 {highlightIndex === i
										? 'bg-purple-900/30'
										: i % 2 === 0
											? 'bg-gray-900/30'
											: ''}"
								>
									<td class="px-3 py-2 text-gray-400">{i + 1}</td>
									<td class="px-3 py-2 text-right font-bold text-white tabular-nums">
										{entry.score.toLocaleString()}
									</td>
									{#if !compact}
										<td class="px-3 py-2 text-center">
											<span
												class="inline-block rounded-full px-2 py-0.5 text-xs font-bold {entry.isWin
													? 'bg-green-900/50 text-green-400'
													: 'bg-red-900/50 text-red-400'}"
											>
												{entry.isWin ? ts('leaderboard.win') : ts('leaderboard.loss')}
											</span>
											<span class="ml-1 text-xs text-gray-500">
												{entry.correctPlacements}/{entry.correctPlacements + entry.wrongPlacements}
											</span>
										</td>
										<td class="px-3 py-2 text-right text-orange-400 tabular-nums">
											{entry.bestStreak}x
										</td>
									{/if}
									<td class="px-3 py-2 text-right text-gray-500">
										{new Date(entry.date).toLocaleDateString()}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		{:else if globalLoading}
			<div class="py-8 text-center text-gray-500">
				<div
					class="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-purple-500"
				></div>
			</div>
		{:else if globalError}
			<p class="py-8 text-center text-gray-500">{ts('leaderboard.globalUnavailable')}</p>
		{:else if globalScores.length === 0}
			<p class="py-8 text-center text-gray-500">{ts('leaderboard.noGlobalScores')}</p>
		{:else}
			<div class="overflow-hidden rounded-lg border border-gray-800">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-800 bg-gray-900 text-gray-500">
							<th class="px-3 py-2 text-left font-medium">#</th>
							<th class="px-3 py-2 text-left font-medium">{ts('leaderboard.player')}</th>
							<th class="px-3 py-2 text-right font-medium">{ts('leaderboard.score')}</th>
							<th class="px-3 py-2 text-right font-medium">{ts('leaderboard.streak')}</th>
							<th class="px-3 py-2 text-right font-medium">{ts('leaderboard.date')}</th>
						</tr>
					</thead>
					<tbody>
						{#each globalScores as score, i (score.id)}
							<tr class="border-b border-gray-800/50 {i % 2 === 0 ? 'bg-gray-900/30' : ''}">
								<td class="px-3 py-2 text-gray-400">{i + 1}</td>
								<td class="px-3 py-2 text-white">{score.playerName}</td>
								<td class="px-3 py-2 text-right font-bold text-white tabular-nums">
									{score.totalScore.toLocaleString()}
								</td>
								<td class="px-3 py-2 text-right text-orange-400 tabular-nums">
									{score.bestStreak ?? 0}x
								</td>
								<td class="px-3 py-2 text-right text-gray-500">
									{score.createdAt ? new Date(score.createdAt).toLocaleDateString() : ''}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}
