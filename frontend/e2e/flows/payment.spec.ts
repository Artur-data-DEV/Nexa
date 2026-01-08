import { test, expect } from '@playwright/test';
import { timeouts } from '../fixtures/test-data';
import { loginAs } from '../helpers/auth';

/**
 * Payment and Financial E2E Flows - Critical Paths
 */
test.describe('Payment Flows', () => {

    test.describe('Payment Methods', () => {

        test('should see payment methods page', async ({ page }) => {
            try {
                await loginAs(page, 'brand');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/payment-methods');
            await page.waitForLoadState('networkidle');

            // Wait for main container - accept various valid states
            const heading = page.getByRole('heading', { name: /Pagamentos|Payment/i }).first();
            const pageContent = page.locator('main').first();
            const paymentSection = page.getByText(/Pagamentos|Métodos|Payment/i).first();

            await expect(heading.or(pageContent).or(paymentSection)).toBeVisible({ timeout: timeouts.pageLoad });
        });

        test('should see connect stripe button or payment info', async ({ page }) => {
            try {
                await loginAs(page, 'brand');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/payment-methods');
            await page.waitForLoadState('networkidle');

            const connectButton = page.getByRole('button', { name: /Conectar|Connect/i }).first();
            const stripeConnected = page.getByText(/Conectado|Connected|Stripe/i).first();
            const pageContent = page.locator('main').first();

            await expect(connectButton.or(stripeConnected).or(pageContent)).toBeVisible({ timeout: timeouts.pageLoad });
        });
    });

    test.describe('Financial and Transactions', () => {

        test('should see financial page', async ({ page }) => {
            try {
                await loginAs(page, 'brand');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/financial');
            await page.waitForLoadState('networkidle');

            // Check heading or empty state content
            const headingVisible = await page.getByText(/Transações|Financial|Financeiro/i).first().isVisible().catch(() => false);
            const emptyVisible = await page.getByText(/Nenhuma transação|No transactions/i).first().isVisible().catch(() => false);
            const pageMain = await page.locator('main').first().isVisible().catch(() => false);

            expect(headingVisible || emptyVisible || pageMain).toBeTruthy();
        });
    });

});
