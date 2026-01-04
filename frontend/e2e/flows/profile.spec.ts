import { test, expect } from '@playwright/test';
import { testUsers, selectors, timeouts } from '../fixtures/test-data';
import { loginAs } from '../helpers/auth';

test.describe('Profile Management Flows', () => {

    test.describe('Profile View', () => {

        test('should display brand profile correctly', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/profile');
            await page.waitForLoadState('networkidle');

            // Profile page header should be visible
            await expect(page.getByRole('heading', { name: /perfil|profile/i }).first()).toBeVisible();

            // Key profile sections should be visible
            await expect(page.locator('[data-testid="profile-avatar"], img[alt*="avatar" i], .avatar')).toBeVisible();
        });

        test('should display creator profile correctly', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/profile');
            await page.waitForLoadState('networkidle');

            // Profile page should load
            await expect(page.getByRole('heading', { name: /perfil|profile/i }).first()).toBeVisible();

            // Creator-specific sections might include portfolio/social links
            await expect(page.locator('[data-testid="profile-avatar"], img[alt*="avatar" i], .avatar')).toBeVisible();
        });

    });

    test.describe('Profile Edit', () => {

        test('should update brand profile name', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/profile');
            await page.waitForLoadState('networkidle');

            // Click edit button
            const editButton = page.getByRole('button', { name: /editar|edit/i }).first();
            if (await editButton.isVisible()) {
                await editButton.click();

                // Update name field
                const nameInput = page.locator('input[name="name"], input[name="company_name"]').first();
                await nameInput.clear();
                const newName = `Brand Updated ${Date.now()}`;
                await nameInput.fill(newName);

                // Save changes
                const saveButton = page.getByRole('button', { name: /salvar|save/i }).first();
                await saveButton.click();

                // Should show success message
                await expect(page.getByText(/sucesso|success|atualizado|updated/i)).toBeVisible({
                    timeout: timeouts.apiResponse,
                });
            }
        });

        test('should update creator bio', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/profile');
            await page.waitForLoadState('networkidle');

            // Click edit button
            const editButton = page.getByRole('button', { name: /editar|edit/i }).first();
            if (await editButton.isVisible()) {
                await editButton.click();

                // Update bio field
                const bioInput = page.locator('textarea[name="bio"], textarea[name="description"]').first();
                if (await bioInput.isVisible()) {
                    await bioInput.clear();
                    const newBio = `Creator bio updated at ${Date.now()}`;
                    await bioInput.fill(newBio);

                    // Save changes
                    const saveButton = page.getByRole('button', { name: /salvar|save/i }).first();
                    await saveButton.click();

                    // Should show success message
                    await expect(page.getByText(/sucesso|success|atualizado|updated/i)).toBeVisible({
                        timeout: timeouts.apiResponse,
                    });
                }
            }
        });

        test('should update avatar image', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/profile');
            await page.waitForLoadState('networkidle');

            // Find avatar upload input
            const avatarInput = page.locator('input[type="file"][accept*="image"]').first();

            if (await avatarInput.isVisible({ timeout: 5000 }).catch(() => false)) {
                // Create a test image
                await avatarInput.setInputFiles({
                    name: 'test-avatar.png',
                    mimeType: 'image/png',
                    buffer: Buffer.from('fake-image-content-for-testing'),
                });

                // Wait for upload
                await page.waitForTimeout(2000);

                // Save if needed
                const saveButton = page.getByRole('button', { name: /salvar|save/i }).first();
                if (await saveButton.isVisible()) {
                    await saveButton.click();
                }

                // Should show success or image should update
                await expect(page.getByText(/sucesso|success|atualizado|updated|enviado|uploaded/i)).toBeVisible({
                    timeout: timeouts.apiResponse,
                });
            }
        });

    });

    test.describe('Profile Validation', () => {

        test('should show validation error for empty required fields', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/profile');
            await page.waitForLoadState('networkidle');

            // Click edit button
            const editButton = page.getByRole('button', { name: /editar|edit/i }).first();
            if (await editButton.isVisible()) {
                await editButton.click();

                // Clear required field
                const nameInput = page.locator('input[name="name"], input[name="company_name"]').first();
                if (await nameInput.isVisible()) {
                    await nameInput.clear();

                    // Try to save
                    const saveButton = page.getByRole('button', { name: /salvar|save/i }).first();
                    await saveButton.click();

                    // Should show validation error or prevent submission
                    await page.waitForTimeout(1000);

                    // Either error message or still on edit mode
                    const hasError = await page.getByText(/obrigatório|required|erro|error/i).isVisible().catch(() => false);
                    const stillEditing = await nameInput.isVisible();

                    expect(hasError || stillEditing).toBeTruthy();
                }
            }
        });

    });

    test.describe('Social Links', () => {

        test('should update social media links', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/profile');
            await page.waitForLoadState('networkidle');

            // Find social media section
            const socialSection = page.locator('[data-testid="social-links"], :has-text("Redes Sociais")').first();

            if (await socialSection.isVisible().catch(() => false)) {
                // Click edit if needed
                const editButton = socialSection.getByRole('button', { name: /editar|edit/i }).first();
                if (await editButton.isVisible()) {
                    await editButton.click();
                }

                // Update Instagram field
                const instagramInput = page.locator('input[name="instagram"], input[placeholder*="instagram" i]').first();
                if (await instagramInput.isVisible()) {
                    await instagramInput.clear();
                    await instagramInput.fill('@testcreator_e2e');

                    // Save
                    const saveButton = page.getByRole('button', { name: /salvar|save/i }).first();
                    await saveButton.click();

                    // Should show success
                    await expect(page.getByText(/sucesso|success|atualizado|updated/i)).toBeVisible({
                        timeout: timeouts.apiResponse,
                    });
                }
            }
        });

    });

});
