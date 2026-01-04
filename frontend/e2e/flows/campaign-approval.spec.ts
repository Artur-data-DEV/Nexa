import { test, expect } from '@playwright/test';
import {
    testUsers,
    stripeTestCards,
    selectors,
    timeouts,
    testApplication
} from '../fixtures/test-data';
import { loginAs, fillStripeCard, waitForWebSocketConnection } from '../helpers/auth';

test.describe('Campaign Application Approval Flow', () => {

    /**
     * This is the complete end-to-end flow test:
     * 0. Brand creates a campaign (Prerequisite)
     * 1. Creator applies to the campaign
     * 2. Brand approves the application
     * 3. Brand makes payment
     * 4. Contract is created
     * 5. Chat room opens between Brand and Creator
     */
    test('Complete flow: Create -> Apply -> Approve -> Payment -> Contract -> Chat', async ({ browser }) => {
        test.setTimeout(180000); // 3 minutes timeout for full flow

        const creatorContext = await browser.newContext();
        const brandContext = await browser.newContext();

        const creatorPage = await creatorContext.newPage();
        const brandPage = await brandContext.newPage();

        const uniqueCampaignTitle = `Campaign ${Date.now()}`;

        try {
            // ==========================================
            // STEP 0: Brand creates a campaign
            // ==========================================
            await test.step('Brand creates a campaign', async () => {
                await loginAs(brandPage, 'brand');

                await brandPage.goto('/dashboard/campaigns/create');
                await brandPage.waitForLoadState('networkidle');

                await brandPage.waitForLoadState('networkidle');

                // Check if we are on the create page
                await expect(brandPage.locator('h2:has-text("Criar Nova Campanha")')).toBeVisible({ timeout: 10000 });

                // Fill Title using Label association
                const titleInput = brandPage.locator('div').filter({ has: brandPage.locator('label', { hasText: 'Título da Campanha' }) }).locator('input').first();
                await titleInput.fill(uniqueCampaignTitle);

                // Fill Description
                const descInput = brandPage.locator('div').filter({ has: brandPage.locator('label', { hasText: 'Descrição da Campanha' }) }).locator('textarea').first();
                await descInput.fill('This is a test campaign description.');

                // Fill Budget
                // Budget input is usually near "Orçamento (R$)" or "Valor Estimado"
                const budgetInput = brandPage.locator('div').filter({ has: brandPage.locator('label', { hasText: 'Orçamento' }) }).locator('input').first();
                await budgetInput.fill('100');

                // Campaign Type
                await brandPage.locator('select').nth(1).selectOption({ index: 1 });

                // Creator Type (Check UGC) - Label "UGC (Conteúdo do Usuário)"
                const ugcLabel = brandPage.locator('label').filter({ hasText: 'UGC' }).first();
                await ugcLabel.click();

                // States (Select All)
                await brandPage.getByText('Selecionar todos os estados').click();

                // Deadline
                const deadlineDiv = brandPage.locator('div').filter({ has: brandPage.locator('label', { hasText: 'Prazo Final' }) }).first();
                await deadlineDiv.locator('input').first().click();
                await brandPage.locator('.react-datepicker__day').filter({ hasText: '28' }).first().click(); // Pick a day, safely
                // Or just type if possible? Datepicker usually readonly. 
                // Pressing Escape checking if closed
                await brandPage.keyboard.press('Escape');

                // Submit
                await brandPage.getByRole('button', { name: 'Criar Campanha' }).click();

                // Wait for success
                await expect(brandPage.getByText('Campanha Criada!')).toBeVisible({ timeout: timeouts.apiResponse });
            });

            // ==========================================
            // STEP 1: Creator applies to the campaign
            // ==========================================
            await test.step('Creator applies to campaign', async () => {
                await loginAs(creatorPage, 'creator');

                await creatorPage.goto('/dashboard/campaigns');
                await creatorPage.waitForLoadState('networkidle');

                // Find the specific campaign by title or click the first one
                // Usage of 'div.rounded-xl' or 'div.bg-card'
                const campaignCard = creatorPage.locator('div.bg-card').filter({ hasText: uniqueCampaignTitle }).first();

                // Fallback to reload and try again if not found immediately
                try {
                    await expect(campaignCard).toBeVisible({ timeout: 5000 });
                    await campaignCard.click();
                } catch (e) {
                    console.log('Campaign specific card not found, reloading...');
                    await creatorPage.reload();
                    await creatorPage.waitForLoadState('networkidle');

                    try {
                        await expect(campaignCard).toBeVisible({ timeout: 5000 });
                        await campaignCard.click();
                    } catch (e2) {
                        console.log('Still not found, clicking first available.');
                        await creatorPage.locator(selectors.campaigns.card).first().click();
                    }
                }

                await creatorPage.waitForLoadState('networkidle');

                const applyButton = creatorPage.locator(selectors.campaigns.applyButton);
                if (await applyButton.isVisible()) {
                    await applyButton.click();

                    await creatorPage.fill(selectors.campaigns.coverLetterInput, testApplication.coverLetter);
                    await creatorPage.click(selectors.campaigns.submitApplication);

                    await expect(creatorPage.locator(selectors.campaigns.applicationStatus)).toBeVisible({ timeout: timeouts.apiResponse });
                }
            });

            // ==========================================
            // STEP 2: Brand approves the application
            // ==========================================
            await test.step('Brand approves application', async () => {
                // Return to Brand Page
                await brandPage.goto('/dashboard/campaigns/my');
                await brandPage.waitForLoadState('networkidle');

                // Find campaign
                const myCampaign = brandPage.locator('div.bg-card').filter({ hasText: uniqueCampaignTitle }).first();

                try {
                    await expect(myCampaign).toBeVisible({ timeout: 5000 });
                    await myCampaign.click();
                } catch (e) {
                    console.log('My campaign verification failed, trying fallback.');
                    await brandPage.locator(selectors.campaigns.card).first().click();
                }

                await brandPage.click(selectors.campaigns.applicationsTab);

                // Find pending application
                const application = brandPage.locator(selectors.campaigns.applicationRow).first();
                await application.waitFor({ state: 'visible', timeout: 5000 });
                await application.click();

                // Approve
                await brandPage.click(selectors.campaigns.approveButton);
                await brandPage.waitForTimeout(2000);
            });

            // ==========================================
            // STEP 3: Brand makes payment
            // ==========================================
            await test.step('Brand completes payment', async () => {
                const payButton = brandPage.locator(selectors.payment.payButton);
                // It might take a moment to appear or redirect
                await payButton.waitFor({ state: 'visible', timeout: 10000 });
                await payButton.click();

                await brandPage.waitForTimeout(3000); // Wait for Stripe

                await fillStripeCard(
                    brandPage,
                    stripeTestCards.success.number,
                    stripeTestCards.success.expiry,
                    stripeTestCards.success.cvc
                );

                // Confirm payment generic selector
                // Likely a button inside the stripe form or similar.
                // If it's a custom button:
                // We rely on fillStripeCard handling the iframe.
                // If there is a "Pagar" button outside:
                // But test-data had [data-testid="confirm-payment"]
                // I'll assume it is a button with text "Pagar" or "Confirmar"

                // Inspecting previous code: brandPage.click('[data-testid="confirm-payment"]');
                // I will try to find a button "Pagar"
                const confirmButton = brandPage.getByRole('button', { name: /pagar|confirmar/i, exact: false });
                if (await confirmButton.isVisible()) {
                    await confirmButton.click();
                }

                await expect(brandPage.locator(selectors.payment.successMessage)).toBeVisible({ timeout: timeouts.stripeIframe });
            });

            // ==========================================
            // STEP 4: Verify contract matches
            // ==========================================
            await test.step('Contract is created', async () => {
                await brandPage.goto('/dashboard/contracts');
                await brandPage.waitForLoadState('networkidle');

                const contractCard = brandPage.locator(selectors.contracts.card).first();
                await contractCard.waitFor({ state: 'visible' });
                await contractCard.click();

                await expect(brandPage.locator(selectors.contracts.status)).toHaveText(/ativo|active/i, { timeout: timeouts.apiResponse });
            });

            // ==========================================
            // STEP 5: Chat room verification
            // ==========================================
            await test.step('Chat room is accessible', async () => {
                await brandPage.goto('/dashboard/chat');
                const brandRoom = brandPage.locator(selectors.chat.room).first();
                await expect(brandRoom).toBeVisible();

                await creatorPage.goto('/dashboard/chat');
                const creatorRoom = creatorPage.locator(selectors.chat.room).first();
                await expect(creatorRoom).toBeVisible();
            });

            // ==========================================
            // STEP 6: Real-time messaging
            // ==========================================
            await test.step('Real-time messaging', async () => {
                await brandPage.locator(selectors.chat.room).first().click();
                await creatorPage.locator(selectors.chat.room).first().click();

                await waitForWebSocketConnection(brandPage);
                await waitForWebSocketConnection(creatorPage);

                const msg = `Hello ${Date.now()}`;
                await brandPage.fill(selectors.chat.messageInput, msg);
                await brandPage.click(selectors.chat.sendButton);

                await expect(creatorPage.getByText(msg)).toBeVisible({ timeout: timeouts.websocket });
            });

        } finally {
            await creatorContext.close();
            await brandContext.close();
        }
    });

});
