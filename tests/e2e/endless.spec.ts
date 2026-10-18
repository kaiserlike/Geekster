import { expect, test } from '@playwright/test';
import { expectAccessible, openGame, placeCard } from './play';

test('an endless Normal run ends on the result screen after three misses, with its tally', async ({
	page
}) => {
	await openGame(page);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Put video games in order.');
	await expectAccessible(page);

	await page.getByRole('button', { name: 'Start run' }).click();
	await expect(page.getByAltText('The game to place')).toBeVisible();
	await expectAccessible(page);

	await placeCard(page, true);
	// A miss still asks for the name: the consolation
	await placeCard(page, false, { guessName: true });
	await placeCard(page, false);
	await placeCard(page, false);

	await expect(page.locator('h1[data-end]')).toHaveText(/game over/i);
	// The tally: one name known of four cards, no exact year of the one hit
	const tally = page.locator('[data-tally] > div');
	await expect(tally.filter({ hasText: 'Names known' })).toContainText(/1\D+4/);
	await expect(tally.filter({ hasText: 'Years exact' })).toContainText(/0\D+1/);
	await expectAccessible(page);

	// The first finished run asks for a name once; "Not now" closes it
	await page.getByRole('button', { name: 'Not now' }).click();
	await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();
});
