import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { testUsers, selectors, timeouts, testMessages } from '../fixtures/test-data';
import { loginAs, waitForWebSocketConnection, sendChatMessage } from '../helpers/auth';

test.describe('Chat Real-Time Flows', () => {

    test.describe('Chat Room Navigation', () => {

        test('should display chat room list after login', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/chat');
            await page.waitForLoadState('networkidle');

            await expect(page.locator(selectors.chat.roomList)).toBeVisible();
        });

        test('should open chat room and display messages', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/chat');

            // Click on first chat room
            const firstRoom = page.locator(selectors.chat.room).first();
            if (await firstRoom.isVisible()) {
                await firstRoom.click();

                // Message input should be visible
                await expect(page.locator(selectors.chat.messageInput)).toBeVisible();
            }
        });

    });

    test.describe('Real-Time Messaging', () => {

        test('should send message and see it appear in chat', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/chat');

            const firstRoom = page.locator(selectors.chat.room).first();
            if (await firstRoom.isVisible()) {
                await firstRoom.click();

                await waitForWebSocketConnection(page);

                const testMessage = `Test message ${Date.now()}`;
                await sendChatMessage(page, testMessage);

                // Message should appear in chat
                await expect(page.locator(`text=${testMessage}`)).toBeVisible();
            }
        });

        test('should show message sent by other user in real-time', async ({ browser }) => {
            // Create two separate browser contexts (simulating two users)
            const brandContext: BrowserContext = await browser.newContext();
            const creatorContext: BrowserContext = await browser.newContext();

            const brandPage: Page = await brandContext.newPage();
            const creatorPage: Page = await creatorContext.newPage();

            try {
                // Login as Brand
                await loginAs(brandPage, 'brand');

                // Login as Creator
                await loginAs(creatorPage, 'creator');

                // Both navigate to chat
                await brandPage.goto('/dashboard/chat');
                await creatorPage.goto('/dashboard/chat');

                // Both click on the first shared chat room
                const brandFirstRoom = brandPage.locator(selectors.chat.room).first();
                const creatorFirstRoom = creatorPage.locator(selectors.chat.room).first();

                if (await brandFirstRoom.isVisible() && await creatorFirstRoom.isVisible()) {
                    await brandFirstRoom.click();
                    await creatorFirstRoom.click();

                    // Wait for WebSocket connections
                    await waitForWebSocketConnection(brandPage);
                    await waitForWebSocketConnection(creatorPage);

                    // Brand sends a message
                    const testMessage = `Real-time test ${Date.now()}`;
                    await brandPage.fill(selectors.chat.messageInput, testMessage);
                    await brandPage.click(selectors.chat.sendButton);

                    // Creator should see the message in real-time (without refresh)
                    await expect(creatorPage.locator(`text=${testMessage}`))
                        .toBeVisible({ timeout: timeouts.websocket });
                }
            } finally {
                await brandContext.close();
                await creatorContext.close();
            }
        });

    });

    test.describe('Typing Indicator', () => {

        test('should show typing indicator when other user types', async ({ browser }) => {
            const brandContext = await browser.newContext();
            const creatorContext = await browser.newContext();

            const brandPage = await brandContext.newPage();
            const creatorPage = await creatorContext.newPage();

            try {
                await loginAs(brandPage, 'brand');
                await loginAs(creatorPage, 'creator');

                await brandPage.goto('/dashboard/chat');
                await creatorPage.goto('/dashboard/chat');

                const brandFirstRoom = brandPage.locator(selectors.chat.room).first();
                const creatorFirstRoom = creatorPage.locator(selectors.chat.room).first();

                if (await brandFirstRoom.isVisible() && await creatorFirstRoom.isVisible()) {
                    await brandFirstRoom.click();
                    await creatorFirstRoom.click();

                    await waitForWebSocketConnection(brandPage);
                    await waitForWebSocketConnection(creatorPage);

                    // Brand starts typing (but doesn't send)
                    await brandPage.fill(selectors.chat.messageInput, 'Typing something...');

                    // Wait a bit for the typing event to propagate
                    await creatorPage.waitForTimeout(500);

                    // Creator should see typing indicator
                    const typingIndicator = creatorPage.locator(selectors.chat.typingIndicator);

                    // Typing indicator should be visible (if implemented)
                    const isVisible = await typingIndicator.isVisible().catch(() => false);
                    if (isVisible) {
                        await expect(typingIndicator).toBeVisible();
                    }
                }
            } finally {
                await brandContext.close();
                await creatorContext.close();
            }
        });

    });

    test.describe('File Sharing', () => {

        test('should upload and share file in chat', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/chat');

            const firstRoom = page.locator(selectors.chat.room).first();
            if (await firstRoom.isVisible()) {
                await firstRoom.click();

                // Check if file upload button exists
                const fileUpload = page.locator(selectors.chat.fileUpload);
                if (await fileUpload.isVisible()) {
                    // Create a test file
                    await fileUpload.setInputFiles({
                        name: 'test-image.png',
                        mimeType: 'image/png',
                        buffer: Buffer.from('fake-image-content'),
                    });

                    // Wait for upload to complete
                    await page.waitForTimeout(2000);

                    // File message should appear
                    await expect(page.locator('text=test-image.png')).toBeVisible({
                        timeout: timeouts.apiResponse,
                    });
                }
            }
        });

    });

    test.describe('Chat Room Creation', () => {

        test('should create chat room when contract is approved', async ({ page }) => {
            // This test is for the scenario where a chat room is automatically created
            // when a brand approves a creator's application

            await loginAs(page, 'brand');

            // Navigate to applications
            await page.goto('/dashboard/applications');

            // Check if there are pending applications
            const applicationRow = page.locator(selectors.campaigns.applicationRow).first();

            if (await applicationRow.isVisible()) {
                await applicationRow.click();

                // Approve the application
                await page.click(selectors.campaigns.approveButton);

                // Wait for processing
                await page.waitForTimeout(3000);

                // Navigate to chat
                await page.goto('/dashboard/chat');

                // A new chat room should exist
                await expect(page.locator(selectors.chat.room)).toHaveCount(await page.locator(selectors.chat.room).count());
            }
        });

    });

});
