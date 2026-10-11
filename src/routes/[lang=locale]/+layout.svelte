<script lang="ts">
	import { page } from '$app/state';
	import { setLocale } from '$lib/i18n.svelte';
	import { isLocale } from '$lib/i18n/translations';

	let { children } = $props();

	// Arriving on a page in a language makes it the game's language too. In the browser only:
	// on the server the locale is module state that every request shares
	$effect(() => {
		const lang = page.params.lang;
		if (isLocale(lang)) setLocale(lang);
	});
</script>

{@render children()}
