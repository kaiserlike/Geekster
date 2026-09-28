<script lang="ts">
	import { ts } from '$lib/i18n.svelte';
	import StreakMeter from './StreakMeter.svelte';

	interface Props {
		lives: number;
		maxLives: number;
		streak: number;
		/** The last placement gave a life back: the newest heart pops */
		lifeRegained: boolean;
		correctPlacements: number;
		totalScore: number;
	}

	let { lives, maxLives, streak, lifeRegained, correctPlacements, totalScore }: Props = $props();
</script>

<div class="mt-2 flex justify-center gap-4" data-run-hud>
	<!-- Lives -->
	<div class="flex flex-col items-center">
		<div class="flex h-5 items-center gap-0.5">
			{#each Array.from({ length: maxLives }, (_v, i) => i) as i (i)}
				<svg
					class="h-5 w-5 {lifeRegained && i === lives - 1 ? 'motion-safe:animate-heart-pop' : ''}"
					data-heart={i < lives ? 'full' : 'empty'}
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
						fill={i < lives ? '#ef4444' : 'none'}
						stroke={i < lives ? '#ef4444' : '#4b5563'}
						stroke-width="2"
					/>
				</svg>
			{/each}
		</div>
		<div class="mt-1 flex w-full items-center gap-1">
			<div class="h-[1.5px] flex-1 bg-red-500/50"></div>
			<p class="text-[10px] leading-none tracking-wide text-red-500/80">{ts('hud.life')}</p>
			<div class="h-[1.5px] flex-1 bg-red-500/50"></div>
		</div>
	</div>
	<StreakMeter {streak} {lives} {maxLives} />
	<!-- Placed so far -->
	<div class="flex flex-col items-center" style="margin-top: -2px;">
		<p class="flex h-5 items-center text-sm font-bold text-white tabular-nums">
			{correctPlacements}
		</p>
		<p class="mt-1 text-[10px] leading-none tracking-wide text-gray-400">
			{ts('hud.placed')}
		</p>
	</div>
	{#if streak > 1}
		<p class="text-sm font-bold text-orange-400">
			{streak}x {ts('hud.streak')}
		</p>
	{/if}
	<!-- Rupee counter -->
	<div class="flex flex-col items-center" style="margin-top: -2px;">
		<div class="flex h-5 items-center gap-1">
			<svg class="h-5 w-3" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<!-- Zelda rupee: hexagonal gem with faceted shading -->
				<path d="M6 0 L0 6 L0 14 L6 20 Z" fill="#16a34a" />
				<path d="M6 0 L12 6 L12 14 L6 20 Z" fill="#15803d" />
				<path d="M6 0 L0 6 L6 8 Z" fill="#4ade80" />
				<path d="M6 0 L12 6 L6 8 Z" fill="#22c55e" />
				<path d="M0 14 L6 20 L6 12 Z" fill="#22c55e" />
				<path d="M12 14 L6 20 L6 12 Z" fill="#166534" />
				<path d="M0 6 L6 8 L12 6 L12 14 L6 12 L0 14 Z" fill="#16a34a" />
			</svg>
			<p class="text-sm font-bold text-green-400 tabular-nums">
				{totalScore.toLocaleString()}
			</p>
		</div>
		<p class="mt-1 text-[10px] leading-none tracking-wide text-green-500/80">
			{ts('hud.rupees')}
		</p>
	</div>
</div>
