<script lang="ts" module>
	/** The square control's look, for a link that must look like one (`LangSwitch`) */
	export const ICON_BUTTON_CLASS =
		'focus-ring rounded-control border-line-strong bg-surface-raised font-ui text-ink enabled:hover:border-accent enabled:hover:bg-accent-soft disabled:text-ink-subtle inline-flex size-11 shrink-0 items-center justify-center border-[1.5px] text-sm font-bold transition-colors duration-(--duration-fast) ease-out disabled:cursor-not-allowed';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'aria-label'> {
		/** Required: an icon alone says nothing to a screen reader */
		label: string;
		children: Snippet;
	}

	let { label, type = 'button', class: className = '', children, ...rest }: Props = $props();
</script>

<button {type} aria-label={label} title={label} class="{ICON_BUTTON_CLASS} {className}" {...rest}>
	{@render children()}
</button>
