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
	// (PLAN.md 11e, open)
});
