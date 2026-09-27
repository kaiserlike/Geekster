<script lang="ts">
	import { ts } from '$lib/i18n.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import Chip from './ui/Chip.svelte';
	import Wordmark from './ui/Wordmark.svelte';

	interface Props {
		/** Off where the screen draws its own large wordmark (the welcome screen) */
		wordmark?: boolean;
		/** The PRO badge beside the wordmark, while a Pro run is on */
		pro?: boolean;
	}

	let { wordmark = true, pro = false }: Props = $props();
</script>

<header class="flex min-h-15 items-center justify-between gap-3 px-4 pt-3.5 lg:px-10">
	<div class="flex items-center gap-2.5">
		{#if wordmark}
			<!-- Not a link: during a run, "/" is the page already on screen -->
			<Wordmark size={22} />
			{#if pro}
				<Chip tone="pink">{ts('mode.pro')}</Chip>
			{/if}
		{/if}
	</div>
	<LangSwitch />
</header>
