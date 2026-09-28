<script lang="ts">
	import { getLocale, setLocale } from '$lib/i18n.svelte';
	import type { Locale } from '$lib/i18n.svelte';
	import IconButton from './ui/IconButton.svelte';

	const locale: Locale = $derived(getLocale());
</script>

<IconButton
	onclick={() => setLocale(locale === 'de' ? 'en' : 'de')}
	label={locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'}
	lang={locale === 'de' ? 'en' : 'de'}
>
	{locale === 'de' ? 'EN' : 'DE'}
</IconButton>
