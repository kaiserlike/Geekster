<script lang="ts">
	/**
	 * Normal or Pro: which slot the next screenshot goes into. A pair of radio
	 * buttons, so it submits with a plain form and needs no script to work.
	 */
	import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '$lib/screenshotTiers';

	interface Props {
		value: Difficulty;
		/** The form field it submits as. */
		name?: string;
		label?: string;
	}

	let { value = $bindable(), name = 'difficulty', label = 'Add to' }: Props = $props();
</script>

<fieldset class="flex items-center gap-2 text-sm">
	<legend class="sr-only">{label}</legend>
	<span aria-hidden="true" class="text-gray-500">{label}</span>
	<div class="flex rounded-lg border border-gray-700 p-0.5">
		{#each DIFFICULTIES as tier (tier)}
			<label
				class="cursor-pointer rounded-md px-3 py-1 text-xs font-semibold has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-purple-500 {tier ===
				'pro'
					? 'text-gray-400 has-[:checked]:bg-sky-700'
					: 'text-gray-400 has-[:checked]:bg-emerald-700'}"
			>
				<input type="radio" {name} value={tier} bind:group={value} class="sr-only" />
				{DIFFICULTY_LABELS[tier]}
			</label>
		{/each}
	</div>
</fieldset>
