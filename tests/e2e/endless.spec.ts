import { expect, test } from '@playwright/test';
import { expectAccessible, openGame, placeCard } from './play';

test('an endless Normal run ends on the result screen after three misses', async ({ page }) => {
	await openGame(page);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Put video games in order.');
	await expectAccessible(page);

	await page.getByRole('button', { name: 'Start run' }).click();
	await expect(page.getByAltText('The game to place')).toBeVisible();
	await expectAccessible(page);

	await placeCard(page, true);
	await placeCard(page, false);
	await placeCard(page, false);
	await placeCard(page, false);

	await expect(page.locator('h1[data-end]')).toHaveText(/game over/i);
	await expectAccessible(page);

	// The first finished run asks for a name once; "Not now" closes it
	await page.getByRole('button', { name: 'Not now' }).click();
	await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();
});
