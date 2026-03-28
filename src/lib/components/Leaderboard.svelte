<script lang="ts">
	import type { LeaderboardEntry } from '$lib/types';
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
</script>

{#if displayEntries.length > 0}
	<div class="w-full">
		{#if !compact}
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
	</div>
{/if}
