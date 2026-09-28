<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { getLocale, ts } from '$lib/i18n.svelte';
	import { LEGAL_UPDATED } from '$lib/legal';

	interface Props {
		title: string;
		children: Snippet;
	}

	let { title, children }: Props = $props();

	const updated = $derived(
		new Intl.DateTimeFormat(getLocale() === 'de' ? 'de-AT' : 'en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(`${LEGAL_UPDATED}T12:00:00Z`))
	);
</script>

<!--
	The shell of the Impressum and the privacy page (Sprint 9g): a readable column in the tokens.
	The prose comes from the route; its sections style themselves through the child selectors
	below, so the routes stay plain h2 / p / ul markup
-->
<article
	class="max-w-run text-ink-muted [&_a]:text-accent [&_a]:focus-ring [&_a]:rounded-chip [&_h2]:font-ui [&_h2]:text-pink [&_h3]:font-ui [&_h3]:text-ink [&_li]:marker:text-ink-subtle [&_strong]:text-ink mx-auto px-4 pt-6 pb-12 text-[15px] leading-relaxed [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-9 [&_h2]:mb-3 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:tracking-[3px] [&_h2]:uppercase [&_h3]:mt-5 [&_h3]:mb-1.5 [&_h3]:font-bold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
>
	<a href={resolve('/')} class="font-ui text-sm font-bold no-underline!">← {ts('legal.back')}</a>
	<h1 tabindex="-1" class="font-display text-ink mt-5 mb-1 text-3xl leading-tight outline-none">
		{title}
	</h1>
	<p class="text-ink-subtle text-sm">{ts('legal.updated')}: {updated}</p>
	<div class="max-w-2xl">
		{@render children()}
	</div>
</article>
