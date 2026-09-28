<script lang="ts">
	import { ts, tf } from '$lib/i18n.svelte';
	import { LIFE_REGAIN_STREAK } from '$lib/placement';

	interface Props {
		streak: number;
		lives: number;
		maxLives: number;
	}

	let { streak, lives, maxLives }: Props = $props();

	// Progress toward the next life back; empty again right after a streak of 10.
	const streakToNextLife = $derived(streak % LIFE_REGAIN_STREAK);
	const livesFull = $derived(lives >= maxLives);
	const meterLabel = $derived(
		livesFull
			? ts('hud.livesFull')
			: tf<(n: number, of: number) => string>('hud.nextLife')(streakToNextLife, LIFE_REGAIN_STREAK)
	);
</script>

<!-- Magic meter: the streak's way to the next life back -->
<div class="flex flex-col items-center" style="margin-top: -2px;">
	<div class="flex h-5 items-center">
		<div
			class="h-3 w-24 overflow-hidden rounded-sm border border-green-700 bg-gray-900"
			role="progressbar"
			aria-valuemin={0}
			aria-valuemax={LIFE_REGAIN_STREAK}
			aria-valuenow={streakToNextLife}
			aria-label={meterLabel}
		>
			<div
				class="h-full rounded-sm bg-gradient-to-b from-green-400 to-green-600 transition-all duration-500 {livesFull
					? 'opacity-40'
					: ''}"
				style="width: {(streakToNextLife / LIFE_REGAIN_STREAK) * 100}%"
			></div>
		</div>
	</div>
	<p class="mt-1 text-[10px] leading-none tracking-wide text-green-500/80">
		{meterLabel}
	</p>
</div>
