<script lang="ts">
	import { untrack } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { formatNumber, tf, ts } from '$lib/i18n.svelte';
	import { countUpDuration, EASE } from '$lib/motion';
	import type { HudMoment } from '$lib/placement';
	import StreakMeter from './StreakMeter.svelte';
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
		/** One line (hearts, bar, chip, score), while dragging */
		compact?: boolean;
	}

	let { lives, maxLives, streak, totalScore, moment = 'none', compact = false }: Props = $props();

	// The full layout's geometry, for the arc: hearts of 24 px, 4 px apart, inside a 14 × 12 px
	// padding; the socket's centre sits 10 px in from the padding, 86 px from the top
	const HUD_PADDING_X = 14;
	const HUD_PADDING_TOP = 12;
	const HEART_SIZE = 24;
	const HEART_GAP = 4;
	const SOCKET_INSET = HUD_PADDING_X + 10;
	const SOCKET_Y = 86;
	// The arc leaves the box to pass the score on its right, and crosses just above the top edge
	const ARC_OUTSIDE = 6;

	const HEARTS = $derived(Array.from({ length: maxLives }, (_v, i) => i));
	// The life just won back is the last full one; the one just lost is the first empty one
	const returningHeart = $derived(moment === 'lifeBack' ? lives - 1 : null);
	const brokenHeart = $derived(moment === 'wrong' ? lives : null);

	let hudWidth = $state(0);
	// Socket → up past the score → along above the top edge → down into the returning heart.
	// Decoration never runs through text, so it goes around the chip and the credits
	const arcPath = $derived.by(() => {
		if (returningHeart === null || hudWidth === 0) return '';
		const w = hudWidth;
		const heartX = HUD_PADDING_X + HEART_SIZE / 2 + returningHeart * (HEART_SIZE + HEART_GAP);
		const top = -ARC_OUTSIDE;
		return (
			`M ${w - SOCKET_INSET} ${SOCKET_Y} C ${w + ARC_OUTSIDE} ${SOCKET_Y - 16}, ` +
			`${w + ARC_OUTSIDE} ${top}, ${w - 48} ${top} ` +
			`L ${heartX + 24} ${top} Q ${heartX} ${top}, ${heartX} ${HUD_PADDING_TOP - 2}`
		);
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
			{:else}
				<Heart variant="empty" {size} />
			{/if}
		{/each}
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
			<StreakMeter {streak} {lives} {maxLives} {moment} compact />
			{@render credits('sm')}
		{:else}
			<div class="flex items-center justify-between">
				{@render hearts(HEART_SIZE, 'gap-1')}
				{@render credits('lg')}
			</div>
			<StreakMeter {streak} {lives} {maxLives} {moment} />

			{#if returningHeart !== null}
				<!-- The heart's way home: a dotted arc from the socket to the life that returns -->
				<div
					class="pointer-events-none absolute inset-0 hidden motion-safe:block"
					bind:clientWidth={hudWidth}
					aria-hidden="true"
				>
					<svg class="motion-safe:animate-arc-travel absolute inset-0 size-full overflow-visible">
						<path
							d={arcPath}
							fill="none"
							stroke="var(--color-life)"
							stroke-width="2"
							stroke-dasharray="2 6"
							stroke-linecap="round"
						/>
					</svg>
				</div>
			{/if}
		{/if}
	</div>
</Surface>
