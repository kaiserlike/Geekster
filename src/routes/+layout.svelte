<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import LangSwitch from '$lib/components/LangSwitch.svelte';
	import { ts } from '$lib/i18n.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Geekster</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-950 text-white">
	<!-- Language switch -->
	<div class="absolute top-2 right-3 z-50">
		<LangSwitch />
	</div>
	<div class="flex-1">
		{@render children()}
	</div>
	<footer class="py-3 text-center text-[10px] text-gray-700">
		{ts('footer.poweredBy')}
		<a
			href="https://rawg.io"
			class="underline hover:text-gray-500"
			target="_blank"
			rel="noopener noreferrer">RAWG</a
		>
	</footer>
</div>
