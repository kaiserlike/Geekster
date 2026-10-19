<script lang="ts">
	import { activeFilters, CLEARED_FILTERS, type GameListQuery } from '$lib/adminList';

	interface Props {
		query: GameListQuery;
		/** The link that shows the same view with these overrides applied to the query. */
		hrefFor: (overrides: Partial<GameListQuery>) => string;
		/** How much of the list is in view, e.g. "12 of 352 games". */
		summary: string;
	}

	let { query, hrefFor, summary }: Props = $props();

	const filters = $derived(activeFilters(query));
</script>

<!--
	Shown only while the list is narrowed: a filtered view that looks like the
	whole list is how a game gets forgotten. Each chip drops its own filter,
	Reset drops them all and keeps the sort.
-->
{#if filters.length > 0}
	<!-- the links are resolve() results with a query string appended -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<div
		role="status"
		class="flex flex-wrap items-center gap-2 rounded-lg border border-sky-900 bg-sky-950/40 px-3 py-2 text-sm text-sky-100"
	>
		<span class="font-semibold">Filtered</span>
		<span class="text-sky-300">{summary}</span>
		{#each filters as filter (filter.key)}
			<a
				href={hrefFor(filter.without)}
				aria-label="Remove filter {filter.label}"
				title="Remove this filter"
				class="flex items-center gap-1 rounded-full border border-sky-700 bg-sky-900/60 py-0.5 pr-1.5 pl-2.5 text-xs hover:border-sky-400 hover:text-white"
			>
				{filter.label}
				<span aria-hidden="true" class="text-sky-400">×</span>
			</a>
		{/each}
		<a
			href={hrefFor(CLEARED_FILTERS)}
			class="ml-auto text-xs font-semibold text-sky-300 underline hover:text-white"
		>
			Reset filters
		</a>
	</div>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/if}
