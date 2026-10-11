import { expect, test } from '@playwright/test';
import { expectAccessible } from './play';

test('the years index is in the language of its URL, and switches by link', async ({ page }) => {
	await page.goto('/de/jahre/');
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Videospiele nach Jahr');
	await expect(page.locator('link[rel=alternate][hreflang=en]')).toHaveAttribute(
		'href',
		/\/en\/years\/$/
	);
	await expectAccessible(page);

	await page.getByRole('link', { name: 'Switch to English' }).click();
	await expect(page).toHaveURL(/\/en\/years\/$/);
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Video games by year');
	await expect(page.locator('footer')).toContainText('Legal notice');
	await expectAccessible(page);
});

test("a path with the other language's segment is redirected", async ({ page }) => {
	await page.goto('/de/years/');
	await expect(page).toHaveURL(/\/de\/jahre\/$/);
});
