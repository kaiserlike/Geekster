import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import games from '../../src/lib/data/games.json' with { type: 'json' };

// The server hands the page an image per card and nothing else. The e2e database
// is seeded from games.json with its local screenshot paths, so the test — not
// the page — knows each card's year.
const YEAR_BY_SCREENSHOT = new Map(games.map((game) => [game.screenshot, game.year]));

const CARD = 'img[alt="The game to place"]';

/** English, whatever the browser's language, set before the first script runs. */
export async function openGame(page: Page): Promise<void> {
	await page.addInitScript(() => localStorage.setItem('geekster-locale', 'en'));
	await page.goto('/');
}

/**
 * No axe violation on the page once it has settled. Svelte's transitions are Web
 * Animations: mid-fade, text is at partial opacity and axe reports its contrast.
 */
export async function expectAccessible(page: Page): Promise<void> {
	await page.waitForFunction(() =>
		document
			.getAnimations()
			.every(
				(a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity
			)
	);
	const { violations } = await new AxeBuilder({ page }).analyze();
	expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

async function yearOf(src: string | null): Promise<number> {
	const year = src ? YEAR_BY_SCREENSHOT.get(src) : undefined;
	if (year === undefined) throw new Error(`no year in games.json for ${src}`);
	return year;
}

/** The years on the timeline, left to right, the anchor included. */
async function timelineYears(page: Page): Promise<number[]> {
	const sources = await page
		.locator('ol img')
		.evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
	return Promise.all(sources.map(yearOf));
}

/** The slot where the card's year fits, or one where it does not. */
function slotFor(year: number, timeline: number[], right: boolean): number {
	const fits = (slot: number) =>
		(slot === 0 || year >= timeline[slot - 1]) &&
		(slot === timeline.length || year <= timeline[slot]);
	const slots = Array.from({ length: timeline.length + 1 }, (_v, i) => i);
	const slot = slots.find((s) => fits(s) === right);
	if (slot === undefined) throw new Error(`no ${right ? 'right' : 'wrong'} slot for ${year}`);
	return slot;
}

/**
 * Places the current card right or wrong, skips the bonus after a right one, and
 * moves on to the next card or the result screen.
 */
export async function placeCard(page: Page, right: boolean): Promise<void> {
	const card = page.locator(CARD);
	const src = await card.getAttribute('src');
	const slot = slotFor(await yearOf(src), await timelineYears(page), right);
	await page.locator(`[data-slot-index="${slot}"]`).click();
	await expect(page.getByRole('status').first()).toContainText(right ? 'Correct' : 'Wrong');
	if (right) await page.getByRole('button', { name: 'Skip' }).click();
	// The reveal ignores "Next card" for its first 300 ms (NEXT_GUARD_MS), and "next"
	// is a request: click until the new card or the result screen is there
	const next = page.getByRole('button', { name: /next card|result/i });
	await expect(async () => {
		if (await next.isVisible()) await next.click();
		const ended = (await page.locator('h1[data-end]').count()) > 0;
		const moved = (await card.count()) > 0 && (await card.getAttribute('src')) !== src;
		expect(ended || moved).toBe(true);
	}).toPass({ intervals: [400] });
}
