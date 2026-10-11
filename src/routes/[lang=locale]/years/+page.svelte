<script lang="ts">
	import SeoHead from '$lib/components/SeoHead.svelte';
	import Surface from '$lib/components/ui/Surface.svelte';
	import { getLocale, tf, ts } from '$lib/i18n.svelte';
	import { localizedPath } from '$lib/localizedPaths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const locale = $derived(getLocale());
</script>

<SeoHead
	title={ts('years.title')}
	description={ts('years.description')}
	noindex={data.decades.length === 0}
/>

<div class="mx-auto flex w-full max-w-[720px] flex-col gap-5 px-4 pt-6 pb-12">
	<h1 tabindex="-1" class="font-display text-ink m-0 text-3xl leading-tight outline-none">
		{ts('years.title')}
	</h1>
	<p class="text-ink-muted m-0 text-[15px] leading-relaxed">{ts('years.description')}</p>

	{#each data.decades as decade (decade.decade)}
		<Surface as="section">
			<h2 class="font-ui text-pink m-0 mb-3 text-[15px] font-bold tracking-[3px] uppercase">
				{tf<(decade: number) => string>('years.decade')(decade.decade)}
			</h2>
			<ul class="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-5">
				{#each decade.years as entry (entry.year)}
					<li>
						<!-- eslint-disable svelte/no-navigation-without-resolve -- a localised path (localizedPaths.ts), not a route id -->
						<a
							href={localizedPath(locale, 'years', entry.year)}
							class="focus-ring rounded-control border-line-strong bg-surface-raised hover:border-accent hover:bg-accent-soft flex min-h-11 flex-col border-[1.5px] px-3 py-2 transition-colors duration-(--duration-fast)"
						>
							<span class="font-ui tabular text-ink text-lg font-bold">{entry.year}</span>
							{#if entry.games > 0}
								<span class="text-ink-muted text-xs"
									>{tf<(n: number) => string>('years.gamesCount')(entry.games)}</span
								>
							{/if}
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</li>
				{/each}
			</ul>
		</Surface>
	{:else}
		<p
			class="rounded-control border-line-strong text-ink-muted flex min-h-24 items-center justify-center border-[1.5px] border-dashed p-3 text-center text-sm"
		>
			{ts('years.empty')}
		</p>
	{/each}
</div>
