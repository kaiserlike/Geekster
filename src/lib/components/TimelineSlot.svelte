<script lang="ts">
	import { ts } from '$lib/i18n.svelte';

	interface Props {
		onPlace: () => void;
		slotIndex: number;
		/** What the slot means in words: "Place between Super Mario 64 (1996) and …" */
		label: string;
		/** The drop target under a touch drag */
		highlighted?: boolean;
		/** A drag is on: every slot grows to 60 px (a compact timeline grows only its target) */
		expanded?: boolean;
		/** Past `COMPACT_TIMELINE_AT` on a pointer screen: 36 px (still above WCAG 2.5.8's 24) */
		compact?: boolean;
	}

	let {
		onPlace,
		slotIndex,
		label,
		highlighted = false,
		expanded = false,
		compact = false
	}: Props = $props();

	let dragOver: boolean = $state(false);
	let dragCounter = 0;

	const isTarget = $derived(highlighted || dragOver);
</script>

<button
	type="button"
	onclick={onPlace}
	ondragover={(e) => e.preventDefault()}
	ondragenter={() => {
		dragCounter++;
		dragOver = true;
	}}
	ondragleave={() => {
		dragCounter--;
		if (dragCounter === 0) dragOver = false;
	}}
	ondrop={(e) => {
		e.preventDefault();
		dragCounter = 0;
		dragOver = false;
		onPlace();
	}}
	data-slot-index={slotIndex}
	aria-label={label}
	class="focus-ring rounded-control font-ui w-full cursor-pointer font-bold tracking-[1.5px] uppercase transition-[height,border-color,background-color,box-shadow] duration-(--duration-fast) ease-out motion-reduce:transition-none
		{compact
		? expanded && isTarget
			? 'h-13'
			: 'h-11 text-[13px] lg:h-9 lg:text-xs'
		: expanded
			? 'h-15'
			: 'h-11 text-[13px]'}
		{isTarget
		? 'border-accent bg-accent-soft text-ink shadow-glow-accent border-2 text-[13px]'
		: 'border-line-strong bg-surface-sunken text-ink hover:border-accent active:bg-accent-soft border-[1.5px] border-dashed hover:border-solid'}"
>
	<span aria-hidden="true">
		{#if isTarget}
			▼ {ts('slot.dropHere')} ▼
		{:else}
			+ {ts('slot.placeHere')}
		{/if}
	</span>
</button>
