/**
 * Dragging the current card onto a timeline slot: HTML5 drag and drop on desktop, a 250 ms
 * long-press on touch with a floating card and auto-scroll near the viewport edges. Pulled out
 * of `GameScreen.svelte` in Sprint 9c so the card and the timeline can share one instance.
 *
 * Slots are found by their `data-slot-index` attribute, so the timeline only has to render it.
 */

interface Point {
	x: number;
	y: number;
}

interface DragPlaceOptions {
	/** False while the card is not placeable (reveal, bonus guess, no card) */
	canDrag: () => boolean;
	/** A touch drag released over a slot. HTML5 drops reach the slot's own `ondrop` */
	onDrop: (slotIndex: number) => void;
}

const LONG_PRESS_MS = 250;
// A touch that moves this far before the long press fires is a scroll, not a drag
const SCROLL_CANCEL_PX = 10;
// A slot counts as under the finger this far above or below its box
const SLOT_HIT_PADDING = 10;
const AUTO_SCROLL_ZONE = 150;
const AUTO_SCROLL_MIN_SPEED = 6;
const AUTO_SCROLL_MAX_SPEED = 20;
const AUTO_SCROLL_TICK_MS = 16;
const DRAG_IMAGE_WIDTH = 150;

export class DragPlace {
	isDragging: boolean = $state(false);
	/** Where the floating card is drawn during a touch drag, or null */
	touchDragPos: Point | null = $state(null);
	highlightedSlotIndex: number | null = $state(null);

	#options: DragPlaceOptions;
	#touchStartPos: Point | null = null;
	#dragStarted = false;
	#longPressTimer: ReturnType<typeof setTimeout> | null = null;
	#autoScrollInterval: ReturnType<typeof setInterval> | null = null;
	#dragGhost: HTMLElement | null = null;

	constructor(options: DragPlaceOptions) {
		this.#options = options;
	}

	/** A placement happened (by drop or by tap): no drag is left over */
	reset(): void {
		this.isDragging = false;
		this.highlightedSlotIndex = null;
		this.#stopAutoScroll();
	}

	// --- HTML5 Drag & Drop (desktop) ---

