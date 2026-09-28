<script lang="ts">
	import { resolveScreenshotUrl } from '$lib/imageUrl';
	import HorizonGrid from '../ui/HorizonGrid.svelte';
	import Wordmark from '../ui/Wordmark.svelte';

	// The link preview, 1200×630, from the canvas's "OG image" board. Seed screenshots from
	// static/, so rendering it needs no database.
	const ROWS = {
		before: { year: 1996, name: 'Super Mario 64', src: '/screenshots/super-mario-64.webp' },
		mystery: '/screenshots/half-life-2.webp',
		after: { year: 2013, name: 'The Last of Us', src: '/screenshots/the-last-of-us.webp' }
	};
</script>

{#snippet row(entry: { year: number; name: string; src: string })}
	<div
		class="rounded-card border-line bg-surface-raised flex items-center gap-4 border py-1.5 pr-1.5 pl-4.5"
	>
		<span class="tabular font-ui text-accent-strong w-19 text-[28px] font-bold">{entry.year}</span>
		<span class="grow text-[19px] font-medium">{entry.name}</span>
		<img
			src={resolveScreenshotUrl(entry.src)}
			alt=""
			class="rounded-thumb h-18.5 w-33 object-cover"
		/>
	</div>
{/snippet}

<div class="bg-bg font-body text-ink relative h-157.5 w-300 overflow-hidden">
	<HorizonGrid opacity={0.32} fade={false} class="absolute bottom-0 left-0 h-75 w-full" />
	<div
		class="border-magenta absolute inset-6 rounded-[18px] border-2 shadow-[0_0_24px_rgb(255_43_214/0.4),inset_0_0_18px_rgb(255_43_214/0.15)]"
	></div>

	<div class="absolute top-24 left-18 flex w-130 flex-col items-start gap-5.5">
		<Wordmark size={72} class="items-start!" />
		<div class="font-ui text-pink text-lg font-bold tracking-[6px]">// TIMELINE PROTOCOL v9</div>
		<div class="font-display mt-4.5 text-4xl leading-[1.2]">Put video games in order.</div>
		<div class="text-ink-muted text-[22px] leading-[1.45]">
			Guess the release year from a screenshot. Three lives, endless run.
		</div>
		<div class="font-ui text-accent mt-2 text-[22px] font-bold tracking-[2px]">geekster.pro</div>
	</div>

	<div
		class="absolute top-27.5 right-18 flex w-117.5 transform-[perspective(1400px)_rotateY(-12deg)] flex-col gap-3"
	>
		{@render row(ROWS.before)}
		<div
			class="rounded-card border-accent shadow-glow-card relative mx-6.5 my-0.5 -rotate-[2.5deg] overflow-hidden border-2"
		>
			<img
				src={resolveScreenshotUrl(ROWS.mystery)}
				alt=""
				class="block aspect-21/9 w-full object-cover"
			/>
			<div
				class="rounded-chip bg-bg/85 font-display absolute top-2.5 left-2.5 px-2.5 py-0.5 text-xl tracking-[2px] text-shadow-[-1.5px_0_0_var(--color-magenta),1.5px_0_0_var(--color-accent)]"
			>
				????
			</div>
		</div>
		{@render row(ROWS.after)}
	</div>
</div>
