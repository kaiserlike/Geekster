<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Bulk import — Geekster Admin</title>
</svelte:head>

<h1 class="mb-2 text-2xl font-bold text-white">Bulk import</h1>
<p class="mb-6 max-w-2xl text-sm text-gray-400">
	Paste CSV (<code>name,year</code> or <code>name,year,slug</code>) or a JSON array of objects with
	<code>name</code>, <code>year</code> and an optional <code>slug</code> — the shape of
	<code>games.json</code> works as well. Existing games are matched by slug and updated; new ones are
	created without a screenshot, so add one on the game's page afterwards.
</p>

{#if form?.error}
	<p
		role="alert"
		class="mb-4 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200"
	>
		{form.error}
	</p>
{:else if form?.inserted !== undefined}
	<p class="mb-4 rounded-lg border border-green-800 bg-green-950/50 p-3 text-sm text-green-200">
		{form.inserted} inserted, {form.updated} updated.
	</p>
{/if}

{#if form?.issues?.length}
	<ul
		class="mb-4 max-w-2xl list-inside list-disc rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-xs text-amber-200"
	>
		{#each form.issues as issue (issue)}
			<li>{issue}</li>
		{/each}
	</ul>
{/if}

<form method="POST" class="max-w-2xl space-y-4">
	<textarea
		name="data"
		rows="14"
		required
		placeholder="Chrono Trigger,1995&#10;Half-Life,1998"
		class="w-full rounded-xl border border-gray-700 bg-gray-950 p-4 font-mono text-sm text-white outline-none focus:border-purple-500"
		>{form?.raw ?? ''}</textarea
	>
	<button
		type="submit"
		class="cursor-pointer rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-500"
	>
		Import
	</button>
</form>
