<script lang="ts">
	interface Props {
		/** Field name the server action reads. */
		name?: string;
		id?: string;
		required?: boolean;
		/** Longest edge the image is scaled down to before uploading. */
		maxEdge?: number;
	}

	let {
		name = 'screenshot',
		id = 'screenshot',
		required = false,
		maxEdge = 1600
	}: Props = $props();

	const ACCEPT = 'image/webp,image/png,image/jpeg,image/gif,image/avif';
	const WEBP_QUALITY = 0.85;

	let previewUrl: string | null = $state(null);
	let originalSize = $state(0);
	let processedSize = $state(0);
	let working = $state(false);

	/**
	 * The file the form should send: a WebP re-encode of the selection, scaled so
	 * its longest edge is at most `maxEdge`. Screenshots arrive at wildly
	 * different sizes and the blob store keeps whatever it is given, so this
	 * normalises them before they leave the browser.
	 */
	let resized: File | null = $state(null);

	export function takeFile(): File | null {
		return resized;
	}

	function revoke() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
	}

	async function handleChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		revoke();
		resized = null;
		processedSize = 0;
		originalSize = file?.size ?? 0;
		if (!file) return;

		working = true;
		try {
			const bitmap = await createImageBitmap(file);
			const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
			const canvas = document.createElement('canvas');
			canvas.width = Math.round(bitmap.width * scale);
			canvas.height = Math.round(bitmap.height * scale);

			const context = canvas.getContext('2d');
			if (!context) throw new Error('No 2D canvas context');
			context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
			bitmap.close();

			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
			);
			if (!blob) throw new Error('Could not encode the image');

			resized = new File([blob], `${file.name.replace(/\.\w+$/, '')}.webp`, {
				type: 'image/webp'
			});
			processedSize = resized.size;
			previewUrl = URL.createObjectURL(resized);
		} catch (err) {
			// Fall back to uploading the untouched file the input already holds.
			console.error('Could not pre-process the image:', err);
			previewUrl = URL.createObjectURL(file);
		} finally {
			working = false;
		}
	}

	function kb(bytes: number): string {
		return `${Math.round(bytes / 1024)} kB`;
	}

	$effect(() => revoke);
</script>

<input
	{id}
	{name}
	{required}
	type="file"
	accept={ACCEPT}
	onchange={handleChange}
	class="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-300 file:mr-3 file:rounded file:border-0 file:bg-gray-800 file:px-3 file:py-1.5 file:text-gray-200"
/>

{#if working}
	<p class="mt-2 text-xs text-gray-500">Preparing the image…</p>
{:else if previewUrl}
	<div class="mt-2 flex items-center gap-3">
		<img src={previewUrl} alt="Preview" class="h-20 w-32 rounded object-cover" />
		<p class="text-xs text-gray-500">
			{kb(originalSize)}
			{#if processedSize > 0}→ {kb(processedSize)} WebP{/if}
		</p>
	</div>
{/if}
