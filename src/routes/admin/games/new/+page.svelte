<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ScreenshotUpload from '$lib/components/admin/ScreenshotUpload.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let uploader: ScreenshotUpload | undefined = $state();
</script>

<svelte:head>
	<title>Add game — Geekster Admin</title>
</svelte:head>

<h1 class="mb-6 text-2xl font-bold text-white">Add game</h1>

{#if form?.error}
	<p
		role="alert"
		class="mb-4 rounded-lg border border-red-800 bg-red-950/60 p-3 text-sm text-red-200"
	>
		{form.error}
	</p>
{/if}

<form
	method="POST"
	enctype="multipart/form-data"
	class="max-w-lg space-y-5 rounded-xl border border-gray-800 bg-gray-900 p-6"
	use:enhance={({ formData }) => {
		// Send the downscaled WebP the component produced, not the original.
		const file = uploader?.takeFile();
		if (file) formData.set('screenshot', file, file.name);
	}}
>
	<div>
		<label class="mb-1 block text-sm font-medium text-gray-300" for="name">Name</label>
		<input
			id="name"
			name="name"
			required
			value={form?.name ?? ''}
			class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-purple-500"
		/>
	</div>

	<div>
		<label class="mb-1 block text-sm font-medium text-gray-300" for="year">Release year</label>
		<input
			id="year"
			name="year"
			type="number"
			required
			min="1958"
			max={new Date().getFullYear() + 2}
			value={form?.year ?? ''}
			class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-purple-500"
		/>
	</div>

	<div>
		<label class="mb-1 block text-sm font-medium text-gray-300" for="slug">
			Slug <span class="font-normal text-gray-500">(optional — derived from the name)</span>
		</label>
		<input
			id="slug"
			name="slug"
			value={form?.slug ?? ''}
			placeholder="super-mario-bros"
			class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-purple-500"
		/>
		<p class="mt-1 text-xs text-gray-500">The slug also names the file in the blob store.</p>
	</div>

	<div>
		<label class="mb-1 block text-sm font-medium text-gray-300" for="screenshot">
			Screenshot <span class="font-normal text-gray-500">(optional)</span>
		</label>
		<ScreenshotUpload bind:this={uploader} />
		<p class="mt-1 text-xs text-gray-500">
			Up to 8 MB. {#if data.rawgConfigured}You can also pull one from RAWG on the next screen.{:else}
				Set <code>RAWG_API_KEY</code> to import screenshots from RAWG.{/if}
		</p>
		{#if !data.blobConfigured}
			<p class="mt-2 rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-xs text-amber-200">
				<code>BLOB_READ_WRITE_TOKEN</code> is not set for this environment — uploads will fail.
			</p>
		{/if}
	</div>

	<div class="flex gap-3">
		<button
			type="submit"
			class="cursor-pointer rounded-lg bg-purple-600 px-5 py-2.5 font-semibold text-white hover:bg-purple-500"
		>
			Create game
		</button>
		<a
			href={resolve('/admin/games')}
			class="rounded-lg px-4 py-2.5 text-sm text-gray-400 hover:text-white">Cancel</a
		>
	</div>
</form>
