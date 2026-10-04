/**
 * The share card (Sprint 10e-2): a 1200×630 PNG of a result, drawn in the browser on a canvas
 * after the canvas board "M3 share card" (Sprint 9a). Drawn here rather than on the server: no
 * function call per share, no image dependency, and the fonts are the ones the page already
 * loaded. Browser only; what it says comes from the pure `shareCardLayout()`.
 */
import type { Locale } from './i18n.svelte';
import { shareCardLayout, type CardStat, type ShareResult } from './share';

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

// The tokens of src/app.css, as a canvas needs them
const C = {
	bg: '#03101a',
	ink: '#e8fbff',
	focus: '#f2fffe',
	muted: '#9cc9d1',
	accent: '#3ff0e4',
	accentStrong: '#5ff5e8',
	magenta: '#ff2bd6',
	pink: '#ff7ae6',
	life: '#ff8cc4',
	danger: '#ff4d6d',
	dangerSoft: '#1f0c16',
	score: '#ffd98a',
	grid: '#1de9d6',
	lineStrong: '#2a8a93',
	sunken: '#04151f'
};

const DISPLAY = '"Dela Gothic One", "Arial Black", sans-serif';
const UI = '"Chakra Petch", ui-sans-serif, system-ui, sans-serif';

const TONES: Record<CardStat['tone'], string> = {
	ink: C.ink,
	accent: C.accentStrong,
	pink: C.pink,
	life: C.life,
	danger: C.danger
};

const LEFT = 72;
const RIGHT = CARD_WIDTH - 72;

type Ctx = CanvasRenderingContext2D;

