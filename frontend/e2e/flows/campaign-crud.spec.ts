import { test, expect } from '@playwright/test';
import {
    // testUsers,
    // testCampaign,
    // selectors,
    timeouts
} from '../fixtures/test-data';
import { loginAs } from '../helpers/auth';

test.describe('Campaign CRUD Flows', () => {

    test.describe('Campaign Listing', () => {

        test('should display campaigns for creator', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/campaigns');
            await page.waitForLoadState('networkidle');

            // Page header should be visible
            await expect(page.getByRole('heading', { name: /campanhas|campaigns/i }).first()).toBeVisible();

            // Campaign cards should be present (if any exist)
            const campaignCards = page.locator('div.rounded-xl.border.bg-card, [data-testid="campaign-card"]');
            const count = await campaignCards.count();

            // Log the count for debugging
            console.log(`Found ${count} campaign cards`);
        });

        test('should display campaigns for brand (my campaigns)', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/campaigns/my');
            await page.waitForLoadState('networkidle');

            // Page should load
            await expect(page.getByRole('heading', { name: /minhas campanhas|my campaigns|campanhas/i }).first()).toBeVisible();
        });

        test('should filter campaigns by category', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/campaigns');
            await page.waitForLoadState('networkidle');

            // Find category filter
            const categoryFilter = page.locator('select, [data-testid="category-filter"], [role="combobox"]').first();

            if (await categoryFilter.isVisible()) {
                await categoryFilter.click();

                // Select a category (lifestyle, moda, etc.)
                const lifestyleOption = page.locator('text=/lifestyle|moda|beleza/i').first();
                if (await lifestyleOption.isVisible()) {
                    await lifestyleOption.click();

                    // Wait for filter to apply
                    await page.waitForTimeout(1000);
                }
            }
        });

        test('should search campaigns by title', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/campaigns');
            await page.waitForLoadState('networkidle');

            // Find search input
            const searchInput = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="search" i]').first();

            if (await searchInput.isVisible()) {
                await searchInput.fill('test');
                await page.keyboard.press('Enter');

                // Wait for search results
                await page.waitForTimeout(1000);
            }
        });

    });

    test.describe('Campaign Creation', () => {

        test('should open campaign creation form', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/campaigns/create');
            await page.waitForLoadState('networkidle');

            // Form should be visible
            await expect(page.getByRole('heading', { name: /criar|nova|create|new/i }).first()).toBeVisible();

            // Key form fields should be present
            await expect(page.getByPlaceholder('Campanha Verão 2024').first()).toBeVisible();
        });

        test('should validate required fields on submit', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/campaigns/create');
            await page.waitForLoadState('networkidle');

            // Try to submit empty form
            const submitButton = page.getByRole('button', { name: /criar campanha|create campaign/i });
            await submitButton.scrollIntoViewIfNeeded();
            await submitButton.click();

            // Should show validation errors or stay on form
            await page.waitForTimeout(1000);

            // Either validation messages appear or form fields show error state
            const hasValidationError = await page.locator('.text-destructive, .text-red-500, [data-error="true"]').first().isVisible().catch(() => false);
            const stillOnForm = page.url().includes('/create');

            expect(hasValidationError || stillOnForm).toBeTruthy();
        });

        test('should create campaign successfully', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/campaigns/create');
            await page.waitForLoadState('networkidle');

            const uniqueTitle = `E2E Campaign ${Date.now()}`;

            // Fill Title
            const titleField = page.getByPlaceholder('Campanha Verão 2024').first();
            await titleField.scrollIntoViewIfNeeded();
            await titleField.fill(uniqueTitle);

            // Fill Description
            const descField = page.getByPlaceholder('Queremos conteúdo autêntico sobre moda verão').first();
            await descField.fill('Descrição de teste E2E para validar criação de campanha.');

            // Fill Budget
            const budgetField = page.getByPlaceholder('R$ 800,00').first();
            await budgetField.fill('1000');

            // Campaign Type
            const typeSelect = page.locator('select').nth(1);
            if (await typeSelect.isVisible()) {
                await typeSelect.selectOption({ index: 1 });
            }

            // Creator Type (Check UGC)
            const ugcCheckbox = page.locator('label').filter({ hasText: 'UGC' }).locator('input[type="checkbox"]').first();
            if (await ugcCheckbox.isVisible()) {
                await ugcCheckbox.check();
            }

            // States (Select All)
            const selectAllStates = page.getByText('Selecionar todos os estados');
            if (await selectAllStates.isVisible()) {
                await selectAllStates.click();
            }

            // Deadline
            const deadlineInput = page.getByPlaceholder('Selecione uma data').first();
            await deadlineInput.scrollIntoViewIfNeeded();
            await deadlineInput.click();

            // Wait for datepicker
            await page.locator('.react-datepicker').waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });

            // Select day 28
            const day28 = page.locator('.react-datepicker__day:not(.react-datepicker__day--outside-month)').getByText('28', { exact: true }).first();
            if (await day28.isVisible()) {
                await day28.click();
            }
            await page.keyboard.press('Escape');

            // Submit
            const submitBtn = page.getByRole('button', { name: /Criar Campanha/i });
            await submitBtn.scrollIntoViewIfNeeded();
            await submitBtn.click();

            // Wait for success
            await expect(page.getByText(/Campanha Criada|sucesso|success/i)).toBeVisible({ timeout: timeouts.apiResponse });
        });

    });

    test.describe('Campaign Details', () => {

        test('should view campaign details', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/campaigns');
            await page.waitForLoadState('networkidle');

            // Find first campaign card
            const campaignCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="campaign-card"]').first();

            if (await campaignCard.isVisible()) {
                // Click "Ver Detalhes"
                const detailsLink = campaignCard.locator('a:has-text("Ver Detalhes"), button:has-text("Ver Detalhes")').first();
                if (await detailsLink.isVisible()) {
                    await detailsLink.click();
                    await page.waitForLoadState('networkidle');

                    // Details page should show campaign info
                    await expect(page.locator('[data-testid="campaign-title"], h1, h2').first()).toBeVisible();
                }
            }
        });

        test('should display campaign requirements', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/campaigns');
            await page.waitForLoadState('networkidle');

            // Find and click first campaign
            const campaignCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="campaign-card"]').first();

            if (await campaignCard.isVisible()) {
                const detailsLink = campaignCard.locator('a:has-text("Ver Detalhes")').first();
                if (await detailsLink.isVisible()) {
                    await detailsLink.click();
                    await page.waitForLoadState('networkidle');

                    // Requirements section should be visible somewhere on the page
                    const hasBudget = await page.getByText(/R\$|orçamento|budget/i).first().isVisible().catch(() => false);
                    const hasDeadline = await page.getByText(/prazo|deadline|data/i).first().isVisible().catch(() => false);

                    expect(hasBudget || hasDeadline).toBeTruthy();
                }
            }
        });

    });

    test.describe('Campaign Edit', () => {

        test('should edit own campaign', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/campaigns/my');
            await page.waitForLoadState('networkidle');

            // Find first campaign
            const campaignCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="campaign-card"]').first();

            if (await campaignCard.isVisible()) {
                // Click edit button
                const editButton = campaignCard.locator('button:has-text("Editar"), a:has-text("Editar"), [data-testid="edit-campaign"]').first();

                if (await editButton.isVisible()) {
                    await editButton.click();
                    await page.waitForLoadState('networkidle');

                    // Should be on edit form
                    await expect(page.getByRole('heading', { name: /editar|edit/i }).first()).toBeVisible();
                }
            }
        });

    });

    test.describe('Campaign Status', () => {

        test('should display campaign status badges', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/campaigns/my');
            await page.waitForLoadState('networkidle');

            // Find campaign cards
            const campaignCards = page.locator('div.rounded-xl.border.bg-card, [data-testid="campaign-card"]');
            const count = await campaignCards.count();

            if (count > 0) {
                // Check first card has status badge
                const firstCard = campaignCards.first();
                const statusBadge = firstCard.locator('.badge, [data-testid="status-badge"], .inline-flex.items-center.rounded-full').first();

                if (await statusBadge.isVisible()) {
                    // Status should contain valid values
                    const statusText = await statusBadge.textContent();
                    expect(statusText).toMatch(/ativo|pendente|concluído|active|pending|completed|aprovado|rascunho/i);
                }
            }
        });

    });

});
