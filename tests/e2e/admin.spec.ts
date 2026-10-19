import { expect, test } from '@playwright/test';
import { E2E_ADMIN_PASSWORD } from '../../playwright.config';
import { expectAccessible } from './play';

test('the admin panel refuses a wrong password', async ({ page }) => {
	await page.goto('/admin/login');
	await page.locator('input[name=password]').fill('not-the-password');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/admin\/login/);
	await expect(page.getByRole('heading', { name: 'Dashboard' })).toHaveCount(0);
});

test('the admin signs in and sees every seeded game', async ({ page }) => {
	await page.goto('/admin/games');
	await expect(page).toHaveURL(/\/admin\/login/);
	await expectAccessible(page);

	await page.locator('input[name=password]').fill(E2E_ADMIN_PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();

	// The login sends the admin back to the page that asked for it
	await expect(page).toHaveURL(/\/admin\/games/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Games (125)');
	await expect(page.locator('tbody tr')).toHaveCount(125);
	// No axe here: the admin keeps its own gray-* look, which axe does not pass yet
	// (PLAN.md § Open from earlier milestones)
});

test('a filtered list stays filtered through a game and back', async ({ page }) => {
	await page.goto('/admin/login');
	await page.locator('input[name=password]').fill(E2E_ADMIN_PASSWORD);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/admin\/?$/);

	// Five seeded games have "Super" in their name, sorted by year
	await page.goto('/admin/games?q=Super');
	const filterBar = page.getByRole('status').filter({ hasText: 'Filtered' });
	await expect(filterBar).toContainText('5 of 125 games shown');
	await expect(filterBar.getByRole('link', { name: 'Remove filter “Super”' })).toBeVisible();

	await page.getByRole('link', { name: 'Super Mario World', exact: true }).click();
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Super Mario World');
	await expect(filterBar).toContainText('Browsing game 2 of 5');

	// The arrow keys walk the filtered list, not every game
	await page.keyboard.press('ArrowRight');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Super Metroid');
	await page.keyboard.press('ArrowLeft');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Super Mario World');

	// Esc goes back to the same filtered list, at the game's own row
	await page.keyboard.press('Escape');
	await expect(page).toHaveURL(/\/admin\/games\/?\?q=Super#game-\d+$/);
	await expect(page.locator('tbody tr')).toHaveCount(5);
	const row = page.locator('tbody tr', { hasText: 'Super Mario World' });
	await expect(row).toHaveAttribute('id', /^game-\d+$/);
	await expect(row).toBeInViewport();

	// Reset on a game's page keeps the game and drops the filter
	await row.getByRole('link', { name: 'Super Mario World' }).click();
	await filterBar.getByRole('link', { name: 'Reset filters' }).click();
	await expect(page).toHaveURL(/\/admin\/games\/\d+\/?$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Super Mario World');
	await expect(page.getByRole('status').filter({ hasText: 'Filtered' })).toHaveCount(0);
});
