<script lang="ts">
	import { page } from '$app/state';
	import { getLocale, setLocale } from '$lib/i18n.svelte';
	import type { Locale } from '$lib/i18n.svelte';
	import { alternatePath } from '$lib/localizedPaths';
	import IconButton, { ICON_BUTTON_CLASS } from './ui/IconButton.svelte';

	const locale: Locale = $derived(getLocale());
	const other: Locale = $derived(locale === 'de' ? 'en' : 'de');
	const label = $derived(locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln');
	// A page with the language in its URL switches by going to the other language's URL
	const otherPath = $derived(alternatePath(page.url.pathname, other));
</script>

{#if otherPath}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- a localised path (localizedPaths.ts): resolve() knows route ids, and /de/jahre/ is none -->
	<a
		href={otherPath}
		hreflang={other}
		lang={other}
		aria-label={label}
		title={label}
		class="{ICON_BUTTON_CLASS} hover:border-accent hover:bg-accent-soft"
	>
		{other.toUpperCase()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<IconButton onclick={() => setLocale(other)} {label} lang={other}>
		{other.toUpperCase()}
	</IconButton>
{/if}
