<script lang="ts">
	import { formatMultiplier, tf, ts } from '$lib/i18n.svelte';
	import { streakMeter, type HudMoment } from '$lib/placement';
	import Chip from './ui/Chip.svelte';
	import Flame from './ui/icons/Flame.svelte';

	interface Props {
		streak: number;
		lives: number;
		maxLives: number;
		/** The card on show: the one up now, or the one just placed until the next is dealt */
		card?: number | null;
		/** What just happened: the ladder flashes at ten in a row, drains after a wrong placement */
		moment?: HudMoment;
		/** Ladder and chip only, for the one-line HUD while dragging */
		compact?: boolean;
	}

	let { streak, lives, maxLives, card = null, moment = 'none', compact = false }: Props = $props();

	// The drain after a wrong placement sweeps right to left over DURATION.slow (400 ms)
	const DRAIN_STEP_MS = 60;
	// Each step stands taller than the one before it: a ladder, not a progress bar
	const STEP_BASE_PX = 6;
	const STEP_RISE_PX = 3;

	const meter = $derived(streakMeter(streak, lives, maxLives));
	const multiplier = $derived(formatMultiplier(meter.multiplier));
	const flashing = $derived(moment === 'lifeBack' || moment === 'tenInARow');
	const draining = $derived(moment === 'wrong');
	const chipTone = $derived(meter.multiplier > 1 ? 'multiplier' : 'neutral');

	const meterLabel = $derived(
		tf<(streak: number, m: string, rest: string) => string>('hud.meterLabel')(
			streak,
			multiplier,
			meter.toNextLife === null
				? ts('hud.livesFullSpoken')
				: `${tf<(n: number, fresh: boolean) => string>('hud.toNextLife')(meter.toNextLife, meter.charge === 0)} ${ts('hud.plusLife')}`
		)
	);
</script>

{#snippet ladder(labelled: boolean)}
	<div
		class="grid grid-cols-6 items-end {labelled ? 'gap-1' : 'w-16 shrink-0 gap-[3px]'} {flashing
			? 'motion-safe:animate-bar-flash'
			: ''}"
		role="img"
		aria-label={meterLabel}
		data-multiplier-ladder={meter.multiplier}
	>
		{#each meter.steps as step, i (step.value)}
			<div class="flex flex-col items-center gap-1">
				<span
					class="rounded-chip block w-full transition-[background-color,box-shadow] duration-(--duration-fast) motion-reduce:transition-none {step.lit
						? 'bg-accent shadow-glow-segment'
						: 'bg-accent-soft'}"
					style:height="{(STEP_BASE_PX + i * STEP_RISE_PX) * (labelled ? 1 : 0.6)}px"
					style:transition-delay={draining
						? `${(meter.steps.length - 1 - i) * DRAIN_STEP_MS}ms`
						: '0ms'}
				></span>
				{#if labelled}
					<span
						class="font-ui tabular font-bold {step.current
							? 'text-accent-strong text-sm [text-shadow:-1px_0_0_var(--color-magenta),1px_0_0_var(--color-accent)]'
							: 'text-ink-subtle text-xs'}"
						aria-hidden="true"
					>
						{formatMultiplier(step.value)}
					</span>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

{#if compact}
	<div class="flex min-w-0 flex-1 items-center gap-3">
		{@render ladder(false)}
		<Chip tone={chipTone} size="md">{multiplier}</Chip>
	</div>
{:else}
	<div class="flex flex-col gap-2.5">
		<div class="flex items-center justify-between">
			<p
				class="font-ui text-ink-muted m-0 text-[13px] font-bold tracking-[1.5px] uppercase"
				aria-hidden="true"
			>
				{#if card !== null}
					{ts('hud.card')} <span class="tabular text-ink">{card}</span> ·
				{/if}
				{ts('hud.multiplier')}
			</p>
			<span
				class="font-ui tabular inline-flex items-center gap-1.5 text-base font-bold {flashing
					? 'text-ink [text-shadow:0_0_8px_var(--color-accent)]'
					: streak > 0
						? 'text-score'
						: 'text-ink-subtle'}"
				data-run-streak={streak}
			>
				<Flame size={14} />
				<span aria-hidden="true">{streak}</span>
				<span class="sr-only">{tf<(n: number) => string>('hud.streakCount')(streak)}</span>
			</span>
		</div>
		{@render ladder(true)}
	</div>
{/if}
