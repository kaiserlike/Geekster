/**
 * The decade ruler's controller (Sprint 9d, pulled out of `Timeline.svelte` in 9f): whether the
 * ruler shows, the decade in view, each decade's height, and the jump to one. `DecadeRuler.svelte`
 * only draws it. Made once by `Timeline`, during its initialisation (the constructor runs an
 * effect), like `DragPlace` in `GameScreen`.
 */
import type { DecadeBucket } from './placement';

// The ruler is the overview of a long timeline: from this many cards, once the page scrolls,
// and never with one decade (a button that goes nowhere). The big card alone makes the page
// scroll, so overflowing is not enough
const RULER_FROM = 8;

interface DecadeRulerOptions {
	/** The timeline's list: rows carry `data-decade`, each decade's first row `data-decade-start` */
	list: () => HTMLElement | undefined;
	count: () => number;
	buckets: () => DecadeBucket[];
	/** Scrolls the page to a decade's first row */
	scrollTo: (row: HTMLElement) => void;
}

/** The id of each decade's first row, which the ruler scrolls to */
export function decadeAnchorId(decade: number): string {
	return `decade-${decade}`;
}

export class DecadeRulerState {
	/** The decade in view: the one of the first row whose middle is below the pinned bar */
	current: number | null = $state(null);
	/** Each decade's height in the timeline, its first row to the next decade's, in px */
	// Replaced whole on every measure, never mutated: a plain Map in $state is enough
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	heights: Map<number, number> = $state(new Map());

	#options: DecadeRulerOptions;
	#pageOverflows = $state(false);
	// A decade picked on the ruler stays picked while it's on screen, until the player scrolls
	// by themselves: near the page's end the scroll can't bring its first row to the top
	#jumpedTo: number | null = null;
	#scrollFrame = 0;

	constructor(options: DecadeRulerOptions) {
		this.#options = options;
		// The page and the list change size with every card, a compact switch, a reveal
		$effect(() => {
			const list = options.list();
			if (!list) return;
			const observer = new ResizeObserver(() => this.measure());
			observer.observe(list);
			observer.observe(document.body);
			return () => {
				observer.disconnect();
				cancelAnimationFrame(this.#scrollFrame);
			};
		});
	}

	get shown(): boolean {
		return (
			this.#options.count() >= RULER_FROM &&
			this.#options.buckets().length > 1 &&
			this.#pageOverflows
		);
	}

	measure = (): void => {
		this.#pageOverflows = document.documentElement.scrollHeight > window.innerHeight;
		const list = this.#options.list();
		if (!list) return;
		const starts = [...list.querySelectorAll<HTMLElement>('[data-decade-start]')];
		const bottom = list.getBoundingClientRect().bottom;
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		this.heights = new Map(
			starts.map((row, i) => {
				const top = row.getBoundingClientRect().top;
				const end = starts[i + 1]?.getBoundingClientRect().top ?? bottom;
				return [Number(row.dataset.decadeStart), Math.max(1, end - top)];
			})
		);
		this.#updateCurrent();
	};

	/** The window scrolled: the decade in view, once a frame */
	onScroll = (): void => {
		if (!this.shown) return;
		cancelAnimationFrame(this.#scrollFrame);
		this.#scrollFrame = requestAnimationFrame(() => this.#updateCurrent());
	};

	/** The player scrolls by themselves (wheel, touch, keys), not the ruler's smooth scroll */
	onOwnScroll = (): void => {
		this.#jumpedTo = null;
	};

	jumpTo = (decade: number): void => {
		const row = document.getElementById(decadeAnchorId(decade));
		if (!row) return;
		this.#jumpedTo = decade;
		this.current = decade;
		this.#options.scrollTo(row);
	};

	#updateCurrent(): void {
		const list = this.#options.list();
		if (!this.shown || !list) return;
		const bar = document.querySelector('[data-pinned-bar], [data-verdict-strip]');
		const barBottom = bar ? bar.getBoundingClientRect().bottom : 0;
		const rows = [...list.querySelectorAll<HTMLElement>('[data-decade]')];
		const jumpedTo = this.#jumpedTo;
		if (jumpedTo !== null) {
			const visible = rows.some((row) => {
				const r = row.getBoundingClientRect();
				return (
					Number(row.dataset.decade) === jumpedTo && r.bottom > barBottom && r.top < innerHeight
				);
			});
			if (visible) {
				this.current = jumpedTo;
				return;
			}
		}
		const first = rows.find((row) => {
			const r = row.getBoundingClientRect();
			return (r.top + r.bottom) / 2 > barBottom;
		});
		this.current = first
			? Number(first.dataset.decade)
			: (this.#options.buckets()[0]?.decade ?? null);
	}
}
