<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import RawgPicker from '$lib/components/admin/RawgPicker.svelte';
	import ScreenshotUpload from '$lib/components/admin/ScreenshotUpload.svelte';
	import Spinner from '$lib/components/admin/Spinner.svelte';
	import TierToggle from '$lib/components/admin/TierToggle.svelte';
	import { appendCrop } from '$lib/crop';
	import { parseDifficulty, type Difficulty } from '$lib/screenshotTiers';
	import type { CropSelection } from '$lib/types';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let uploader: ScreenshotUpload | undefined = $state();
	let creating = $state(false);

	/** Tracked so the RAWG search can default to whatever has been typed. */
	let name = $state('');

	/** The slot the first screenshot goes into. Normal unless this is a Pro-only game. */
	// svelte-ignore state_referenced_locally
	let tier: Difficulty = $state(parseDifficulty(form?.difficulty));

	/**
	 * A screenshot chosen from RAWG, already re-encoded to WebP and waiting for
	 * the game it belongs to. The edit page can upload one the moment it is
	 * picked; here there is no game yet, so the file rides along with the create
	 * submission and the server stores it exactly as it stores a picked file.
	 */
	let rawgFile: File | null = $state(null);
	let rawgSource: string | null = $state(null);
	let rawgCrop: CropSelection | null = $state(null);
	let rawgPreview: string | null = $state(null);

	function dropRawgChoice() {
		if (rawgPreview) URL.revokeObjectURL(rawgPreview);
		rawgPreview = null;
		rawgFile = null;
		rawgSource = null;
		rawgCrop = null;
	}

	/**
	 * The file picker and the RAWG picker feed the same single `screenshot`
	 * field, so they clear each other: whichever was used last is the one that
	 * gets uploaded, and only one preview is ever on screen.
	 */
	function takeRawgChoice(file: File, sourceUrl: string, selection: CropSelection) {
		dropRawgChoice();
		uploader?.clear();
		rawgFile = file;
		rawgSource = sourceUrl;
		rawgCrop = selection;
		rawgPreview = URL.createObjectURL(file);
	}

	function onFilePicked(file: File | null) {
		if (file) dropRawgChoice();
	}

	function kb(bytes: number): string {
		return `${Math.round(bytes / 1024)} kB`;
	}

	$effect(() => dropRawgChoice);
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
		// Send the downscaled WebP — either the one the file picker produced or
		// the one chosen from RAWG. Never the original bytes.
		const picked = uploader?.takeFile();
		const file = picked ?? rawgFile;
		if (file) formData.set('screenshot', file, file.name);
		// Only a RAWG choice has a source; a picked file has none.
		if (!picked && rawgFile && rawgSource) formData.set('sourceUrl', rawgSource);
		const crop = picked ? uploader?.takeCrop() : rawgFile ? rawgCrop : null;
		if (crop) appendCrop(formData, crop);
		creating = true;
		return async ({ update }) => {
			creating = false;
			await update();
		};
	}}
>
	<div>
		<label class="mb-1 block text-sm font-medium text-gray-300" for="name">Name</label>
		<input
			id="name"
			name="name"
			required
			value={form?.name ?? ''}
			oninput={(event) => (name = event.currentTarget.value)}
			class="focus:border-accent w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none"
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
			class="focus:border-accent w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none"
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
			class="focus:border-accent w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 font-mono text-sm text-white outline-none"
		/>
		<p class="mt-1 text-xs text-gray-500">
			Players never see it: screenshot files get random names.
		</p>
	</div>

	<div>
		<label class="mb-1 block text-sm font-medium text-gray-300" for="screenshot">
			Screenshot <span class="font-normal text-gray-500">(optional)</span>
		</label>
		<div class="mb-2">
			<TierToggle bind:value={tier} label="Slot" />
		</div>
		<ScreenshotUpload bind:this={uploader} onselect={onFilePicked} />
		<p class="mt-1 text-xs text-gray-500">
			Up to 8 MB. Picking a file replaces a screenshot chosen from RAWG, and the other way round —
			the game starts with one. Choose Pro only for a game that should never appear in Normal.
		</p>
		{#if !data.blobConfigured}
			<p class="mt-2 rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-xs text-amber-200">
				<code>BLOB_READ_WRITE_TOKEN</code> is not set for this environment — uploads will fail.
			</p>
		{/if}

		<div class="mt-5 border-t border-gray-800 pt-5">
			<RawgPicker
				configured={data.rawgConfigured}
				gameName={name}
				chooseLabel="Use for this game"
				onchoose={takeRawgChoice}
			/>

			{#if rawgPreview && rawgFile}
				<div
					class="border-line-strong bg-accent-soft/50 mt-3 flex items-center gap-3 rounded-lg border p-3"
				>
					<img src={rawgPreview} alt="Chosen screenshot" class="h-20 w-32 rounded object-cover" />
					<div class="min-w-0 flex-1 text-xs">
						<p class="text-accent font-medium">Ready to upload with the game</p>
						<p class="mt-0.5 text-gray-500">
							{kb(rawgFile.size)} WebP{#if rawgCrop}
								· <span class="font-mono">{rawgCrop.crop.width}×{rawgCrop.crop.height}</span>{/if}
						</p>
					</div>
					<button
						type="button"
						onclick={dropRawgChoice}
						class="cursor-pointer text-xs text-gray-500 hover:text-red-400"
					>
						Remove
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div>
		<label class="flex cursor-pointer items-start gap-3">
			<input
				type="checkbox"
				name="draft"
				checked={form ? form.draft : true}
				class="mt-0.5 h-4 w-4 cursor-pointer accent-amber-500"
			/>
			<span class="text-sm">
				<span class="font-medium text-gray-300">Create as draft</span>
				<span class="mt-0.5 block text-xs text-gray-500">
					A draft never appears in a round, however many screenshots it has. Publish it from the
					game's own page once it has been reviewed.
				</span>
			</span>
		</label>
	</div>

	<div class="flex gap-3">
		<button
			type="submit"
			disabled={creating}
			class="bg-accent text-on-accent hover:bg-accent-strong flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 font-semibold disabled:opacity-60"
		>
			{#if creating}<Spinner label="Creating" />{/if}
			Create game
		</button>
		<a
			href={resolve('/admin/games')}
			class="rounded-lg px-4 py-2.5 text-sm text-gray-400 hover:text-white">Cancel</a
		>
	</div>
</form>
