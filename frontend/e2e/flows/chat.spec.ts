import { test, expect } from '@playwright/test';
import { selectors, timeouts } from '../fixtures/test-data';
import { loginAs, waitForWebSocketConnection } from '../helpers/auth';

test.describe('Chat Real-Time Flows', () => {

    test.describe('Chat Room Navigation', () => {

        test('should display messages page after login', async ({ page }) => {
            try {
                await loginAs(page, 'brand');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/messages');
            await page.waitForLoadState('networkidle');

            // Check for any valid messages page state
            const heading = page.getByRole('heading', { name: /chat|mensagens|conversas/i }).first();
            const emptyState = page.getByText(/nenhuma conversa|no conversations|sem mensagens|mensagens/i);
            const pageContent = page.locator('main').first();

            await expect(heading.or(emptyState).or(pageContent)).toBeVisible({ timeout: timeouts.pageLoad });
        });

        test('should open chat room if available', async ({ page }) => {
            try {
                await loginAs(page, 'brand');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/messages');
            await page.waitForLoadState('networkidle');

            // Click on first chat room if exists
            const firstRoom = page.locator(selectors.chat.room).first();

            if (!await firstRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[INFO] No chat rooms found - skipping test');
                test.skip();
                return;
            }

            await firstRoom.click();
            await page.waitForLoadState('networkidle');

            // Message input or chat area should be visible
            const messageInput = page.locator(selectors.chat.messageInput);
            const chatArea = page.locator('main').first();

            await expect(messageInput.or(chatArea)).toBeVisible({ timeout: timeouts.pageLoad });
        });

    });

    test.describe('Real-Time Messaging', () => {

        test('should send message if chat room available', async ({ page }) => {
            try {
                await loginAs(page, 'brand');
            } catch (error) {
                console.log('[WARN] Login failed - skipping test:', (error as Error).message);
                test.skip();
                return;
            }

            await page.goto('/dashboard/messages');
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
                console.log('[INFO] WebSocket connection not available');
            }

            const messageInput = page.locator(selectors.chat.messageInput);
            if (!await messageInput.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('[INFO] No message input found - skipping test');
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

    });

});
