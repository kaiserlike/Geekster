<script lang="ts">
	import { ts } from '$lib/i18n.svelte';

	let {
		onPlace,
		slotIndex = 0,
		highlighted = false,
		expanded = false
	}: {
		onPlace: () => void;
		slotIndex?: number;
		highlighted?: boolean;
		expanded?: boolean;
	} = $props();

	let dragOver: boolean = $state(false);

	const isHighlighted = $derived(highlighted || dragOver);

	let dragCounter = 0;
</script>

<button
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
	class="my-1 w-full cursor-pointer rounded-lg border-2 border-dashed transition-all
		{expanded ? 'py-6 text-base' : 'py-4 text-sm'}
		{isHighlighted
		? 'scale-[1.02] border-purple-500 bg-purple-500/20 text-purple-400'
		: 'border-gray-700 text-gray-500 hover:border-purple-500 hover:bg-purple-500/10 hover:text-purple-400'}
		active:scale-[0.98] active:border-purple-400 active:bg-purple-500/20"
>
	{isHighlighted ? ts('slot.dropHere') : ts('slot.placeHere')}
</button>
