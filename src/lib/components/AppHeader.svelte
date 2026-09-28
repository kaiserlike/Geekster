<script lang="ts">
	import { formatNumber, tf, ts } from '$lib/i18n.svelte';
	import LangSwitch from './LangSwitch.svelte';
	import Chip from './ui/Chip.svelte';
	import Wordmark from './ui/Wordmark.svelte';

	interface Props {
		/** Off where the screen draws its own large wordmark (the welcome screen) */
		wordmark?: boolean;
		/** The PRO badge beside the wordmark, while a Pro run is on */
		pro?: boolean;
		/**
		 * The HUD collapsed into the header (the bonus guess with the phone keyboard open): the
		 * score takes the language switch's place. 9d decides when
		 */
		score?: number | null;
		/** The welcome screen's width (1120 px, two columns on a desktop) instead of the run's 880 */
		wide?: boolean;
	}

	let { wordmark = true, pro = false, score = null, wide = false }: Props = $props();
</script>

<header
	class="mx-auto flex min-h-15 w-full items-center justify-between gap-3 pt-3.5 {wide
		? 'max-w-[1120px] px-5 lg:px-10'
		: 'max-w-run px-4'}"
>
	<div class="flex items-center gap-2.5">
		{#if wordmark}
			<!-- Not a link: during a run, "/" is the page already on screen -->
			<Wordmark size={22} />
			{#if pro}
				<Chip tone="pink">{ts('mode.pro')}</Chip>
			{/if}
		{/if}
	</div>
	{#if score === null}
		<LangSwitch />
	{:else}
		<p class="font-ui tabular text-score text-lg font-bold" data-header-score>
			<span class="sr-only">{tf<(n: string) => string>('hud.credits')(formatNumber(score))}</span>
			<span aria-hidden="true">
				{formatNumber(score)}
				<span class="text-ink-muted text-xs font-medium tracking-[1px]"
					>{ts('hud.creditsShort')}</span
				>
			</span>
		</p>
	{/if}
</header>
