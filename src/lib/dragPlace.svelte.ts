/**
 * Dragging the current card onto a timeline slot: HTML5 drag and drop on desktop, a 250 ms
 * long-press on touch with a floating card and auto-scroll near the viewport edges. Pulled out
 * of `GameScreen.svelte` in Sprint 9c so the card and the timeline can share one instance.
 *
 * Slots are found by their `data-slot-index` attribute, so the timeline only has to render it.
 *
 * From 1024 px the timeline is its own scroll pane (Sprint 9d): `setPane()` registers it, and
 * while it scrolls, both kinds of drag auto-scroll the pane instead of the page, in a 64 px zone
 * at its edges. `paneEdge` names the edge that is scrolling, for the cue.
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
// The desktop pane is shorter than a phone's viewport, so its zone is too (9a's design call)
const PANE_SCROLL_ZONE = 64;
const AUTO_SCROLL_MIN_SPEED = 6;
const AUTO_SCROLL_MAX_SPEED = 20;
const AUTO_SCROLL_TICK_MS = 16;
const DRAG_IMAGE_WIDTH = 150;

export class DragPlace {
	isDragging: boolean = $state(false);
	/** Where the floating card is drawn during a touch drag, or null */
	touchDragPos: Point | null = $state(null);
	highlightedSlotIndex: number | null = $state(null);
	/** The pane edge auto-scrolling right now, or null */
	paneEdge: 'top' | 'bottom' | null = $state(null);

	#options: DragPlaceOptions;
	#touchStartPos: Point | null = null;
	#dragStarted = false;
	#longPressTimer: ReturnType<typeof setTimeout> | null = null;
	#autoScrollInterval: ReturnType<typeof setInterval> | null = null;
	#scrollingEdge: 'top' | 'bottom' | null = null;
	#scrollSpeed = 0;
	#dragGhost: HTMLElement | null = null;
	#pane: HTMLElement | null = null;
	#hoveredScrollTarget: HTMLElement | null = null;
	#html5Dragging = false;

	constructor(options: DragPlaceOptions) {
		this.#options = options;
	}

	/** The timeline's own scroll pane (desktop), or null to scroll the page */
	setPane(pane: HTMLElement | null): void {
		this.#pane = pane;
	}

	/**
	 * Scrolls the pane (or the page) to an element: the decade ruler, hovered mid-drag. The
	 * element's `scroll-margin-top` keeps it clear of the pane's pinned heading
	 */
	scrollTo(target: HTMLElement): void {
		target.scrollIntoView({ block: 'start', behavior: 'smooth' });
	}

	/** A placement happened (by drop or by tap): no drag is left over */
	reset(): void {
		this.#html5Dragging = false;
		this.isDragging = false;
		this.highlightedSlotIndex = null;
		this.#stopAutoScroll();
	}

	// --- HTML5 Drag & Drop (desktop) ---

	dragStart = (e: DragEvent, card: HTMLElement | undefined): void => {
		if (!this.#options.canDrag()) return;
		// Restyling the drag source inside dragstart can make Chrome cancel the drag at once
		this.#html5Dragging = true;
		setTimeout(() => {
			if (this.#html5Dragging) this.isDragging = true;
		}, 0);
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

	/** `dragover` on the pane: auto-scroll while the card is near its top or bottom edge */
	paneDragOver = (e: DragEvent): void => {
		if (!this.isDragging) return;
		this.#autoScroll(e.clientY);
	};

	/** `dragleave` on the pane: stop only when the pointer has left the pane itself */
	paneDragLeave = (e: DragEvent): void => {
		const pane = this.#pane;
		if (pane && e.relatedTarget instanceof Node && pane.contains(e.relatedTarget)) return;
		this.#stopAutoScroll();
	};

	dragEnd = (): void => {
		this.#html5Dragging = false;
		this.isDragging = false;
		this.highlightedSlotIndex = null;
		this.#stopAutoScroll();
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
		// The decade ruler: hovering a decade mid-drag scrolls there (HTML5 does it in the ruler)
		const decade = document
			.elementFromPoint(touch.clientX, touch.clientY)
			?.closest<HTMLElement>('[data-scroll-to]');
		const target = decade && document.getElementById(decade.dataset.scrollTo ?? '');
		if (target && target !== this.#hoveredScrollTarget) this.scrollTo(target);
		this.#hoveredScrollTarget = target ?? null;
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
		this.#hoveredScrollTarget = null;
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
		const pane = this.#activePane();
		let top: number;
		let height: number;
		let zone: number;
		if (pane) {
			const rect = pane.getBoundingClientRect();
			top = rect.top;
			height = rect.height;
			zone = PANE_SCROLL_ZONE;
		} else {
			// visualViewport is the accurate mobile viewport (it excludes the browser chrome)
			top = window.visualViewport?.offsetTop ?? 0;
			height = window.visualViewport?.height ?? window.innerHeight;
			zone = AUTO_SCROLL_ZONE;
		}
		const relativeY = y - top;
		let speed = 0;
		if (relativeY >= 0 && relativeY < zone) speed = -autoScrollSpeed(1 - relativeY / zone);
		else if (relativeY <= height && relativeY > height - zone) {
			speed = autoScrollSpeed(1 - (height - relativeY) / zone);
		}

		const edge = speed < 0 ? 'top' : speed > 0 ? 'bottom' : null;
		// dragover repeats every few ms: keep a running scroll going rather than restarting it
		if (edge !== null && edge === this.#scrollingEdge && this.#scrollSpeed === speed) return;
		this.#stopAutoScroll();
		if (edge === null) return;
		this.#scrollingEdge = edge;
		this.#scrollSpeed = speed;
		if (pane) this.paneEdge = edge;
		const scroller = pane ?? window;
		this.#autoScrollInterval = setInterval(() => scroller.scrollBy(0, speed), AUTO_SCROLL_TICK_MS);
	}

	/** The pane, while it is the thing that scrolls (the desktop shell); else null */
	#activePane(): HTMLElement | null {
		const pane = this.#pane;
		if (!pane || getComputedStyle(pane).overflowY !== 'auto') return null;
		return pane;
	}

	#stopAutoScroll(): void {
		if (this.#autoScrollInterval) {
			clearInterval(this.#autoScrollInterval);
			this.#autoScrollInterval = null;
		}
		this.#scrollingEdge = null;
		this.#scrollSpeed = 0;
		this.paneEdge = null;
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
