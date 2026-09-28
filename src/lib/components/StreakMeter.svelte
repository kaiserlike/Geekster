<script lang="ts">
	import { formatMultiplier, tf, ts } from '$lib/i18n.svelte';
	import { LIFE_REGAIN_STREAK, streakMeter, type HudMoment } from '$lib/placement';
	import { MAX_STREAK_MULTIPLIER } from '$lib/scoring';
	import Chip from './ui/Chip.svelte';
	import Heart from './ui/icons/Heart.svelte';

	interface Props {
		streak: number;
		lives: number;
		maxLives: number;
		/** What just happened: the bar flashes at ten in a row, drains after a wrong placement */
		moment?: HudMoment;
		/** Bar and chip only, for the one-line HUD while dragging */
		compact?: boolean;
	}

	let { streak, lives, maxLives, moment = 'none', compact = false }: Props = $props();

	// The drain after a wrong placement sweeps right to left over DURATION.slow (400 ms)
	const DRAIN_STEP_MS = 40;
	const SEGMENTS = Array.from({ length: LIFE_REGAIN_STREAK }, (_v, i) => i);

	const meter = $derived(streakMeter(streak, lives, maxLives));
	const multiplier = $derived(formatMultiplier(meter.multiplier));
	const flashing = $derived(moment === 'lifeBack' || moment === 'tenInARow');
	const draining = $derived(moment === 'wrong');
	// ×1.0 earns nothing: the chip goes neutral, as it does when a wrong placement resets it
	const chipTone = $derived(meter.multiplier > 1 ? 'multiplier' : 'neutral');

	const toNextLifeText = $derived(
		meter.toNextLife === null
			? null
			: tf<(n: number, fresh: boolean) => string>('hud.toNextLife')(meter.toNextLife, streak === 0)
	);
	const caption = $derived(
		toNextLifeText ??
			(meter.multiplier >= MAX_STREAK_MULTIPLIER
				? ts('hud.multiplierMax')
				: tf<(max: string) => string>('hud.multiplierUpTo')(
						formatMultiplier(MAX_STREAK_MULTIPLIER)
					))
	);
	const meterLabel = $derived(
		tf<(streak: number, m: string, rest: string) => string>('hud.meterLabel')(
			streak,
			multiplier,
			toNextLifeText ? `${toNextLifeText} ${ts('hud.plusLife')}` : ts('hud.livesFullSpoken')
		)
	);
</script>

{#snippet bar()}
	<div
		class="grid h-3 flex-1 -skew-x-[14deg] grid-cols-10 gap-[3px] {flashing
			? 'motion-safe:animate-bar-flash'
			: ''}"
		role="progressbar"
		aria-valuemin={0}
		aria-valuemax={LIFE_REGAIN_STREAK}
		aria-valuenow={meter.filled}
		aria-label={meterLabel}
		data-streak-bar
	>
		{#each SEGMENTS as i (i)}
			<div
				class="transition-[background-color,box-shadow] duration-(--duration-fast) motion-reduce:transition-none {i <
				meter.filled
					? 'bg-accent shadow-glow-segment'
					: 'bg-accent-soft'}"
				style:transition-delay={draining
					? `${(LIFE_REGAIN_STREAK - 1 - i) * DRAIN_STEP_MS}ms`
					: '0ms'}
			></div>
		{/each}
	</div>
{/snippet}

{#if compact}
	<div class="flex min-w-0 flex-1 items-center gap-3">
		{@render bar()}
		<Chip tone={chipTone} size="md">{multiplier}</Chip>
	</div>
{:else}
	<div class="flex flex-col gap-2.5">
		<div class="flex items-baseline justify-between">
			<span
				class="font-ui tabular text-[15px] font-bold tracking-[1.5px] uppercase {flashing
					? 'text-ink [text-shadow:0_0_8px_var(--color-accent)]'
					: streak === 0
						? 'text-ink-muted'
						: 'text-accent-strong'}"
			>
				{tf<(n: number) => string>('hud.streakCount')(streak)}
			</span>
			<Chip tone={chipTone} size="md">{multiplier}</Chip>
		</div>
		<div class="flex items-center gap-2">
			{@render bar()}
			<!-- The socket's box stays when it is empty: nothing in the HUD may shift (U2) -->
			<span class="flex size-5 shrink-0 items-center justify-center" data-socket={meter.socket}>
				{#if meter.socket}
					<Heart variant="socket" size={20} />
				{/if}
			</span>
		</div>
		<p class="text-ink-muted text-[13px]" aria-hidden="true">
			{#if toNextLifeText}
				{toNextLifeText} → <span class="text-life font-semibold">{ts('hud.plusLife')}</span>
			{:else}
				{caption}
			{/if}
		</p>
	</div>
{/if}
