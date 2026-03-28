<script lang="ts">
	import { getLocale, setLocale } from '$lib/i18n.svelte';
	import type { Locale } from '$lib/i18n.svelte';

	const locale: Locale = $derived(getLocale());
</script>

<button
	onclick={() => setLocale(locale === 'de' ? 'en' : 'de')}
	class="rounded-md border border-gray-700 px-2 py-0.5 text-xs font-bold text-gray-400 transition-colors hover:border-gray-500 hover:text-white"
	title={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
>
	{locale === 'de' ? 'EN' : 'DE'}
</button>
