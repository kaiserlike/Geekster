<script lang="ts">
	import { getLocale, ts } from '$lib/i18n.svelte';
	import { shareText, type ShareResult } from '$lib/share';
	import { renderShareCard } from '$lib/shareCard';
	import Button from './ui/Button.svelte';
	import IconButton from './ui/IconButton.svelte';

	interface Props {
		result: ShareResult;
		/**
		 * An icon button whose note wraps onto its own line in the caller's flex row (the Daily
		 * card); otherwise a full-width button with the note under it (the result screen)
		 */
		compact?: boolean;
	}

	let { result, compact = false }: Props = $props();

	let image: Blob | null = $state(null);
	let imageUrl: string | null = $state(null);
	let outcome: 'copied' | 'failed' | null = $state(null);
	let sharing: boolean = $state(false);

	const text = $derived(shareText(result, getLocale()));
	const fileName = $derived(
		result.kind === 'daily'
			? `geekster-daily-${result.number}.png`
			: `geekster-endless-${result.mode}.png`
	);

	// The card is drawn as soon as the result is on screen, so a tap shares at once: a phone
	// only opens its share sheet close to the tap that asked for it
	$effect(() => {
		const current = result;
		const locale = getLocale();
		let cancelled = false;
		let url: string | null = null;
		renderShareCard(current, locale)
			.then((blob) => {
				if (cancelled) return;
				image = blob;
				url = URL.createObjectURL(blob);
				imageUrl = url;
			})
			.catch(() => {
				// No image: the text is shared alone
			});
		return () => {
			cancelled = true;
			if (url) URL.revokeObjectURL(url);
		};
	});

	/** The share sheet on a phone (with the card where it takes files), the clipboard elsewhere */
	async function share() {
		outcome = null;
		const coarse = window.matchMedia('(pointer: coarse)').matches;
		if (coarse && typeof navigator.share === 'function') {
			const file = image ? new File([image], fileName, { type: 'image/png' }) : null;
			const data =
				file && navigator.canShare?.({ files: [file] }) ? { text, files: [file] } : { text };
			sharing = true;
			try {
				await navigator.share(data);
				return;
			} catch (error) {
				// Closing the sheet is not a failure; anything else falls back to the clipboard
				if (error instanceof DOMException && error.name === 'AbortError') return;
			} finally {
				sharing = false;
			}
		}
		try {
			await navigator.clipboard.writeText(text);
			outcome = 'copied';
		} catch {
			outcome = 'failed';
		}
	}
</script>

{#snippet shareIcon()}
	<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
		<path
			d="M8 10V2M5 5l3-3 3 3M3 9v4h10V9"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

<div class={compact ? 'contents' : 'flex flex-col gap-2'} data-share={result.kind}>
	{#if compact}
		<IconButton label={ts('share.label')} class="min-h-12 w-12" disabled={sharing} onclick={share}>
			{@render shareIcon()}
		</IconButton>
	{:else}
		<Button variant="secondary" fullWidth loading={sharing} onclick={share}>
			{@render shareIcon()}
			{ts('share.button')}
		</Button>
	{/if}

	<div role="status" class="basis-full text-center text-sm empty:hidden">
		{#if outcome === 'copied'}
			<p class="text-accent m-0" data-share-outcome="copied">
				{ts('share.copied')}
				{#if imageUrl}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- a blob: URL, not a route -->
					<a href={imageUrl} download={fileName} class="text-ink ml-1 underline">
						{ts('share.download')}
					</a>
				{/if}
			</p>
		{:else if outcome === 'failed'}
			<p class="text-ink-muted m-0 mb-1.5">{ts('share.failed')}</p>
			<textarea
				readonly
				rows="4"
				aria-label={ts('share.button')}
				value={text}
				class="rounded-control border-line bg-surface-sunken text-ink w-full resize-none border p-2 text-left text-sm"
			></textarea>
		{/if}
	</div>
</div>
