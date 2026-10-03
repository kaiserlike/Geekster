<script lang="ts">
	import { checkName, type NameProblem } from '$lib/playerName';
	import { ts } from '$lib/i18n.svelte';
	import Button from './ui/Button.svelte';
	import TextField from './ui/TextField.svelte';

	interface Props {
		/** Unique per page: the field's id */
		id: string;
		/** The name to start from */
		initial?: string;
		/** Stores the checked name; answers 'saved', a problem the server found, or 'failed' */
		onsave: (name: string) => Promise<'saved' | NameProblem | 'failed'>;
		/** A second, quieter button: "Not now" on the result screen, "Cancel" on /leaderboard */
		cancelLabel?: string;
		oncancel?: () => void;
	}

	let { id, initial = '', onsave, cancelLabel, oncancel }: Props = $props();

	// The form starts from the name it was opened with; later changes to it don't reset the field
	// svelte-ignore state_referenced_locally
	let value: string = $state(initial);
	let error: string | undefined = $state(undefined);
	let saving: boolean = $state(false);

	// The rules are checked here for an instant answer, and again by the server
	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const check = checkName(value);
		if (!check.ok) {
			error = ts(`name.${check.problem}`);
			return;
		}
		saving = true;
		error = undefined;
		const outcome = await onsave(check.name);
		saving = false;
		if (outcome !== 'saved') error = ts(`name.${outcome}`);
	}
</script>

<form class="flex flex-col gap-3" onsubmit={submit} novalidate>
	<TextField
		{id}
		label={ts('name.label')}
		bind:value
		hint={ts('name.rules')}
		{error}
		autocomplete="nickname"
		autocapitalize="words"
		spellcheck="false"
		enterkeyhint="done"
		maxlength={40}
		oninput={() => (error = undefined)}
	/>
	<div class="flex gap-2">
		<Button type="submit" size="sm" class="flex-1" loading={saving}>{ts('name.save')}</Button>
		{#if cancelLabel && oncancel}
			<Button variant="secondary" size="sm" class="px-4" onclick={oncancel} disabled={saving}>
				{cancelLabel}
			</Button>
		{/if}
	</div>
</form>
