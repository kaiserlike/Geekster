<script lang="ts">
	import { LIFE_REGAIN_STREAK, MAX_LIVES } from '$lib/placement';
	import { tf, ts } from '$lib/i18n.svelte';
	import { slide } from '$lib/motion';

	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();

	// The six rules, off the first screen (U14): read once, when the player asks for them
	let open: boolean = $state(false);
</script>

<div class="flex flex-col {className}">
	<button
		type="button"
		aria-expanded={open}
		aria-controls="how-to-play"
		onclick={() => (open = !open)}
		class="focus-ring rounded-control font-ui text-accent hover:text-ink inline-flex min-h-11 items-center gap-2 self-center px-3 text-sm font-bold tracking-[1.5px] uppercase transition-colors duration-(--duration-fast) lg:self-start lg:px-0"
	>
		{ts('welcome.howToPlay')}
		<svg
			class="size-2.5 transition-transform duration-(--duration-base) {open ? 'rotate-90' : ''}"
			viewBox="0 0 10 10"
			aria-hidden="true"
		>
			<path d="M3 1l4 4-4 4" stroke="currentColor" stroke-width="1.8" fill="none" />
		</svg>
	</button>
	{#if open}
		<ol
			id="how-to-play"
			transition:slide={{ duration: 200 }}
			class="rounded-card border-line bg-surface text-ink-muted mt-2 flex flex-col gap-2.5 border p-4 text-[15px] leading-normal"
		>
			{#snippet rule(n: number)}
				<span class="font-ui text-accent-strong tabular w-4 shrink-0 font-bold">{n}</span>
			{/snippet}
			<li class="flex gap-3">{@render rule(1)}<span>{ts('welcome.rule1')}</span></li>
			<li class="flex gap-3">{@render rule(2)}<span>{ts('welcome.rule2')}</span></li>
			<li class="flex gap-3">
				{@render rule(3)}
				<span>
					{ts('welcome.rule3.pre')}
					<strong class="text-ink font-semibold">{ts('welcome.rule3.lives')}</strong>
					{ts('welcome.rule3.post')}
				</span>
			</li>
			<li class="flex gap-3">
				{@render rule(4)}
				<span>
					{ts('welcome.rule4.pre')}
					<strong class="text-ink font-semibold">{ts('welcome.rule4.year')}</strong>
					{ts('welcome.rule4.and')}
					<strong class="text-ink font-semibold">{ts('welcome.rule4.name')}</strong>
					{ts('welcome.rule4.post')}
				</span>
			</li>
			<li class="flex gap-3">
				{@render rule(5)}
				<span>
					{ts('welcome.rule5.pre')}
					<strong class="text-ink font-semibold"
						>{tf<(n: number) => string>('welcome.rule5.streak')(LIFE_REGAIN_STREAK)}</strong
					>
					{tf<(n: number) => string>('welcome.rule5.post')(MAX_LIVES)}
				</span>
			</li>
			<li class="flex gap-3">{@render rule(6)}<span>{ts('welcome.rule6')}</span></li>
		</ol>
	{/if}
</div>
