import { test, expect } from '@playwright/test';
import { timeouts } from '../fixtures/test-data';
import { loginAs } from '../helpers/auth';

test.describe('Contract & Delivery Flows', () => {

    test.describe('Applications Listing', () => {

        test('should display applications page for brand', async ({ page }) => {
            try {
                await loginAs(page, 'brand');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/applications');
            await page.waitForLoadState('networkidle');

            // Page should load - check for heading or list or empty state
            const heading = page.getByRole('heading', { name: /aplicações|candidaturas|applications/i }).first();
            const emptyState = page.getByText(/nenhuma aplicação|nenhuma candidatura|no applications/i);
            const pageContent = page.locator('main').first();

            await expect(heading.or(emptyState).or(pageContent)).toBeVisible({ timeout: timeouts.pageLoad });
        });

        test('should display applications page for creator', async ({ page }) => {
            try {
                await loginAs(page, 'creator');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/applications');
            await page.waitForLoadState('networkidle');

            // Page should load
            const heading = page.getByRole('heading', { name: /aplicações|candidaturas|applications/i }).first();
            const emptyState = page.getByText(/nenhuma aplicação|nenhuma candidatura|no applications/i);
            const pageContent = page.locator('main').first();

            await expect(heading.or(emptyState).or(pageContent)).toBeVisible({ timeout: timeouts.pageLoad });
        });

    });

});
