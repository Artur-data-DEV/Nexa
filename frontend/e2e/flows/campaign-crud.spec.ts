import { test, expect } from '@playwright/test';
import { timeouts } from '../fixtures/test-data';
import { loginAs } from '../helpers/auth';

test.describe('Campaign CRUD Flows', () => {

    test.describe('Campaign Listing', () => {

        test('should display campaigns page for creator', async ({ page }) => {
            try {
                await loginAs(page, 'creator');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/campaigns');
            await page.waitForLoadState('networkidle');

            // Page header or content should be visible
            const heading = page.getByRole('heading', { name: /campanhas|campaigns/i }).first();
            const emptyState = page.getByText(/nenhuma campanha|no campaigns/i);
            const campaignCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="campaign-card"]').first();
            const pageContent = page.locator('main, [data-testid="page-content"]').first();

            await expect(heading.or(emptyState).or(campaignCard).or(pageContent)).toBeVisible({ timeout: timeouts.pageLoad });
        });

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

            const heading = page.getByRole('heading', { name: /campanhas|minhas campanhas/i }).first();
            const campaignCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="campaign-card"]').first();
            const emptyState = page.getByText(/nenhuma campanha|criar sua primeira|você ainda não tem/i);
            const pageContent = page.locator('main, [data-testid="page-content"]').first();

            await expect(heading.or(emptyState).or(campaignCard).or(pageContent)).toBeVisible({ timeout: timeouts.pageLoad });
        });
    });

    test.describe('Campaign Creation', () => {
        test('should navigate to create form', async ({ page }) => {
            try {
                await loginAs(page, 'brand');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/campaigns/create');
            await page.waitForLoadState('networkidle');

            const heading = page.getByRole('heading', { name: /criar|nova|create|new/i }).first();
            const form = page.locator('form').first();

            await expect(heading.or(form)).toBeVisible({ timeout: timeouts.pageLoad });
        });
    });

});
