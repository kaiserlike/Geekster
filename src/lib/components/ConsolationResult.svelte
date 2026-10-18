<script lang="ts">
	import { formatNumber, tf, ts } from '$lib/i18n.svelte';
	import { MAX_CONSOLATION_BONUS } from '$lib/scoring';

	interface Props {
		/** The game's name, as the answer gives it */
		name: string;
		/** What the consolation paid: more than 0, or this strip is not shown */
		points: number;
	}

	let { name, points }: Props = $props();

	const quality = $derived(points >= MAX_CONSOLATION_BONUS ? ts('score.exact') : ts('score.close'));
</script>

<!--
	A miss whose name was known (design A, 2026-10-18): its own turquoise strip under the red one,
	so the part that went right does not read as wrong. Spoken by GameScreen's live region
-->
<div
	class="rounded-card border-accent bg-accent-soft shadow-glow-accent flex items-center gap-3 border-[1.5px] px-3.5 py-2.5"
	aria-hidden="true"
	data-consolation
>
	<span class="font-ui text-accent text-2xl leading-none font-bold">✓</span>
	<div class="flex min-w-0 grow flex-col">
		<span class="font-ui text-ink text-[15px] font-bold tracking-[1.5px] uppercase"
			>{ts('consolation.title')}</span
		>
		<span class="text-[13px] text-[#bdf7f2]"
			>{tf<(name: string) => string>('consolation.detail')(name)} · {quality}</span
		>
	</div>
	<span class="font-ui tabular text-score text-xl font-bold whitespace-nowrap">
		+{formatNumber(points)}
		<span class="text-ink-muted text-xs">{ts('hud.creditsShort')}</span>
	</span>
</div>
