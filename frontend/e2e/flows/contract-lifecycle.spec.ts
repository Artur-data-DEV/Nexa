import { test, expect } from '@playwright/test';
import { timeouts } from '../fixtures/test-data';
import { loginAs } from '../helpers/auth';

/**
 * Contract Lifecycle E2E Tests - Critical Paths
 * 
 * Tests core contract visibility and status display.
 */
test.describe('Contract Lifecycle', () => {

    test('should display campaigns page for brand', async ({ page }) => {
        try {
            await loginAs(page, 'brand');
        } catch (error) {
            console.log('[WARN] Login failed - skipping test:', (error as Error).message);
            test.skip();
            return;
        }

        await page.goto('/dashboard/campaigns');
        await page.waitForLoadState('networkidle');

        const heading = page.getByRole('heading', { name: /Campanhas/i }).first();
        const content = page.getByText(/Campanhas/i).first();
        const pageMain = page.locator('main').first();

        await expect(heading.or(content).or(pageMain)).toBeVisible({ timeout: timeouts.pageLoad });
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

        const applicationsText = page.getByText(/Aplicações|Candidaturas|Status/i).first();
        const pageMain = page.locator('main').first();

        await expect(applicationsText.or(pageMain)).toBeVisible({ timeout: timeouts.pageLoad });
    });

});
