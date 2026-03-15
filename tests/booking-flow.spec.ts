import { test, expect } from '@playwright/test';

test('homepage shell and login render without broken navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Official Accommodation Booking \| COP17 Mongolia/);
    await expect(page.getByRole('heading', { name: /Find Your Stay/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/^Official Accommodation Booking Platform$/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Book Stay' })).toBeVisible();
    await expect(page.getByText('Organized By')).toBeVisible();

    await expect(page.getByRole('banner').getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login');

    await page.goto('/login');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});
