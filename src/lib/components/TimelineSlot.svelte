<script lang="ts">
	let { onPlace }: { onPlace: () => void } = $props();
</script>

<button
	onclick={onPlace}
	class="my-1 w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-700
		py-3 text-sm text-gray-500 transition-all
		hover:border-purple-500 hover:bg-purple-500/10 hover:text-purple-400"
>
	Place here
</button>
