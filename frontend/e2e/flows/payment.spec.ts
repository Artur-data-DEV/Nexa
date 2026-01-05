import { test, expect } from '@playwright/test';
import { timeouts } from '../fixtures/test-data';
import { loginAs } from '../helpers/auth';

/**
 * Payment and Financial E2E Flows - PRODUCTION READY
 */
test.describe('Payment Flows', () => {

    test.describe('Payment Methods', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'brand');
            await page.goto('/dashboard/payment-methods');
        });

        test('should see payment methods page', async ({ page }) => {
            // Wait for main container
            await expect(page.getByRole('heading', { name: /Pagamentos da Marca/i })).toBeVisible({ timeout: timeouts.pageLoad });
        });

        test('should see connect stripe button', async ({ page }) => {
            const connectButton = page.getByRole('button', { name: /Conectar Método de Pagamento/i });
            await expect(connectButton).toBeVisible();
        });
    });

    test.describe('Financial and Transactions', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'brand');
            await page.goto('/dashboard/financial');
        });

        test('should see transaction history', async ({ page }) => {
            // Wait for dashboard to load
            await page.waitForLoadState('networkidle');

            // Check heading or empty state content
            const headingVisible = await page.getByText(/Transações/i).first().isVisible();
            const emptyVisible = await page.getByText(/Nenhuma transação/i).first().isVisible();

            expect(headingVisible || emptyVisible).toBeTruthy();
        });
    });

});
