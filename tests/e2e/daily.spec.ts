import { expect, test } from '@playwright/test';
import { expectAccessible, openGame, placeCard } from './play';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('a perfect Daily Run is complete after ten cards and shares a spoiler-free row', async ({
	page
}) => {
	// Ten cards, each with a second of verdict before the bonus
	test.setTimeout(90_000);
	await openGame(page);
	await page.getByRole('button', { name: "Play today's Daily" }).click();
	await expect(page.getByAltText('The game to place')).toBeVisible();

	for (let card = 0; card < 10; card++) await placeCard(page, true);

	await expect(page.locator('h1[data-end]')).toHaveText(/perfect daily run/i);
	await expectAccessible(page);

	// No Web Share API in headless Chromium: the text goes to the clipboard
	await page.getByRole('button', { name: 'Share result' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toBeVisible();
	const shared = await page.evaluate(() => navigator.clipboard.readText());
	expect(shared).toContain('Geekster Daily #1');
	expect(shared).toContain('🟩'.repeat(10));
	expect(shared).not.toMatch(/\b(19|20)\d\d\b/);
});
