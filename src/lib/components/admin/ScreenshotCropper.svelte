<script lang="ts">
	/**
	 * The crop step (Sprint 8 slice 3): a fixed 16:9 window with the image moving
	 * behind it, the rest of the image dimmed around it. What is inside the window
	 * is exactly what the card will show.
	 *
	 * The state is a rectangle in the source's own pixels and every rule — the
	 * minimum, the edges, the zoom limits — lives in `$lib/crop`, so this
	 * component only turns pointer, wheel and key input into calls to it.
	 * Hand-written rather than `svelte-easy-crop`, which has no keyboard control
	 * and whose bindable position skips its own clamping (docs/history/08-normal-pro-crop-endless.md § 8b).
	 */
	import Spinner from '$lib/components/admin/Spinner.svelte';
	import {
		clampCrop,
		cropOutputSize,
		cropQuality,
		defaultCrop,
		maxCropWidth,
		minCropWidth,
		panCrop,
		resizeCrop,
		zoomCrop
	} from '$lib/crop';
	import type { CropRect, CropSelection, PixelSize } from '$lib/types';

	interface Props {
		/** An object URL of the exact bytes that will be encoded. */
		src: string;
		/** The image's size as `readImageSize()` decoded it. */
		source: PixelSize;
		/** Where to start; the largest centred 16:9 area when absent. */
		initial?: CropRect | null;
		confirmLabel?: string;
		cancelLabel?: string;
		/** Set while the caller encodes and uploads; disables both buttons. */
		busy?: boolean;
		/** Shown under the buttons — the operator is looking at this dialog. */
		error?: string | null;
		onconfirm: (selection: CropSelection) => void;
		oncancel: () => void;
	}

	let {
		src,
		source,
		initial = null,
		confirmLabel = 'Use this crop',
		cancelLabel = 'Cancel',
		busy = false,
		error = null,
		onconfirm,
		oncancel
	}: Props = $props();

	/** The window takes this share of the stage; the rest shows what is cut off. */
	const WINDOW_SHARE = 0.8;
	const ZOOM_STEP = 1.1;
	/** Wheel delta that zooms by a factor of e. */
	const WHEEL_SCALE = 300;
	/** Pixels per wheel "line", for browsers that scroll in lines. */
	const LINE_HEIGHT = 16;

	// The caller remounts this component for each image.
	// svelte-ignore state_referenced_locally
	let crop: CropRect = $state(initial ? clampCrop(initial, source) : defaultCrop(source));
	let stage: HTMLDivElement | undefined = $state();
	let stageWidth = $state(0);

	const minWidth = $derived(minCropWidth(source));
	const maxWidth = $derived(maxCropWidth(source));
	const zoomLocked = $derived(minWidth === maxWidth);
	const output = $derived(cropOutputSize(crop));
	const quality = $derived(cropQuality(crop));

	const windowWidth = $derived(stageWidth * WINDOW_SHARE);
	const inset = $derived((stageWidth * (1 - WINDOW_SHARE)) / 2);
	/** Screen pixels per source pixel. */
	const scale = $derived(crop.width > 0 ? windowWidth / crop.width : 0);
	const imageStyle = $derived(
		`left:${inset - crop.x * scale}px;top:${(inset * 9) / 16 - crop.y * scale}px;` +
			`width:${source.width * scale}px;height:${source.height * scale}px`
	);

	/** A fraction of the window a screen point sits at — the anchor for a zoom. */
	function anchorAt(clientX: number, clientY: number): { x: number; y: number } {
		if (!stage || windowWidth === 0) return { x: 0.5, y: 0.5 };
		const rect = stage.getBoundingClientRect();
		return {
			x: (clientX - rect.left - inset) / windowWidth,
			y: (clientY - rect.top - (inset * 9) / 16) / ((windowWidth * 9) / 16)
		};
	}

	// ── Pointer: one pointer pans, two pinch. Mouse and touch alike. ─────────
	// Plain Map on purpose: pointer positions are bookkeeping, nothing renders from them.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const pointers = new Map<number, { x: number; y: number }>();
	let gesture: { crop: CropRect; x: number; y: number; distance: number } | null = null;

	function centreAndDistance() {
		const points = [...pointers.values()];
		const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
		const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
		const distance =
			points.length > 1 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0;
		return { x, y, distance };
	}

	/** Every change in the number of pointers starts the gesture afresh. */
	function restartGesture() {
		gesture = pointers.size > 0 ? { crop, ...centreAndDistance() } : null;
	}

	function onpointerdown(event: PointerEvent) {
		if (event.button !== 0) return;
		stage?.setPointerCapture(event.pointerId);
		stage?.focus();
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		restartGesture();
	}

	function onpointermove(event: PointerEvent) {
		if (!gesture || !pointers.has(event.pointerId)) return;
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		const now = centreAndDistance();

		// Zoom about where the fingers started, then follow where they went.
		let next = gesture.crop;
		if (pointers.size > 1 && gesture.distance > 0) {
			next = zoomCrop(
				next,
				now.distance / gesture.distance,
				source,
				anchorAt(gesture.x, gesture.y)
			);
		}
		const pixelsPerScreen = next.width / windowWidth;
		crop = panCrop(
			next,
			-(now.x - gesture.x) * pixelsPerScreen,
			-(now.y - gesture.y) * pixelsPerScreen,
			source
		);
	}

	function onpointerup(event: PointerEvent) {
		pointers.delete(event.pointerId);
		restartGesture();
	}

	// Svelte registers `onwheel` as passive; the page must not scroll instead.
	$effect(() => {
		const node = stage;
		if (!node) return;
		const onwheel = (event: WheelEvent) => {
			event.preventDefault();
			// Firefox can report lines or pages instead of pixels.
			const unit =
				event.deltaMode === WheelEvent.DOM_DELTA_LINE
					? LINE_HEIGHT
					: event.deltaMode === WheelEvent.DOM_DELTA_PAGE
						? node.clientHeight
						: 1;
			const factor = Math.exp((-event.deltaY * unit) / WHEEL_SCALE);
			crop = zoomCrop(crop, factor, source, anchorAt(event.clientX, event.clientY));
		};
		node.addEventListener('wheel', onwheel, { passive: false });
		return () => node.removeEventListener('wheel', onwheel);
	});

	// The step opens with the keyboard already on the image.
	$effect(() => {
		stage?.focus();
	});

	// ── Keyboard ──────────────────────────────────────────────────────────────
	function onkeydown(event: KeyboardEvent) {
		// Leave Cmd/Ctrl + − / = / 0 to the browser's own zoom.
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		const step = event.shiftKey
			? Math.max(10, Math.round(crop.width / 10))
			: Math.max(1, Math.round(crop.width / 100));

		switch (event.key) {
			case 'ArrowLeft':
				crop = panCrop(crop, -step, 0, source);
				break;
			case 'ArrowRight':
				crop = panCrop(crop, step, 0, source);
				break;
			case 'ArrowUp':
				crop = panCrop(crop, 0, -step, source);
				break;
			case 'ArrowDown':
				crop = panCrop(crop, 0, step, source);
				break;
			case '+':
			case '=':
				crop = zoomCrop(crop, ZOOM_STEP, source);
				break;
			case '-':
			case '_':
				crop = zoomCrop(crop, 1 / ZOOM_STEP, source);
				break;
			case '0':
				crop = defaultCrop(source);
				break;
			case 'Enter':
				confirm();
				break;
			default:
				return;
		}
		event.preventDefault();
	}

	function confirm() {
		if (!busy) onconfirm({ crop, source });
	}
