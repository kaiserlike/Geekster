<script lang="ts">
	import { resolve } from '$app/paths';
	import '../app.css';
	// Self-hosted, latin subset only, exactly the weights the tokens use (Sprint 9b). Never from
	// Google's CDN: embedding Google Fonts passes every visitor's IP address to Google.
	import '@fontsource/dela-gothic-one/latin-400.css';
	import '@fontsource/chakra-petch/latin-500.css';
	import '@fontsource/chakra-petch/latin-700.css';
	import '@fontsource/exo-2/latin-400.css';
	import '@fontsource/exo-2/latin-500.css';
	import '@fontsource/exo-2/latin-600.css';
	import displayFont from '@fontsource/dela-gothic-one/files/dela-gothic-one-latin-400-normal.woff2?url';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { getState } from '$lib/game.svelte';
	import { headerScore } from '$lib/headerScore.svelte';
	import { getLocale, ts } from '$lib/i18n.svelte';
	import { gameJsonLd, OG_IMAGE, SITE_NAME } from '$lib/seo';
	import { page } from '$app/state';

	let { children } = $props();

	// The head is German, as the server renders the game (hooks.server.ts): a crawler gets that
	// HTML and reads no localStorage, and a title in another language than the page reads as a
	// mismatch. The title carries what people search for, not just the name.
	const TITLE = 'Geekster — Das Videospiel-Quiz nach Erscheinungsjahr';
	const DESCRIPTION =
		'Errate das Erscheinungsjahr aus einem Screenshot und bring Videospiele in die richtige Reihenfolge. Daily Run und Endless Run, kostenlos im Browser.';
	const THEME_COLOR = '#03101a';
	// The closing tag is split, or it would end this component's own script block
	const jsonLdTag = `<script type="application/ld+json">${gameJsonLd(DESCRIPTION)}<${'/'}script>`;

	// The admin panel brings its own chrome: no header, no legal footer, no link preview.
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
	// The brand pages are screenshotted into static/ at their exact pixel size: no chrome at all.
	const isBrandAsset = $derived(page.url.pathname.startsWith('/styleguide/brand/'));
	// A page with its language in the URL brings its own head (SeoHead): title, hreflang, canonical
	const ownsHead = $derived(page.route.id?.startsWith('/[lang=locale]') ?? false);
	const gameState = $derived(getState());
	// The welcome screen draws the wordmark large (9e), so the header shows only the language
	// switch there. During a run and on the result screen it carries the wordmark.
	const screenDrawsTitle = $derived(page.url.pathname === '/' && gameState.phase === 'welcome');
	const proRun = $derived(gameState.phase === 'playing' && gameState.mode === 'pro');
	// Mid-run, the legal links open a new tab: leaving the page would drop the round in progress
	const duringRun = $derived(page.url.pathname === '/' && gameState.phase === 'playing');
	const legalLinkTarget = $derived(
		duringRun ? { target: '_blank', rel: 'noopener noreferrer' } : {}
	);
	const FOOTER_LINK = 'focus-ring hover:text-ink rounded-chip text-ink-muted underline';

	// The server renders the URL's language or `de` (hooks.server.ts); this keeps it true to the
	// language shown.
	$effect(() => {
		document.documentElement.lang = isAdmin ? 'en' : getLocale();
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="32x32" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content={THEME_COLOR} />
	{#if !isAdmin}
		<link rel="preload" href={displayFont} as="font" type="font/woff2" crossorigin="anonymous" />
	{/if}
	{#if !isAdmin && !ownsHead}
		<title>{TITLE}</title>
		<meta name="description" content={DESCRIPTION} />
		<!-- Without the query: `?_vercel_share=`, `?mode=` are the same page -->
		<link rel="canonical" href="{page.url.origin}{page.url.pathname}" />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content={SITE_NAME} />
		<meta property="og:title" content={TITLE} />
		<meta property="og:description" content={DESCRIPTION} />
		<meta property="og:url" content="{page.url.origin}{page.url.pathname}" />
		<meta property="og:locale" content="de_DE" />
		<meta property="og:locale:alternate" content="en_US" />
		<meta property="og:image" content="{page.url.origin}{OG_IMAGE.path}" />
		<meta property="og:image:type" content={OG_IMAGE.type} />
		<meta property="og:image:width" content={String(OG_IMAGE.width)} />
		<meta property="og:image:height" content={String(OG_IMAGE.height)} />
		<meta property="og:image:alt" content={OG_IMAGE.alt} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={TITLE} />
		<meta name="twitter:description" content={DESCRIPTION} />
		<meta name="twitter:image" content="{page.url.origin}{OG_IMAGE.path}" />
		<meta name="twitter:image:alt" content={OG_IMAGE.alt} />
		{#if page.url.pathname === '/'}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own JSON, `<` escaped (gameJsonLd) -->
			{@html jsonLdTag}
		{/if}
	{/if}
</svelte:head>

{#if isBrandAsset}
	{@render children()}
{:else if isAdmin}
	<div class="font-body flex min-h-screen flex-col bg-gray-950 text-white">
		<div class="flex-1">
			{@render children()}
		</div>
	</div>
{:else}
	<div class="bg-bg font-body text-ink flex min-h-screen flex-col">
		<AppHeader
			wordmark={!screenDrawsTitle}
			home={page.url.pathname !== '/'}
			wide={screenDrawsTitle}
			pro={proRun}
			daily={gameState.phase === 'playing' ? (gameState.daily?.number ?? null) : null}
			score={headerScore.value}
		/>
		<main class="flex-1">
			{@render children()}
		</main>
		<footer
			class="text-ink-subtle flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-4 text-center text-xs"
		>
			<a href={resolve('/impressum')} class={FOOTER_LINK} {...legalLinkTarget}
				>{ts('footer.impressum')}{#if duringRun}<span class="sr-only"
						>{` ${ts('footer.newTab')}`}</span
					>{/if}</a
			>
			<span aria-hidden="true">·</span>
			<a href={resolve('/privacy')} class={FOOTER_LINK} {...legalLinkTarget}
				>{ts('footer.privacy')}{#if duringRun}<span class="sr-only"
						>{` ${ts('footer.newTab')}`}</span
					>{/if}</a
			>
			<span class="basis-full">
				{ts('footer.credit')}
				<a href="https://rawg.io" class={FOOTER_LINK} target="_blank" rel="noopener noreferrer"
					>RAWG.io<span class="sr-only">{` ${ts('footer.newTab')}`}</span></a
				>
			</span>
		</footer>
	</div>
{/if}
