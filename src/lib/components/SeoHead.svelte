<script lang="ts">
	import { page } from '$app/state';
	import { getLocale } from '$lib/i18n.svelte';
	import { LOCALES } from '$lib/i18n/translations';
	import { alternatePath } from '$lib/localizedPaths';
	import { DEFAULT_LOCALE, OG_IMAGE, OG_LOCALE, SITE_NAME } from '$lib/seo';

	interface Props {
		/** The page's own title; the site's name is appended */
		title: string;
		description: string;
		/** Kept out of search results (a page with nothing to show yet) */
		noindex?: boolean;
	}

	let { title, description, noindex = false }: Props = $props();

	const origin = $derived(page.url.origin);
	const canonical = $derived(`${origin}${page.url.pathname}`);
	const locale = $derived(getLocale());
	const fullTitle = $derived(`${title} — ${SITE_NAME}`);
	// Every language of this page, and the one for everybody else (decision 12-1)
	const alternates = $derived(
		LOCALES.map((l) => ({ hreflang: l, path: alternatePath(page.url.pathname, l) }))
	);
	const fallback = $derived(alternatePath(page.url.pathname, DEFAULT_LOCALE));
	const image = $derived(`${origin}${OG_IMAGE.path}`);
</script>

<!-- For the pages with their language in the URL; the root layout leaves its English default out -->
<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<link rel="canonical" href={canonical} />
	{#each alternates as alternate (alternate.hreflang)}
		{#if alternate.path}
			<link rel="alternate" hreflang={alternate.hreflang} href="{origin}{alternate.path}" />
		{/if}
	{/each}
	{#if fallback}
		<link rel="alternate" hreflang="x-default" href="{origin}{fallback}" />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={OG_LOCALE[locale]} />
	{#each LOCALES.filter((l) => l !== locale) as other (other)}
		<meta property="og:locale:alternate" content={OG_LOCALE[other]} />
	{/each}
	<meta property="og:image" content={image} />
	<meta property="og:image:type" content={OG_IMAGE.type} />
	<meta property="og:image:width" content={String(OG_IMAGE.width)} />
	<meta property="og:image:height" content={String(OG_IMAGE.height)} />
	<meta property="og:image:alt" content={OG_IMAGE.alt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<meta name="twitter:image:alt" content={OG_IMAGE.alt} />
</svelte:head>
