<script lang="ts">
	import type { Game } from '$lib/types';
	import { tf, ts } from '$lib/i18n.svelte';
	import { fade } from '$lib/motion';
	import IconButton from './ui/IconButton.svelte';

	interface Props {
		/** The anchor: the one game on the timeline, year shown */
		anchor: Game;
		ondismiss: () => void;
	}

	let { anchor, ondismiss }: Props = $props();
</script>

<!--
	The first-run coach mark (9e): between the card and the timeline, pointing down at the slots
	around the anchor. In the flow, so it never covers a slot; it goes with the first placement
-->
<aside
	class="rounded-card border-accent bg-surface relative mt-3 flex items-start gap-3 border-[1.5px] py-3 pr-2 pl-4 shadow-[0_0_14px_rgb(63_240_228/0.3)]"
	aria-labelledby="coach-title"
	transition:fade={{ duration: 200 }}
	data-coach-mark
>
	<div class="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
		<p id="coach-title" class="font-ui text-pink text-xs font-bold tracking-[2px] uppercase">
			{ts('coach.title')}
		</p>
		<p class="text-[15px] leading-snug">
			{tf<(name: string, year: number) => string>('coach.body')(anchor.name, anchor.year)}
		</p>
	</div>
	<IconButton label={ts('coach.dismiss')} onclick={ondismiss}>
		<span aria-hidden="true">✕</span>
	</IconButton>
	<!-- The pointer: a turquoise notch at the bottom edge, towards the slots -->
	<span
		aria-hidden="true"
		class="border-accent bg-surface absolute -bottom-[7px] left-10 size-3 rotate-45 border-r-[1.5px] border-b-[1.5px]"
	></span>
</aside>
