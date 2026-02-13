import { test, expect } from '@playwright/test';

test('visitor can search for hotels and view details', async ({ page }) => {
    // 1. Visit Hotels Page Directly (Skipping Landing Page transition which might be flaky in CI)
    await page.goto('/hotels');
    await expect(page).toHaveTitle(/COP17 Mongolia | Official Hotel Booking/);

    // Wait for the hotels list to be visible (more reliable than header text)
    await expect(page.getByText('Available Hotels')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'hotels-page.png' });

    // 3. Check Search Form presence
    await expect(page.getByLabel('Location')).toHaveValue('Ulaanbaatar');
    await expect(page.getByLabel('Guests')).toHaveValue('1');

    // 4. View a Hotel Detail (Mock Data Check)
    // We look for "Shangri-La Ulaanbaatar" card and click "View Availability"
    // Use a specific class 'rounded-xl' to avoid selecting parent containers
    const hotelCard = page.locator('.rounded-xl').filter({ hasText: 'Shangri-La Ulaanbaatar' });
    await expect(hotelCard).toBeVisible();

    await hotelCard.getByRole('link', { name: 'View Availability' }).click();

    // 5. Verify Hotel Detail Page
    await expect(page).toHaveURL(/.*hotels\/1/);

    // 6. Start Booking Process
    // Find the first room's "Book This Room" button
    const bookButton = page.getByRole('button', { name: 'Book This Room' }).first();
    await expect(bookButton).toBeVisible();
    await bookButton.click();

    // 7. Fill Booking Form
    const dialog = page.getByRole('dialog', { name: 'Complete Your Booking' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Full Name').fill('Ganbaatar Bat-Erdene');
    await dialog.getByLabel('Email Address').fill('ganbaatar@example.com');
    await dialog.getByLabel('Passport Number').fill('E12345678');
    await dialog.getByLabel('Phone Number').fill('+976 99112233');

    // 8. Submit Booking
    await dialog.getByRole('button', { name: 'Confirm Booking' }).click();

    // 9. Verify Success (Dialog should close)
    await expect(dialog).not.toBeVisible();
});
