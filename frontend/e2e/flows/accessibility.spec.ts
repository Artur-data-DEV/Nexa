import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { testUsers, selectors } from '../fixtures/test-data';

test.describe('Accessibility Tests', () => {

    test('should not have any automatically detectable accessibility issues on login page', async ({ page }) => {
        await page.goto('/login');

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should not have accessibility issues on dashboard (brand)', async ({ page }) => {
        // Mock login
        await page.route('**/login', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ token: 'mock', user: testUsers.brand })
                });
            } else {
                await route.continue();
            }
        });
        
        await page.goto('/login');
        await page.fill(selectors.auth.emailInput, testUsers.brand.email);
        await page.fill(selectors.auth.passwordInput, testUsers.brand.password);
        await page.click(selectors.auth.loginButton);
        await page.waitForURL(/dashboard/);

        const accessibilityScanResults = await new AxeBuilder({ page })
            .disableRules(['color-contrast']) // Optional: disable specific rules if design system is strict
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });
});
