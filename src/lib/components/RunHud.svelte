<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { formatNumber, tf, ts } from '$lib/i18n.svelte';
	import { countUpDuration, EASE } from '$lib/motion';
	import { LIFE_REGAIN_STREAK, streakMeter, type HudMoment } from '$lib/placement';
	import DailyProgress from './DailyProgress.svelte';
	import MultiplierLadder from './MultiplierLadder.svelte';
	import Surface from './ui/Surface.svelte';
	import CreditCoin from './ui/icons/CreditCoin.svelte';
	import Heart from './ui/icons/Heart.svelte';

	interface Props {
		lives: number;
		maxLives: number;
		streak: number;
		totalScore: number;
		/** What the last placement did: red frame and a broken heart, pink frame and a heart back */
		moment?: HudMoment;
		/** One line (hearts, ladder or squares, chip, score), while dragging */
		compact?: boolean;
		/** An endless run's card on show; the Daily counts its own */
		card?: number | null;
		/**
		 * A Daily Run: squares for the ten cards placed so far instead of the multiplier ladder. Its
		 * ten cards never reach a life back, so no heart charges either
		 */
		daily?: { marks: string; cardUp: boolean } | null;
	}

	let {
		lives,
		maxLives,
		streak,
		totalScore,
		moment = 'none',
		compact = false,
		card = null,
		daily = null
	}: Props = $props();

	const HEART_SIZE = 24;

	const HEARTS = $derived(Array.from({ length: maxLives }, (_v, i) => i));
	// The life just won back is the last full one; the one just lost is the first empty one
	const returningHeart = $derived(moment === 'lifeBack' ? lives - 1 : null);
	const brokenHeart = $derived(moment === 'wrong' ? lives : null);
	// The first empty heart fills up as the streak nears a life back (design 2D); while a heart
	// breaks, the one after it is the next to charge
	const charge = $derived(daily ? null : streakMeter(streak, lives, maxLives).charge);
	const chargingHeart = $derived.by(() => {
		if (charge === null) return null;
		const index = brokenHeart === null ? lives : lives + 1;
		return index < maxLives ? index : null;
	});

	const frame = $derived(
		moment === 'wrong' ? 'danger-glow' : moment === 'lifeBack' ? 'life-glow' : 'magenta'
	);

	// The credits count up to their new value; with reduced motion they jump
	const shownScore = new Tween(
		untrack(() => totalScore),
		{ easing: EASE.out }
	);
	$effect(() => {
		shownScore.set(totalScore, { duration: countUpDuration() });
	});
	const scoreText = $derived(formatNumber(Math.round(shownScore.current)));
</script>

{#snippet hearts(size: number, gap: string)}
	<div
		class="flex items-center {gap}"
		role="img"
		aria-label={tf<(n: number, of: number) => string>('hud.lives')(lives, maxLives)}
	>
		{#each HEARTS as i (i)}
			{#if i === brokenHeart}
				<Heart variant="broken" {size} class="motion-safe:animate-heart-break" />
			{:else if i < lives}
				<Heart
					{size}
					class={i === returningHeart
						? 'motion-safe:animate-heart-pop motion-reduce:animate-heart-fade'
						: ''}
				/>
			{:else if i === chargingHeart && charge !== null}
				<Heart variant="socket" {size} charge={charge / LIFE_REGAIN_STREAK} />
			{:else}
				<Heart variant="empty" {size} />
			{/if}
		{/each}
		{#if chargingHeart !== null && charge !== null}
			<!-- Spoken by the ladder's label, with the rest of the streak -->
			<span
				class="font-ui tabular text-pink ml-0.5 text-[11px] font-bold tracking-[0.5px]"
				aria-hidden="true"
				data-heart-charge={charge}
			>
				{charge}/{LIFE_REGAIN_STREAK}
			</span>
		{/if}
	</div>
{/snippet}

{#snippet credits(size: 'lg' | 'sm')}
	<p class="font-ui tabular flex items-center gap-1.5 font-bold">
		<span class="sr-only">
			{tf<(n: string) => string>('hud.credits')(formatNumber(totalScore))}
		</span>
		{#if size === 'lg'}
			<CreditCoin
				size={20}
				class="drop-shadow-[0_0_5px_color-mix(in_srgb,var(--color-coin)_70%,transparent)]"
			/>
		{/if}
		<span aria-hidden="true" class="text-score {size === 'lg' ? 'text-[22px]' : 'text-base'}">
			{scoreText}
		</span>
		{#if size === 'lg'}
			<span aria-hidden="true" class="text-ink-muted text-xs font-medium tracking-[1px]">
				{ts('hud.creditsShort')}
			</span>
		{/if}
	</p>
{/snippet}

<Surface
	as="section"
	{frame}
	padding="none"
	class="relative w-full transition-[border-color,box-shadow] duration-(--duration-base) motion-reduce:transition-none {compact
		? 'flex items-center gap-3 px-3.5 py-2.5'
		: 'flex flex-col gap-2.5 px-3.5 py-3'}"
>
	<h2 class="sr-only">{ts('hud.label')}</h2>
	<div class="contents" data-run-hud data-moment={moment}>
		{#if compact}
			{@render hearts(20, 'gap-[3px]')}
			{#if daily}
				<DailyProgress marks={daily.marks} cardUp={daily.cardUp} {streak} compact />
			{:else}
				<MultiplierLadder {streak} {lives} {maxLives} {moment} compact />
			{/if}
			{@render credits('sm')}
		{:else}
			<div class="flex items-center justify-between">
				{@render hearts(HEART_SIZE, 'gap-1')}
				{@render credits('lg')}
			</div>
			{#if daily}
				<DailyProgress marks={daily.marks} cardUp={daily.cardUp} {streak} />
			{:else}
				<MultiplierLadder {streak} {lives} {maxLives} {card} {moment} />
			{/if}
		{/if}
	</div>
</Surface>