</script>

<div class="flex w-[min(80vw,960px)] flex-col gap-3">
	<!--
		A focusable application region is the pattern for a custom 2D control that
		takes its own keys; Svelte counts `application` as non-interactive.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={stage}
		bind:clientWidth={stageWidth}
		role="application"
		aria-label="Crop area, {crop.width} by {crop.height} pixels at {crop.x}, {crop.y}"
		aria-describedby="crop-help"
		tabindex="0"
		{onkeydown}
		{onpointerdown}
		{onpointermove}
		{onpointerup}
		onpointercancel={onpointerup}
		class="focus-visible:ring-accent relative aspect-video w-full cursor-move touch-none overflow-hidden rounded-lg bg-black outline-none select-none focus-visible:ring-2"
	>
		{#if stageWidth > 0}
			<img
				{src}
				alt=""
				draggable="false"
				class="pointer-events-none absolute max-w-none"
				style={imageStyle}
			/>
		{/if}
		<!-- the window: everything outside it is dimmed, everything inside is kept -->
		<div
			class="pointer-events-none absolute inset-[10%] border border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]"
		></div>
	</div>

	<div class="flex flex-wrap items-center gap-3 text-xs text-gray-300">
		<button
			type="button"
			aria-label="Zoom out"
			onclick={() => (crop = zoomCrop(crop, 1 / ZOOM_STEP, source))}
			disabled={zoomLocked || crop.width >= maxWidth}
			class="h-7 w-7 cursor-pointer rounded border border-gray-700 bg-gray-900 hover:bg-gray-800 disabled:cursor-default disabled:opacity-30"
			>−</button
		>
		<input
			type="range"
			aria-label="Zoom"
			aria-valuetext="{crop.width} by {crop.height} pixels"
			min={minWidth}
			max={maxWidth}
			step="1"
			value={maxWidth + minWidth - crop.width}
			disabled={zoomLocked}
			oninput={(event) =>
				(crop = resizeCrop(crop, maxWidth + minWidth - Number(event.currentTarget.value), source))}
			class="accent-accent w-40"
		/>
		<button
			type="button"
			aria-label="Zoom in"
			onclick={() => (crop = zoomCrop(crop, ZOOM_STEP, source))}
			disabled={zoomLocked || crop.width <= minWidth}
			class="h-7 w-7 cursor-pointer rounded border border-gray-700 bg-gray-900 hover:bg-gray-800 disabled:cursor-default disabled:opacity-30"
			>+</button
		>
		<button
			type="button"
			onclick={() => (crop = defaultCrop(source))}
			class="cursor-pointer text-gray-400 hover:text-white">Reset</button
		>
		<span class="ml-auto font-mono text-gray-400" data-testid="crop-readout">
			{crop.width}×{crop.height} at {crop.x},{crop.y} → saves {output.width}×{output.height}
		</span>
	</div>

	{#if quality === 'tooSmall'}
		<p role="status" class="text-xs text-red-300">
			This image only holds {maxWidth}×{crop.height} in 16:9 — below the 640×360 minimum, so zoom is locked
			and it will look blurry on the card.
		</p>
	{:else if quality === 'soft'}
		<p role="status" class="text-xs text-amber-300">
			Below 960×540 — it will look soft on large screens.
		</p>
	{/if}

	<p id="crop-help" class="text-[11px] text-gray-500">
		Drag to move · wheel, pinch or + / − to zoom · arrow keys move (Shift: faster) · 0 resets ·
		Enter confirms
	</p>

	<div class="flex flex-col items-center gap-2">
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={oncancel}
				disabled={busy}
				class="cursor-pointer rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 disabled:opacity-60"
			>
				{cancelLabel}
			</button>
			<button
				type="button"
				onclick={confirm}
				disabled={busy}
				class="bg-accent text-on-accent hover:bg-accent-strong flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
			>
				{#if busy}<Spinner label="Working" />{/if}
				{confirmLabel}
			</button>
		</div>
		{#if error}
			<p role="alert" class="max-w-sm text-center text-xs text-red-300">{error}</p>
		{/if}
	</div>
</div>
