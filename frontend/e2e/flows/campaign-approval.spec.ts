import { test, expect } from '@playwright/test';
import {
    testUsers,
    stripeTestCards,
    selectors,
    timeouts,
    testApplication,
    testMessages
} from '../fixtures/test-data';
import { loginAs, fillStripeCard, logout, waitForWebSocketConnection } from '../helpers/auth';

test.describe('Campaign Application Approval Flow', () => {

    /**
     * This is the complete end-to-end flow test:
     * 1. Creator applies to a campaign
     * 2. Brand approves the application
     * 3. Brand makes payment
     * 4. Contract is created
     * 5. Chat room opens between Brand and Creator
     */
    test('Complete flow: Application → Approval → Payment → Contract → Chat', async ({ browser }) => {
        // We need two browser contexts to simulate two different users
        const creatorContext = await browser.newContext();
        const brandContext = await browser.newContext();

        const creatorPage = await creatorContext.newPage();
        const brandPage = await brandContext.newPage();

        try {
            // ==========================================
            // STEP 1: Creator applies to a campaign
            // ==========================================
            await test.step('Creator applies to campaign', async () => {
                await loginAs(creatorPage, 'creator');

                await creatorPage.goto('/dashboard/campaigns');
                await creatorPage.waitForLoadState('networkidle');

                // Find a campaign that accepts applications
                const campaignCard = creatorPage.locator(selectors.campaigns.card).first();

                if (await campaignCard.isVisible()) {
                    await campaignCard.click();

                    // Wait for campaign details to load
                    await creatorPage.waitForLoadState('networkidle');

                    // Check if apply button is available
                    const applyButton = creatorPage.locator(selectors.campaigns.applyButton);

                    if (await applyButton.isVisible()) {
                        await applyButton.click();

                        // Fill application form
                        await creatorPage.fill(
                            selectors.campaigns.coverLetterInput,
                            testApplication.coverLetter
                        );

                        // Submit application
                        await creatorPage.click(selectors.campaigns.submitApplication);

                        // Wait for submission
                        await expect(creatorPage.locator(selectors.campaigns.applicationStatus))
                            .toBeVisible({ timeout: timeouts.apiResponse });
                    }
                }
            });

            // ==========================================
            // STEP 2: Brand approves the application
            // ==========================================
            await test.step('Brand approves application', async () => {
                await loginAs(brandPage, 'brand');

                // Navigate to my campaigns
                await brandPage.goto('/dashboard/campaigns/my');
                await brandPage.waitForLoadState('networkidle');

                // Click on first campaign
                const myCampaign = brandPage.locator(selectors.campaigns.card).first();

                if (await myCampaign.isVisible()) {
                    await myCampaign.click();

                    // Go to applications tab
                    await brandPage.click(selectors.campaigns.applicationsTab);

                    // Find pending application
                    const application = brandPage.locator(selectors.campaigns.applicationRow).first();

                    if (await application.isVisible()) {
                        await application.click();

                        // Approve
                        await brandPage.click(selectors.campaigns.approveButton);

                        // Wait for approval process
                        await brandPage.waitForTimeout(2000);
                    }
                }
            });

            // ==========================================
            // STEP 3: Brand makes payment
            // ==========================================
            await test.step('Brand completes payment', async () => {
                // After approval, should be redirected to payment or payment modal appears
                const payButton = brandPage.locator(selectors.payment.payButton);

                if (await payButton.isVisible({ timeout: 5000 })) {
                    await payButton.click();

                    // Wait for Stripe to load
                    await brandPage.waitForTimeout(3000);

                    // Fill card details
                    await fillStripeCard(
                        brandPage,
                        stripeTestCards.success.number,
                        stripeTestCards.success.expiry,
                        stripeTestCards.success.cvc
                    );

                    // Confirm payment
                    await brandPage.click('[data-testid="confirm-payment"]');

                    // Wait for payment success
                    await expect(brandPage.locator(selectors.payment.successMessage))
                        .toBeVisible({ timeout: timeouts.stripeIframe });
                }
            });

            // ==========================================
            // STEP 4: Verify contract is created
            // ==========================================
            await test.step('Contract is created and active', async () => {
                await brandPage.goto('/dashboard/contracts');
                await brandPage.waitForLoadState('networkidle');

                // Find the new contract
                const contractCard = brandPage.locator(selectors.contracts.card).first();

                if (await contractCard.isVisible()) {
                    await contractCard.click();

                    // Contract should be active
                    await expect(brandPage.locator(selectors.contracts.status))
                        .toHaveText(/ativo|active/i, { timeout: timeouts.apiResponse });
                }
            });

            // ==========================================
            // STEP 5: Chat room is created and accessible
            // ==========================================
            await test.step('Chat room is accessible for both users', async () => {
                // Brand navigates to chat
                await brandPage.goto('/dashboard/chat');
                await brandPage.waitForLoadState('networkidle');

                // Should have at least one chat room
                const brandChatRoom = brandPage.locator(selectors.chat.room).first();
                await expect(brandChatRoom).toBeVisible({ timeout: timeouts.pageLoad });

                // Creator also navigates to chat
                await creatorPage.goto('/dashboard/chat');
                await creatorPage.waitForLoadState('networkidle');

                // Creator should also see the chat room
                const creatorChatRoom = creatorPage.locator(selectors.chat.room).first();
                await expect(creatorChatRoom).toBeVisible({ timeout: timeouts.pageLoad });
            });

            // ==========================================
            // STEP 6: Test real-time messaging
            // ==========================================
            await test.step('Real-time messaging works', async () => {
                // Both users click on the chat room
                await brandPage.locator(selectors.chat.room).first().click();
                await creatorPage.locator(selectors.chat.room).first().click();

                // Wait for WebSocket connections
                await waitForWebSocketConnection(brandPage);
                await waitForWebSocketConnection(creatorPage);

                // Brand sends a message
                const testMessage = `Test message from Brand - ${Date.now()}`;
                await brandPage.fill(selectors.chat.messageInput, testMessage);
                await brandPage.click(selectors.chat.sendButton);

                // Creator should see the message in real-time
                await expect(creatorPage.locator(`text=${testMessage}`))
                    .toBeVisible({ timeout: timeouts.websocket });

                // Creator replies
                const replyMessage = `Reply from Creator - ${Date.now()}`;
                await creatorPage.fill(selectors.chat.messageInput, replyMessage);
                await creatorPage.click(selectors.chat.sendButton);

                // Brand should see the reply
                await expect(brandPage.locator(`text=${replyMessage}`))
                    .toBeVisible({ timeout: timeouts.websocket });
            });

        } finally {
            // Cleanup
            await creatorContext.close();
            await brandContext.close();
        }
    });

    test.describe('Application Status Transitions', () => {

        test('Creator can withdraw pending application', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/applications');

            // Find a pending application
            const pendingApplication = page.locator('[data-testid="application-card"]:has([data-testid="status-pending"])').first();

            if (await pendingApplication.isVisible()) {
                await pendingApplication.click();

                // Withdraw button
                await page.click('[data-testid="withdraw-button"]');

                // Confirm
                await page.click('[data-testid="confirm-withdraw"]');

                // Status should change
                await expect(page.locator('[data-testid="status-withdrawn"]')).toBeVisible();
            }
        });

        test('Brand can reject application', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/campaigns/my');

            const campaign = page.locator(selectors.campaigns.card).first();

            if (await campaign.isVisible()) {
                await campaign.click();
                await page.click(selectors.campaigns.applicationsTab);

                const application = page.locator(selectors.campaigns.applicationRow).first();

                if (await application.isVisible()) {
                    await application.click();

                    // Reject
                    await page.click(selectors.campaigns.rejectButton);

                    // Fill rejection reason
                    await page.fill('[data-testid="rejection-reason"]', 'Does not meet requirements');
                    await page.click('[data-testid="confirm-reject"]');

                    // Should show rejected status
                    await expect(page.locator('text=/rejeitado|rejected/i')).toBeVisible();
                }
            }
        });

    });

    test.describe('Contract Lifecycle', () => {

        test('Creator can mark contract as complete', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/contracts');

            // Find an active contract
            const activeContract = page.locator('[data-testid="contract-card"]:has([data-testid="status-active"])').first();

            if (await activeContract.isVisible()) {
                await activeContract.click();

                // Complete button
                const completeButton = page.locator(selectors.contracts.completeButton);

                if (await completeButton.isVisible()) {
                    await completeButton.click();

                    // Confirm completion
                    await page.click('[data-testid="confirm-complete"]');

                    // Status should change to completed/pending review
                    await expect(page.locator('text=/concluído|completed|aguardando/i')).toBeVisible({
                        timeout: timeouts.apiResponse,
                    });
                }
            }
        });

        test('Brand can approve contract completion', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');

            // Find a contract pending review
            const pendingReviewContract = page.locator('[data-testid="contract-card"]:has([data-testid="status-pending-review"])').first();

            if (await pendingReviewContract.isVisible()) {
                await pendingReviewContract.click();

                // Approve completion
                await page.click('[data-testid="approve-completion"]');

                // Rate the creator
                await page.click('[data-testid="rating-5"]');
                await page.fill('[data-testid="review-text"]', 'Excellent work!');
                await page.click('[data-testid="submit-review"]');

                // Contract should be finalized
                await expect(page.locator('text=/finalizado|finalized|completo/i')).toBeVisible();
            }
        });

    });

});
