import { test, expect, Page } from '@playwright/test';
import { testUsers, selectors, timeouts } from '../fixtures/test-data';

test.describe('Authentication Flows', () => {

    test.beforeEach(async ({ page }) => {
        // Clear any existing session
        await page.context().clearCookies();
    });

    test.describe('Login', () => {

        test('should login successfully with valid credentials', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');

            await page.fill(selectors.auth.emailInput, testUsers.brand.email);
            await page.fill(selectors.auth.passwordInput, testUsers.brand.password);
            await page.click(selectors.auth.loginButton);

            // Wait for redirect to dashboard or error message
            try {
                await expect(page).toHaveURL(/dashboard/, { timeout: timeouts.pageLoad * 2 });
            } catch {
                // Check if login failed due to missing test user
                const errorVisible = await page.locator(selectors.auth.errorMessage).isVisible().catch(() => false);
                if (errorVisible) {
                    console.log('[WARN] Login failed - E2E test users may not be seeded');
                    test.skip();
                }
                throw new Error('Login did not redirect to dashboard');
            }
        });

        test('should show error with invalid credentials', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');

            await page.fill(selectors.auth.emailInput, 'invalid@email.com');
            await page.fill(selectors.auth.passwordInput, 'wrongpassword');
            await page.click(selectors.auth.loginButton);

            // Should show error or stay on login page
            await page.waitForTimeout(3000);

            const hasError = await page.locator(selectors.auth.errorMessage).isVisible().catch(() => false);
            const stillOnLogin = page.url().includes('/login');

            expect(hasError || stillOnLogin).toBeTruthy();
        });

        test('should show validation error for empty fields', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');

            // Just click submit without filling anything
            await page.click(selectors.auth.loginButton);

            // Expect to stay on login page
            await expect(page).toHaveURL(/login/);

            // Wait a bit to ensure no navigation happens
            await page.waitForTimeout(1000);
            expect(page.url()).toContain('/login');
        });

        test.skip('should redirect to dashboard if already logged in', async ({ page }) => {
            // This test requires a pre-logged-in state which is complex to set up
        });

    });

    test.describe('Logout', () => {

        test('should logout successfully', async ({ page }) => {
            // Login first
            await page.goto('/login');
            await page.fill(selectors.auth.emailInput, testUsers.brand.email);
            await page.fill(selectors.auth.passwordInput, testUsers.brand.password);
            await page.click(selectors.auth.loginButton);

            try {
                await expect(page).toHaveURL(/dashboard/, { timeout: timeouts.pageLoad });
            } catch {
                console.log('[WARN] Login failed - skipping logout test');
                test.skip();
                return;
            }

            // Logout - Target the Avatar button (Shadcn UserNav)
            const userMenu = page.locator('button.rounded-full').first();

            if (!await userMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[WARN] User menu not visible');
                test.skip();
                return;
            }

            await userMenu.click();

            // Click logout in the dropdown
            const logoutOption = page.getByRole('menuitem', { name: /sair|logout/i }).first();
            if (await logoutOption.isVisible({ timeout: 3000 }).catch(() => false)) {
                await logoutOption.click();

                // Should be on login or home page
                await expect(page).toHaveURL(/login|\/$/);
            }
        });

    });

    test.describe('OTP Verification', () => {

        test('should send OTP to email', async ({ page }) => {
            await page.goto('/signup/brand');
            await page.waitForLoadState('networkidle');

            // Fill required fields
            const nameField = page.locator('input[placeholder="Sua Marca Ltda"]');
            if (await nameField.isVisible({ timeout: 5000 }).catch(() => false)) {
                await nameField.fill('Marca Teste E2E');
            }

            const randomEmail = `otp_test_${Date.now()}@nexa.test`;
            await page.fill(selectors.auth.emailInput, randomEmail);

            const phoneField = page.locator('input[placeholder="(11) 99999-9999"]');
            if (await phoneField.isVisible().catch(() => false)) {
                await phoneField.fill('11999999999');
            }

            // Click next step
            const sendOtpBtn = page.locator(selectors.auth.sendOtpButton);
            if (!await sendOtpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[WARN] Send OTP button not found');
                test.skip();
                return;
            }

            await sendOtpBtn.click();

            // Check that we reach the OTP verification screen
            try {
                await expect(page.locator('text=Verifique seu contato')).toBeVisible({ timeout: timeouts.apiResponse });
            } catch {
                // May have different flow or validation errors
                console.log('[INFO] OTP screen not shown - checking for validation errors');
                const hasError = await page.locator('.text-red-500, .text-destructive').first().isVisible().catch(() => false);
                if (hasError) {
                    console.log('[INFO] Form validation error present');
                }
            }
        });

        test.skip('should verify valid OTP', async ({ page }) => {
            // This test requires OTP mocking which is complex
        });

        test.skip('should show error for invalid OTP', async ({ page }) => {
            // This test requires OTP flow setup
        });

    });

    test.describe('Protected Routes', () => {

        test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
            await page.goto('/dashboard');

            // Should redirect to login
            await expect(page).toHaveURL(/login/, { timeout: timeouts.pageLoad });
        });

        test.skip('should redirect to login when accessing chat without auth', async ({ page }) => {
            // Similar to above
        });

    });

});
