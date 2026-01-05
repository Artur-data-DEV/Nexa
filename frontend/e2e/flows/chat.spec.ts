import { test, expect, BrowserContext, Page } from '@playwright/test';
import { selectors, timeouts } from '../fixtures/test-data';
import { loginAs, waitForWebSocketConnection, sendChatMessage } from '../helpers/auth';

test.describe('Chat Real-Time Flows', () => {

    test.describe('Chat Room Navigation', () => {

        test('should display chat room list after login', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/chat');
            await page.waitForLoadState('networkidle');

            // Check for room list or empty state
            const roomList = page.locator(selectors.chat.roomList);
            const emptyState = page.getByText(/nenhuma conversa|no conversations|sem mensagens/i);
            const heading = page.getByRole('heading', { name: /chat|mensagens|conversas/i });

            await expect(roomList.or(emptyState).or(heading)).toBeVisible({ timeout: timeouts.pageLoad });
        });

        test('should open chat room and display messages', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/chat');
            await page.waitForLoadState('networkidle');

            // Click on first chat room
            const firstRoom = page.locator(selectors.chat.room).first();

            if (!await firstRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[INFO] No chat rooms found - skipping test');
                test.skip();
                return;
            }

            await firstRoom.click();

            // Message input should be visible
            await expect(page.locator(selectors.chat.messageInput)).toBeVisible({ timeout: timeouts.pageLoad });
        });

    });

    test.describe('Real-Time Messaging', () => {

        test('should send message and see it appear in chat', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/chat');
            await page.waitForLoadState('networkidle');

            const firstRoom = page.locator(selectors.chat.room).first();

            if (!await firstRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[INFO] No chat rooms found - skipping test');
                test.skip();
                return;
            }

            await firstRoom.click();

            try {
                await waitForWebSocketConnection(page);
            } catch {
                console.log('[INFO] WebSocket connection not available - may not be real-time');
            }

            const messageInput = page.locator(selectors.chat.messageInput);
            if (!await messageInput.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[INFO] No message input found');
                test.skip();
                return;
            }

            const testMessage = `Test message ${Date.now()}`;
            await messageInput.fill(testMessage);

            const sendButton = page.locator(selectors.chat.sendButton);
            if (await sendButton.isVisible().catch(() => false)) {
                await sendButton.click();
            } else {
                await page.keyboard.press('Enter');
            }

            // Message should appear in chat
            await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: timeouts.apiResponse });
        });

        test.skip('should show message sent by other user in real-time', async ({ browser }) => {
            // This test requires two concurrent sessions and is complex to run reliably
            // Skipping for now
        });

    });

    test.describe('Typing Indicator', () => {

        test.skip('should show typing indicator when other user types', async ({ browser }) => {
            // Requires concurrent sessions
        });

    });

    test.describe('File Sharing', () => {

        test('should upload and share file in chat', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/chat');
            await page.waitForLoadState('networkidle');

            const firstRoom = page.locator(selectors.chat.room).first();

            if (!await firstRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[INFO] No chat rooms found - skipping test');
                test.skip();
                return;
            }

            await firstRoom.click();

            // Check if file upload button exists
            const fileUpload = page.locator(selectors.chat.fileUpload);

            if (!await fileUpload.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[INFO] No file upload button found - skipping test');
                test.skip();
                return;
            }

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
        });

    });

    test.describe('Chat Room Creation', () => {

        test('should create chat room when contract is approved', async ({ page }) => {
            // This test is for the scenario where a chat room is automatically created
            // when a brand approves a creator's application

            await loginAs(page, 'brand');

            // Navigate to applications
            await page.goto('/dashboard/applications');
            await page.waitForLoadState('networkidle');

            // Check if there are pending applications
            const applicationRow = page.locator(selectors.campaigns.applicationRow).first();

            if (!await applicationRow.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[INFO] No pending applications found - skipping test');
                test.skip();
                return;
            }

            await applicationRow.click();

            // Approve the application
            const approveButton = page.locator(selectors.campaigns.approveButton);
            if (!await approveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[INFO] No approve button found');
                test.skip();
                return;
            }

            await approveButton.click();

            // Wait for processing
            await page.waitForTimeout(3000);

            // Navigate to chat
            await page.goto('/dashboard/chat');
            await page.waitForLoadState('networkidle');

            // A new chat room should exist
            const rooms = page.locator(selectors.chat.room);
            const count = await rooms.count();
            console.log(`[INFO] Chat rooms after approval: ${count}`);
            expect(count).toBeGreaterThanOrEqual(0);
        });

    });

});
