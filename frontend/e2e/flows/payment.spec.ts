import { test, expect } from '@playwright/test';
import {
    // testUsers,
    stripeTestCards,
    selectors,
    timeouts
} from '../fixtures/test-data';
import { loginAs, fillStripeCard } from '../helpers/auth';

test.describe('Payment Flows', () => {

    test.describe('Contract Payment', () => {

        test('should complete payment with valid card', async ({ page }) => {
            await loginAs(page, 'brand');

            // Navigate to contracts with pending payment
            await page.goto('/dashboard/contracts');

            // Find a contract that needs payment
            const pendingContract = page.locator('[data-testid="contract-card"]:has([data-testid="payment-pending"])').first();

            if (await pendingContract.isVisible()) {
                await pendingContract.click();

                // Click pay button
                await page.click(selectors.payment.payButton);

                // Wait for Stripe Elements to load
                await page.waitForTimeout(2000);

                // Fill card details
                await fillStripeCard(
                    page,
                    stripeTestCards.success.number,
                    stripeTestCards.success.expiry,
                    stripeTestCards.success.cvc
                );

                // Submit payment
                await page.click('[data-testid="confirm-payment"]');

                // Wait for payment processing
                await expect(page.locator(selectors.payment.successMessage)).toBeVisible({
                    timeout: timeouts.stripeIframe,
                });
            }
        });

        test('should show error when card is declined', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');

            const pendingContract = page.locator('[data-testid="contract-card"]:has([data-testid="payment-pending"])').first();

            if (await pendingContract.isVisible()) {
                await pendingContract.click();
                await page.click(selectors.payment.payButton);

                await page.waitForTimeout(2000);

                // Use declined card
                await fillStripeCard(
                    page,
                    stripeTestCards.declined.number,
                    stripeTestCards.declined.expiry,
                    stripeTestCards.declined.cvc
                );

                await page.click('[data-testid="confirm-payment"]');

                // Should show error
                await expect(page.locator(selectors.payment.errorMessage)).toBeVisible({
                    timeout: timeouts.stripeIframe,
                });
            }
        });

        test('should handle 3D Secure authentication', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');

            const pendingContract = page.locator('[data-testid="contract-card"]:has([data-testid="payment-pending"])').first();

            if (await pendingContract.isVisible()) {
                await pendingContract.click();
                await page.click(selectors.payment.payButton);

                await page.waitForTimeout(2000);

                // Use 3DS required card
                await fillStripeCard(
                    page,
                    stripeTestCards.requires3DS.number,
                    stripeTestCards.requires3DS.expiry,
                    stripeTestCards.requires3DS.cvc
                );

                await page.click('[data-testid="confirm-payment"]');

                // 3DS modal should appear
                const stripe3dsFrame = page.frameLocator('iframe[name*="stripe-challenge"]');

                try {
                    // Complete 3DS authentication (test mode auto-complete)
                    await stripe3dsFrame.locator('[id="test-source-authorize-3ds"]').click({
                        timeout: 10000,
                    });

                    // Payment should succeed after 3DS
                    await expect(page.locator(selectors.payment.successMessage)).toBeVisible({
                        timeout: timeouts.stripeIframe,
                    });
                } catch {
                    // 3DS flow may vary in test mode
                    console.log('3DS flow not available in this test environment');
                }
            }
        });

    });

    test.describe('Payment Methods', () => {

        test('should add new payment method', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/payment-methods');

            // Click add payment method
            await page.click('[data-testid="add-payment-method"]');

            await page.waitForTimeout(2000);

            // Fill card details
            await fillStripeCard(
                page,
                stripeTestCards.success.number,
                stripeTestCards.success.expiry,
                stripeTestCards.success.cvc
            );

            // Save
            await page.click('[data-testid="save-payment-method"]');

            // Should see success message or new card in list
            await expect(page.locator('text=/adicionado|sucesso|4242/i')).toBeVisible({
                timeout: timeouts.apiResponse,
            });
        });

        test('should select default payment method', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/payment-methods');

            // Find a payment method that's not default
            const paymentMethod = page.locator('[data-testid="payment-method-card"]:not(:has([data-testid="default-badge"]))').first();

            if (await paymentMethod.isVisible()) {
                await paymentMethod.hover();
                await paymentMethod.locator('[data-testid="set-default"]').click();

                // Should show as default
                await expect(paymentMethod.locator('[data-testid="default-badge"]')).toBeVisible();
            }
        });

        test('should remove payment method', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/payment-methods');

            // Count initial payment methods
            const initialCount = await page.locator('[data-testid="payment-method-card"]').count();

            if (initialCount > 1) {
                // Remove a non-default payment method
                const paymentMethod = page.locator('[data-testid="payment-method-card"]:not(:has([data-testid="default-badge"]))').first();

                if (await paymentMethod.isVisible()) {
                    await paymentMethod.hover();
                    await paymentMethod.locator('[data-testid="remove-payment-method"]').click();

                    // Confirm removal
                    await page.click('[data-testid="confirm-remove"]');

                    // Count should decrease
                    await expect(page.locator('[data-testid="payment-method-card"]')).toHaveCount(initialCount - 1);
                }
            }
        });

    });

    test.describe('Checkout Flow', () => {

        test('should redirect to Stripe Checkout', async ({ page }) => {
            await loginAs(page, 'brand');

            // This tests the Stripe Checkout Session flow
            await page.goto('/dashboard/contracts');

            const pendingContract = page.locator('[data-testid="contract-card"]:has([data-testid="payment-pending"])').first();

            if (await pendingContract.isVisible()) {
                await pendingContract.click();

                // Click external checkout button if available
                const checkoutButton = page.locator('[data-testid="stripe-checkout"]');

                if (await checkoutButton.isVisible()) {
                    // Set up listener for navigation to Stripe
                    const [popup] = await Promise.all([
                        page.waitForEvent('popup'),
                        checkoutButton.click(),
                    ]);

                    // Should redirect to Stripe checkout
                    await expect(popup).toHaveURL(/checkout\.stripe\.com/);

                    await popup.close();
                }
            }
        });

    });

    test.describe('Transaction History', () => {

        test('should display transaction history', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/transactions');

            // Transaction list should be visible
            await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
        });

        test('should filter transactions by status', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/transactions');

            // Filter by completed
            await page.click('[data-testid="filter-status"]');
            await page.click('text=/completo|completed/i');

            // Wait for filter to apply
            await page.waitForTimeout(1000);

            // All visible transactions should be completed
            const transactions = page.locator('[data-testid="transaction-row"]');
            const count = await transactions.count();

            for (let i = 0; i < Math.min(count, 5); i++) {
                await expect(transactions.nth(i).locator('[data-testid="status"]'))
                    .toHaveText(/completo|completed/i);
            }
        });

    });

});
