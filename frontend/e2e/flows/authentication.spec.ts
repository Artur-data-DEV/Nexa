import { test, expect } from '@playwright/test';
import { testUsers, selectors, timeouts } from '../fixtures/test-data';

test.describe('Authentication Flows', () => {

    test.beforeEach(async ({ page }) => {
        // Clear any existing session
        await page.context().clearCookies();
    });

    test.describe('Login', () => {

        test('should login successfully with valid credentials', async ({ page }) => {
            await page.goto('/login');

            await page.fill(selectors.auth.emailInput, testUsers.brand.email);
            await page.fill(selectors.auth.passwordInput, testUsers.brand.password);
            await page.click(selectors.auth.loginButton);

            await expect(page).toHaveURL(/dashboard/, { timeout: timeouts.pageLoad });
        });

        test('should show error with invalid credentials', async ({ page }) => {
            await page.goto('/login');

            await page.fill(selectors.auth.emailInput, 'invalid@email.com');
            await page.fill(selectors.auth.passwordInput, 'wrongpassword');
            await page.click(selectors.auth.loginButton);

            await expect(page.locator(selectors.auth.errorMessage)).toBeVisible({
                timeout: timeouts.apiResponse,
            });
        });

        test('should show validation error for empty fields', async ({ page }) => {
            await page.goto('/login');

            await page.click(selectors.auth.loginButton);

            // Check for validation messages
            await expect(page.locator('text=/email.*obrigatório|required/i')).toBeVisible();
        });

        test('should redirect to dashboard if already logged in', async ({ page, context }) => {
            // First, login
            await page.goto('/login');
            await page.fill(selectors.auth.emailInput, testUsers.brand.email);
            await page.fill(selectors.auth.passwordInput, testUsers.brand.password);
            await page.click(selectors.auth.loginButton);
            await expect(page).toHaveURL(/dashboard/);

            // Try to access login page again
            await page.goto('/login');

            // Should be redirected to dashboard
            await expect(page).toHaveURL(/dashboard/);
        });

    });

    test.describe('Logout', () => {

        test('should logout successfully', async ({ page }) => {
            // Login first
            await page.goto('/login');
            await page.fill(selectors.auth.emailInput, testUsers.brand.email);
            await page.fill(selectors.auth.passwordInput, testUsers.brand.password);
            await page.click(selectors.auth.loginButton);
            await expect(page).toHaveURL(/dashboard/);

            // Logout
            await page.click(selectors.dashboard.userMenu);
            await page.click(selectors.auth.logoutButton);

            // Should be on login or home page
            await expect(page).toHaveURL(/login|\/$/);
        });

    });

    test.describe('OTP Verification', () => {

        test('should send OTP to email', async ({ page }) => {
            await page.goto('/signup');

            // Fill email and request OTP
            await page.fill(selectors.auth.emailInput, 'newuser@nexa.test');
            await page.click(selectors.auth.sendOtpButton);

            // OTP input should appear
            await expect(page.locator(selectors.auth.otpInput)).toBeVisible({
                timeout: timeouts.apiResponse,
            });
        });

        test('should verify valid OTP', async ({ page }) => {
            // This test assumes OTP_DEBUG=true which returns the code in response
            await page.goto('/signup');

            await page.fill(selectors.auth.emailInput, 'otptest@nexa.test');

            // Intercept the OTP response to get the code
            const otpResponse = await Promise.all([
                page.waitForResponse((response) =>
                    response.url().includes('/api/otp/send') && response.status() === 200
                ),
                page.click(selectors.auth.sendOtpButton),
            ]);

            // In debug mode, the code is returned in the response
            const responseBody = await otpResponse[0].json();
            const otpCode = responseBody.dev_code;

            if (otpCode) {
                await page.fill(selectors.auth.otpInput, otpCode);
                await page.click(selectors.auth.verifyOtpButton);

                // Should proceed to next step
                await expect(page.locator('text=/verificado|verified/i')).toBeVisible();
            }
        });

        test('should show error for invalid OTP', async ({ page }) => {
            await page.goto('/signup');

            await page.fill(selectors.auth.emailInput, 'otptest@nexa.test');
            await page.click(selectors.auth.sendOtpButton);

            await expect(page.locator(selectors.auth.otpInput)).toBeVisible();

            // Enter wrong OTP
            await page.fill(selectors.auth.otpInput, '000000');
            await page.click(selectors.auth.verifyOtpButton);

            // Should show error
            await expect(page.locator('text=/inválido|invalid|expirado|expired/i')).toBeVisible();
        });

    });

    test.describe('Protected Routes', () => {

        test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
            await page.goto('/dashboard');

            await expect(page).toHaveURL(/login/);
        });

        test('should redirect to login when accessing chat without auth', async ({ page }) => {
            await page.goto('/dashboard/chat');

            await expect(page).toHaveURL(/login/);
        });

    });

});
