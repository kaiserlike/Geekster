<script lang="ts">
	import type { RoundScore } from '$lib/types';
	import { formatMultiplier, formatNumber, tf, ts } from '$lib/i18n.svelte';
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import { fly } from '$lib/motion';
	import { MAX_NAME_BONUS } from '$lib/scoring';

	interface Props {
		roundScore: RoundScore;
		/** The screenshot of the game just placed */
		screenshot: string;
		/** The streak after this placement, the one its multiplier comes from */
		streak: number;
	}

	let { roundScore, screenshot, streak }: Props = $props();

	/** exact ✓, close ~ (some points), nope ✗, skipped —: never a colour alone */
	type Verdict = 'exact' | 'close' | 'nope' | 'skipped';

	const VERDICTS = {
		exact: { icon: '✓', tone: 'text-accent' },
		close: { icon: '~', tone: 'text-accent' },
		nope: { icon: '✗', tone: 'text-danger' },
		skipped: { icon: '—', tone: 'text-ink-muted' }
	} as const;

	const yearVerdict: Verdict = $derived.by(() => {
		if (roundScore.yearGuess === null) return 'skipped';
		if (roundScore.yearGuess === roundScore.actualYear) return 'exact';
		return roundScore.yearBonus > 0 ? 'close' : 'nope';
	});
	const nameVerdict: Verdict = $derived.by(() => {
		if (!roundScore.nameGuess) return 'skipped';
		if (roundScore.nameBonus >= MAX_NAME_BONUS) return 'exact';
		return roundScore.nameBonus > 0 ? 'close' : 'nope';
	});
	const yearOff = $derived(
		roundScore.yearGuess === null ? 0 : Math.abs(roundScore.yearGuess - roundScore.actualYear)
	);

	// The breakdown arrives line by line, then the total
	const STAGGER_MS = 300;
	const FIRST_MS = 200;
	let shown: number = $state(0);
	$effect(() => {
		const timers = Array.from({ length: 5 }, (_v, i) =>
			setTimeout(() => (shown = i + 1), FIRST_MS + i * STAGGER_MS)
		);
		return () => timers.forEach(clearTimeout);
	});
</script>

{#snippet points(verdict: Verdict, value: number)}
	<span class="font-ui tabular font-bold {VERDICTS[verdict].tone}">
		<span aria-hidden="true">{VERDICTS[verdict].icon}</span>
		+{value}
	</span>
{/snippet}

<section
	aria-label={ts('game.answer')}
	class="rounded-card border-accent bg-surface shadow-glow-card overflow-hidden border-2"
	in:fly={{ y: 30, duration: 300 }}
	data-reveal
>
	<!-- On desktop the left column never scrolls the page: the image gives up height first (41rem
	     is the HUD, a toast, the breakdown, "Next card" and the header) -->
	<img
		src={resolveScreenshotUrl(screenshot)}
		alt={roundScore.actualName}
		class="block aspect-[21/9] w-full object-cover lg:max-h-[min(26dvh,calc(100dvh-41rem))]"
	/>
	<div class="flex items-baseline justify-between gap-3 px-3.5 pt-2.5 pb-1">
		<h2 class="min-w-0 text-lg font-semibold">{roundScore.actualName}</h2>
		<span
			class="font-display text-focus text-3xl text-shadow-[-2px_0_0_var(--color-magenta),2px_0_0_var(--color-accent)]"
		>
			{roundScore.actualYear}
		</span>
	</div>

	<!-- A polite region, so the round's points are read once they are all there -->
	<dl class="flex flex-col gap-2 px-3.5 pt-1.5 pb-3.5 text-sm" aria-live="polite">
		{#if shown >= 1}
			<div class="flex items-center justify-between" in:fly={{ x: -20, duration: 250 }}>
				<dt class="text-ink-muted">{ts('score.placement')}</dt>
				<dd>{@render points(roundScore.base > 0 ? 'exact' : 'nope', roundScore.base)}</dd>
			</div>
		{/if}
		{#if shown >= 2}
			<div class="flex items-center justify-between" in:fly={{ x: -20, duration: 250 }}>
				<dt class="text-ink-muted">
					{ts('score.year')}
					{#if roundScore.yearGuess !== null}
						<span class="text-ink tabular">{roundScore.yearGuess}</span> ·
						{yearVerdict === 'exact'
							? ts('score.exact')
							: tf<(n: number) => string>('score.offBy')(yearOff)}
					{:else}
						· {ts('score.skipped')}
					{/if}
				</dt>
				<dd>{@render points(yearVerdict, roundScore.yearBonus)}</dd>
			</div>
		{/if}
		{#if shown >= 3}
			<div class="flex items-center justify-between gap-3" in:fly={{ x: -20, duration: 250 }}>
				<dt class="text-ink-muted min-w-0">
					{ts('score.name')}
					{#if roundScore.nameGuess}
						<span class="text-ink break-words">“{roundScore.nameGuess}”</span> ·
						{ts(`score.${nameVerdict}` as 'score.exact')}
					{:else}
						· {ts('score.skipped')}
					{/if}
				</dt>
				<dd class="shrink-0">{@render points(nameVerdict, roundScore.nameBonus)}</dd>
			</div>
		{/if}
		{#if shown >= 4 && roundScore.streakMultiplier > 1}
			<div class="flex items-center justify-between" in:fly={{ x: -20, duration: 250 }}>
				<dt class="text-ink-muted">{tf<(n: number) => string>('score.streak')(streak)}</dt>
				<dd class="font-ui text-pink tabular font-bold">
					{formatMultiplier(roundScore.streakMultiplier)}
				</dd>
			</div>
		{/if}
		{#if shown >= 5}
			<div
				class="border-line flex items-center justify-between border-t pt-2"
				in:fly={{ y: 10, duration: 300 }}
			>
				<dt class="font-ui text-sm font-bold tracking-[1.5px] uppercase">{ts('score.round')}</dt>
				<dd class="font-ui tabular text-score text-[22px] font-bold">
					+{formatNumber(roundScore.total)}
					{ts('hud.creditsShort')}
				</dd>
			</div>
		{/if}
	</dl>
</section>