/** Canvas letter spacing where the browser has it (Chrome 99, Safari 18); plain text elsewhere */
function spacing(ctx: Ctx, px: number) {
	if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

function text(
	ctx: Ctx,
	value: string,
	x: number,
	y: number,
	font: string,
	color: string,
	letterSpacing = 0
): number {
	ctx.font = font;
	ctx.fillStyle = color;
	spacing(ctx, letterSpacing);
	ctx.fillText(value, x, y);
	const width = ctx.measureText(value).width;
	spacing(ctx, 0);
	return width;
}

function glow(ctx: Ctx, color: string, blur: number) {
	ctx.shadowColor = color;
	ctx.shadowBlur = blur;
}

/** The synthwave floor along the bottom, as `HorizonGrid` draws it */
function horizon(ctx: Ctx) {
	const top = CARD_HEIGHT - 260;
	ctx.save();
	ctx.globalAlpha = 0.28;
	ctx.strokeStyle = C.grid;
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	for (const y of [50, 95, 150, 210, 258]) {
		ctx.moveTo(0, top + y);
		ctx.lineTo(CARD_WIDTH, top + y);
	}
	for (const x of [-800, -250, 200, 600, 1000, 1450, 2000]) {
		ctx.moveTo(600, top);
		ctx.lineTo(x, CARD_HEIGHT);
	}
	ctx.stroke();
	ctx.restore();
}

function frame(ctx: Ctx) {
	ctx.save();
	ctx.strokeStyle = C.magenta;
	ctx.lineWidth = 2;
	glow(ctx, 'rgb(255 43 214 / 0.55)', 24);
	ctx.beginPath();
	ctx.roundRect(24, 24, CARD_WIDTH - 48, CARD_HEIGHT - 48, 18);
	ctx.stroke();
	ctx.restore();
}

/** GEEKSTER with the wordmark's chromatic split: magenta left, turquoise right, a white face */
function wordmark(ctx: Ctx, x: number, y: number): number {
	const font = `400 44px ${DISPLAY}`;
	ctx.save();
	text(ctx, 'GEEKSTER', x - 3, y, font, C.magenta, 2);
	text(ctx, 'GEEKSTER', x + 3, y, font, C.accent, 2);
	glow(ctx, 'rgb(63 240 228 / 0.5)', 12);
	const width = text(ctx, 'GEEKSTER', x, y, font, C.focus, 2);
	ctx.restore();
	return width;
}

function chip(ctx: Ctx, label: string, tone: 'accent' | 'pink', centreY: number) {
	ctx.font = `700 18px ${UI}`;
	spacing(ctx, 1.5);
	const width = ctx.measureText(label).width + 28;
	spacing(ctx, 0);
	const height = 32;
	ctx.fillStyle = tone === 'pink' ? C.pink : C.accent;
	ctx.beginPath();
	ctx.roundRect(RIGHT - width, centreY - height / 2, width, height, 6);
	ctx.fill();
	ctx.textBaseline = 'middle';
	text(ctx, label, RIGHT - width + 14, centreY + 1, `700 18px ${UI}`, C.bg, 1.5);
	ctx.textBaseline = 'alphabetic';
}

/** One card of the run: turquoise placed right, a red ✗ missed, an outline never reached */
function square(ctx: Ctx, mark: string, x: number, y: number, size: number) {
	ctx.save();
	ctx.beginPath();
	ctx.roundRect(x, y, size, size, 6);
	if (mark === 'o') {
		glow(ctx, 'rgb(63 240 228 / 0.6)', 8);
		ctx.fillStyle = C.accent;
		ctx.fill();
	} else if (mark === 'x') {
		ctx.fillStyle = C.dangerSoft;
		ctx.fill();
		ctx.strokeStyle = C.danger;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(x + 1, y + 1, size - 2, size - 2, 5);
		ctx.stroke();
		const inset = size * 0.33;
		ctx.strokeStyle = '#ff6b85';
		ctx.lineWidth = 2.5;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(x + inset, y + inset);
		ctx.lineTo(x + size - inset, y + size - inset);
		ctx.moveTo(x + size - inset, y + inset);
		ctx.lineTo(x + inset, y + size - inset);
		ctx.stroke();
	} else {
		ctx.fillStyle = C.sunken;
		ctx.fill();
		ctx.strokeStyle = C.lineStrong;
		ctx.lineWidth = 1.5;
		ctx.stroke();
	}
	ctx.restore();
}

/** Waits for the three faces the card uses; the page loads them lazily, by unicode range */
async function loadFonts(): Promise<void> {
	if (typeof document === 'undefined' || !document.fonts) return;
	await Promise.all([
		document.fonts.load(`400 44px ${DISPLAY}`, 'GEEKSTER'),
		document.fonts.load(`700 40px ${UI}`, '0123456789 CRÜ#/'),
		document.fonts.load(`500 16px ${UI}`, 'geekster.pro')
	]).catch(() => undefined);
}

/** Draws a result's share card and answers it as a PNG */
export async function renderShareCard(result: ShareResult, locale: Locale): Promise<Blob> {
	await loadFonts();
	const layout = shareCardLayout(result, locale);

	const canvas = document.createElement('canvas');
	canvas.width = CARD_WIDTH;
	canvas.height = CARD_HEIGHT;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('no 2d canvas');

	ctx.fillStyle = C.bg;
	ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
	horizon(ctx);
	frame(ctx);

	// The header: wordmark and tag on the left, the mode chip on the right
	const markWidth = wordmark(ctx, LEFT, 110);
	text(ctx, layout.tag, LEFT + markWidth + 18, 108, `700 15px ${UI}`, C.pink, 4);
	chip(ctx, layout.chip, layout.chipTone, 94);

	// The score
	ctx.save();
	glow(ctx, 'rgb(255 200 87 / 0.5)', 24);
	const scoreWidth = text(ctx, layout.score, LEFT, 268, `700 120px ${UI}`, C.score);
	ctx.restore();
	text(ctx, 'CR', LEFT + scoreWidth + 16, 268, `700 34px ${UI}`, C.muted, 1.5);

	// The stats, side by side
	let x = LEFT;
	for (const stat of layout.stats) {
		ctx.font = `700 15px ${UI}`;
		spacing(ctx, 2);
		const labelWidth = ctx.measureText(stat.label).width;
		spacing(ctx, 0);
		text(ctx, stat.label, x, 346, `700 15px ${UI}`, C.muted, 2);
		const valueWidth = text(ctx, stat.value, x, 392, `700 40px ${UI}`, TONES[stat.tone], 1.5);
		x += Math.max(labelWidth, valueWidth) + 56;
	}

	// The run, card by card
	text(ctx, layout.cardsLabel, LEFT, 466, `700 15px ${UI}`, C.muted, 2);
	const daily = result.kind === 'daily';
	const size = daily ? 48 : 34;
	const gap = daily ? 8 : 6;
	const marks = [...layout.squares];
	marks.forEach((mark, i) => square(ctx, mark, LEFT + i * (size + gap), 480, size));
	if (layout.more) {
		ctx.textBaseline = 'middle';
		text(
			ctx,
			layout.more,
			LEFT + marks.length * (size + gap) + 8,
			480 + size / 2,
			`700 16px ${UI}`,
			C.muted,
			1.5
		);
		ctx.textBaseline = 'alphabetic';
	}

	// The challenge and the address, bottom right
	ctx.textAlign = 'right';
	text(ctx, layout.challenge, RIGHT, 538, `400 26px ${DISPLAY}`, C.ink);
	text(ctx, layout.url, RIGHT, 568, `700 20px ${UI}`, C.accent, 1.5);
	ctx.textAlign = 'left';

	return new Promise((resolve, reject) =>
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('no PNG'))), 'image/png')
	);
}
