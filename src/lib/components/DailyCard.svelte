<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatNumber, tf, ts } from '$lib/i18n.svelte';
	import type { DailyStatus } from '$lib/types';
	import type { ShareResult } from '$lib/share';
	import DailyMarks from './DailyMarks.svelte';
	import ShareButton from './ShareButton.svelte';
	import Button from './ui/Button.svelte';
	import Surface from './ui/Surface.svelte';

	interface Props {
		/** Today's Daily Run for this device; null while loading */
		status: DailyStatus | 'error' | null;
		/** The Daily is being started: the button spins */
		starting?: boolean;
		disabled?: boolean;
		onplay: () => void;
	}

	let { status, starting = false, disabled = false, onplay }: Props = $props();

	const MINUTE = 60_000;

	// The countdown to midnight UTC, refreshed every minute from the server's figure
	let shownAt: number = $state(Date.now());
	let now: number = $state(Date.now());
	$effect(() => {
		if (status && status !== 'error') shownAt = Date.now();
	});
	$effect(() => {
		const timer = setInterval(() => (now = Date.now()), MINUTE);
		return () => clearInterval(timer);
	});

	const untilNext = $derived.by(() => {
		if (!status || status === 'error') return '';
		const minutes = Math.max(1, Math.ceil((status.msUntilNext - (now - shownAt)) / MINUTE));
		return tf<(h: number, m: number) => string>('daily.hoursMinutes')(
			Math.floor(minutes / 60),
			minutes % 60
		);
	});
	const done = $derived(status && status !== 'error' && status.today?.over ? status.today : null);
	// Today's result, to share again later in the day (10e)
	const shareResult: ShareResult | null = $derived(
		done && status && status !== 'error'
			? {
					kind: 'daily',
					number: status.number,
					score: done.score,
					marks: done.marks,
					rank: done.rank === null ? null : { rank: done.rank, players: done.players }
				}
			: null
	);
</script>

<!--
	The Daily Run on the welcome screen (Sprint 10d, design A): today's number and the streak, then
	either the way in or, once played, the result with its rank and the way to today's board
-->
<Surface as="section" frame="magenta" padding="none" class="flex flex-col gap-3 p-4">
	{#if status === null}
		<div class="flex flex-col gap-3" aria-busy="true">
			<span class="sr-only">{ts('daily.loading')}</span>
			<div class="rounded-thumb h-7 w-40 bg-[#0c2a36] motion-safe:animate-pulse"></div>
			<div class="rounded-thumb h-13 bg-[#0c2a36] motion-safe:animate-pulse"></div>
		</div>
	{:else if status === 'error'}
		<p class="text-ink-muted text-sm">{ts('daily.unavailable')}</p>
	{:else}
		<div class="flex items-center justify-between gap-2">
			<h2 class="font-display text-ink m-0 text-[21px] leading-tight font-normal">
				{ts('daily.name')} <span class="text-pink">#{status.number}</span>
			</h2>
			{#if status.streak > 0}
				<span
					class="font-ui tabular text-score inline-flex items-center gap-1.5 text-[13px] font-bold"
					title={tf<(n: number) => string>('daily.streak')(status.streak)}
					data-daily-streak={status.streak}
				>
					<svg width="13" height="15" viewBox="0 0 12 14" aria-hidden="true">
						<path
							d="M6 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 2 2 2-1-2 0-4 0-6z"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linejoin="round"
						/>
					</svg>
					<span aria-hidden="true">{status.streak}</span>
					<span class="sr-only">{tf<(n: number) => string>('daily.streak')(status.streak)}</span>
				</span>
			{/if}
		</div>

		{#if done}
			<div class="flex flex-col items-center gap-2.5 py-1" data-daily-done>
				<p
					class="font-ui tabular text-score m-0 text-[30px] leading-none font-bold tracking-[1px] [text-shadow:0_0_14px_rgb(255_200_87/0.45)]"
				>
					{formatNumber(done.score)}
					<span class="text-ink-muted text-[15px]">{ts('hud.creditsShort')}</span>
				</p>
				<DailyMarks marks={done.marks} />
				{#if done.rank !== null}
					<p class="text-ink-muted m-0 text-sm">
						{tf<(rank: number, players: number) => string>('daily.place')(done.rank, done.players)}
					</p>
				{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				<a
					href="{resolve('/leaderboard')}?mode=daily"
					class="focus-ring rounded-control border-line-strong bg-surface-sunken text-ink hover:border-accent font-ui flex min-h-12 flex-1 items-center justify-center border-[1.5px] text-[13px] font-bold tracking-[1.5px] uppercase"
				>
					{ts('daily.board')}
				</a>
				{#if shareResult}
					<ShareButton compact result={shareResult} />
				{/if}
			</div>
			<p class="text-ink-muted m-0 text-center text-xs">
				{tf<(time: string) => string>('daily.next')(untilNext)}
			</p>
		{:else}
			<p class="text-ink-muted m-0 text-sm">{ts('daily.pitch')}</p>
			<Button variant="pink" fullWidth loading={starting} {disabled} onclick={onplay}>
				{status.today ? ts('daily.continue') : ts('daily.play')}
			</Button>
		{/if}
	{/if}
</Surface>