	dragStart = (e: DragEvent, card: HTMLElement | undefined): void => {
		if (!this.#options.canDrag()) return;
		this.isDragging = true;
		if (card && e.dataTransfer) {
			// A smaller clone as the drag image
			const ghost = card.cloneNode(true) as HTMLElement;
			ghost.style.width = `${DRAG_IMAGE_WIDTH}px`;
			ghost.style.position = 'absolute';
			ghost.style.top = '-9999px';
			ghost.style.opacity = '0.8';
			document.body.appendChild(ghost);
			this.#dragGhost = ghost;
			e.dataTransfer.setDragImage(ghost, DRAG_IMAGE_WIDTH / 2, 40);
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', 'game');
		}
	};

	dragEnd = (): void => {
		this.isDragging = false;
		this.highlightedSlotIndex = null;
		if (this.#dragGhost) {
			document.body.removeChild(this.#dragGhost);
			this.#dragGhost = null;
		}
	};

	// --- Touch Drag (mobile) ---

	touchStart = (e: TouchEvent): void => {
		if (!this.#options.canDrag()) return;
		const touch = e.touches[0];
		this.#touchStartPos = { x: touch.clientX, y: touch.clientY };
		this.#dragStarted = false;

		// Prevent context menu / text selection popups on long-press
		window.addEventListener('contextmenu', preventContextMenu, { capture: true });

		this.#longPressTimer = setTimeout(() => {
			this.#dragStarted = true;
			this.isDragging = true;
			this.touchDragPos = this.#touchStartPos ? { ...this.#touchStartPos } : null;
			if (navigator.vibrate) navigator.vibrate(30);
		}, LONG_PRESS_MS);

		window.addEventListener('touchmove', this.#touchMove, { passive: false });
		window.addEventListener('touchend', this.#touchEnd);
		window.addEventListener('touchcancel', this.#cleanupTouchDrag);
	};

	#touchMove = (e: TouchEvent): void => {
		const touch = e.touches[0];

		if (!this.#dragStarted) {
			// If moved too far before long press, cancel (it's a scroll)
			if (this.#touchStartPos) {
				const dx = touch.clientX - this.#touchStartPos.x;
				const dy = touch.clientY - this.#touchStartPos.y;
				if (Math.sqrt(dx * dx + dy * dy) > SCROLL_CANCEL_PX) {
					this.#cleanupTouchDrag();
				}
			}
			return;
		}

		e.preventDefault();
		this.touchDragPos = { x: touch.clientX, y: touch.clientY };
		this.highlightedSlotIndex = findSlotUnderPoint(touch.clientX, touch.clientY);
		this.#autoScroll(touch.clientY);
	};

	#touchEnd = (): void => {
		if (this.#dragStarted && this.highlightedSlotIndex !== null) {
			this.#options.onDrop(this.highlightedSlotIndex);
		}
		this.#cleanupTouchDrag();
	};

	#cleanupTouchDrag = (): void => {
		if (this.#longPressTimer) {
			clearTimeout(this.#longPressTimer);
			this.#longPressTimer = null;
		}
		this.isDragging = false;
		this.#dragStarted = false;
		this.touchDragPos = null;
		this.highlightedSlotIndex = null;
		this.#touchStartPos = null;
		this.#stopAutoScroll();

		window.removeEventListener('touchmove', this.#touchMove);
		window.removeEventListener('touchend', this.#touchEnd);
		window.removeEventListener('touchcancel', this.#cleanupTouchDrag);
		// Delay removal so the contextmenu event (which fires after touchend) is still caught
		setTimeout(() => {
			window.removeEventListener('contextmenu', preventContextMenu, { capture: true });
		}, 100);
	};

	#autoScroll(y: number): void {
		this.#stopAutoScroll();
		// visualViewport is the accurate mobile viewport (it excludes the browser chrome)
		const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
		const viewportTop = window.visualViewport?.offsetTop ?? 0;
		const relativeY = y - viewportTop;
		if (relativeY < AUTO_SCROLL_ZONE) {
			const speed = autoScrollSpeed(1 - relativeY / AUTO_SCROLL_ZONE);
			this.#autoScrollInterval = setInterval(() => window.scrollBy(0, -speed), AUTO_SCROLL_TICK_MS);
		} else if (relativeY > viewportHeight - AUTO_SCROLL_ZONE) {
			const speed = autoScrollSpeed(1 - (viewportHeight - relativeY) / AUTO_SCROLL_ZONE);
			this.#autoScrollInterval = setInterval(() => window.scrollBy(0, speed), AUTO_SCROLL_TICK_MS);
		}
	}

	#stopAutoScroll(): void {
		if (this.#autoScrollInterval) {
			clearInterval(this.#autoScrollInterval);
			this.#autoScrollInterval = null;
		}
	}
}

/** Pixels per tick for an intensity from 0 (the zone's inner edge) to 1 (the viewport's edge) */
function autoScrollSpeed(intensity: number): number {
	return AUTO_SCROLL_MIN_SPEED + intensity * (AUTO_SCROLL_MAX_SPEED - AUTO_SCROLL_MIN_SPEED);
}

function preventContextMenu(e: Event): void {
	e.preventDefault();
}

function findSlotUnderPoint(x: number, y: number): number | null {
	const slots = document.querySelectorAll('[data-slot-index]');
	for (const slot of slots) {
		const rect = slot.getBoundingClientRect();
		if (
			x >= rect.left &&
			x <= rect.right &&
			y >= rect.top - SLOT_HIT_PADDING &&
			y <= rect.bottom + SLOT_HIT_PADDING
		) {
			return parseInt(slot.getAttribute('data-slot-index')!);
		}
	}
	return null;
}
