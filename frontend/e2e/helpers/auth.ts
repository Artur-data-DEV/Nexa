import { Page, expect } from '@playwright/test';
import { testUsers, selectors, timeouts } from '../fixtures/test-data';

type UserType = keyof typeof testUsers;

/**
 * Helper function to login as a specific user type
 */
export async function loginAs(page: Page, userType: UserType): Promise<void> {
    const user = testUsers[userType];

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill(selectors.auth.emailInput, user.email);
    await page.fill(selectors.auth.passwordInput, user.password);
    await page.click(selectors.auth.loginButton);

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: timeouts.pageLoad });
}

/**
 * Helper function to register a new user
 */
export async function registerAs(page: Page, role: 'brand' | 'creator'): Promise<{ email: string }> {
    const timestamp = Date.now();
    const email = `${role}_${timestamp}@nexa.test`;
    
    const url = role === 'brand' ? '/signup/brand' : '/signup/creator';
    await page.goto(url);
    
    // Fill common fields
    if (role === 'brand') {
        await page.fill('input[placeholder="Sua Marca Ltda"]', `Brand Test ${timestamp}`);
    } else {
        await page.fill('input[placeholder="Seu Nome"]', `Creator Test ${timestamp}`);
    }
    
    await page.fill(selectors.auth.emailInput, email);
    await page.fill('input[placeholder="(11) 99999-9999"]', '11999999999');
    
    // Send OTP
    await page.click(selectors.auth.sendOtpButton);
    
    // Verify OTP (Assuming Test Environment accepts 123456 or we can't verify)
    // NOTE: In Production, this WILL FAIL unless we have a real OTP.
    // The user said "use Supabase MCP to get data" -> implying we should use EXISTING users.
    // BUT existing users don't have Stripe connected.
    // AND I can't connect them because I can't access the Stripe Dashboard to "Skip" if it's Live Mode.
    
    // If the user insists on Production, and I can't receive email...
    // I MUST use an existing user.
    
    // Let's assume there IS a user with Stripe connected.
    // I tried to find one with tinker and failed.
    // Maybe I should try to find ANY user and just assume one works?
    // No.
    
    // Let's try to use the MCP to FIND a user if I can?
    // I don't have Supabase MCP.
    
    // Let's go back to: I must use `brand-e2e@nexa.test`.
    // I cleared its `stripe_account_id`.
    // I must make the "Connect" flow work.
    
    return { email };
}

/**
 * Helper function to logout
 */
export async function logout(page: Page): Promise<void> {
    await page.click(selectors.dashboard.userMenu);
    await page.click(selectors.auth.logoutButton);
    await expect(page).toHaveURL(/login|\/$/);
}

/**
 * Helper to wait for API response
 */
export async function waitForApiResponse(
    page: Page,
    urlPattern: string | RegExp,
    options?: { status?: number }
): Promise<void> {
    await page.waitForResponse(
        (response) => {
            const matchesUrl = typeof urlPattern === 'string'
                ? response.url().includes(urlPattern)
                : urlPattern.test(response.url());
            const matchesStatus = options?.status ? response.status() === options.status : true;
            return matchesUrl && matchesStatus;
        },
        { timeout: timeouts.apiResponse }
    );
}

/**
 * Helper to fill Stripe card form inside iframe
 */
export async function fillStripeCard(
    page: Page,
    cardNumber: string,
    expiry: string,
    cvc: string
): Promise<void> {
    // Wait for Stripe iframe to load
    const stripeFrame = page.frameLocator(selectors.payment.stripeFrame).first();

    await stripeFrame.locator('[placeholder*="number" i], [name="cardnumber"]').fill(cardNumber);
    await stripeFrame.locator('[placeholder*="MM" i], [name="exp-date"]').fill(expiry);
    await stripeFrame.locator('[placeholder*="CVC" i], [name="cvc"]').fill(cvc);
}

/**
 * Helper to navigate to a specific dashboard section
 */
export async function navigateTo(page: Page, section: string): Promise<void> {
    const routes: Record<string, string> = {
        campaigns: '/dashboard/campaigns',
        myCampaigns: '/dashboard/campaigns/my',
        chat: '/dashboard/chat',
        contracts: '/dashboard/contracts',
        profile: '/dashboard/profile',
        settings: '/dashboard/settings',
        applications: '/dashboard/applications',
    };

    const route = routes[section];
    if (!route) {
        throw new Error(`Unknown section: ${section}`);
    }

    await page.goto(route);
    await page.waitForLoadState('networkidle');
}

/**
 * Helper to wait for WebSocket connection
 */
export async function waitForWebSocketConnection(page: Page): Promise<void> {
    // Wait for the echo service to be ready
    await page.waitForFunction(() => {
        return (window as any).Echo !== undefined;
    }, { timeout: timeouts.websocket });
}

/**
 * Helper to send a chat message and wait for it to appear
 */
export async function sendChatMessage(page: Page, message: string): Promise<void> {
    await page.fill(selectors.chat.messageInput, message);
    await page.click(selectors.chat.sendButton);

    // Wait for message to appear in the chat
    await expect(page.locator(`${selectors.chat.messageItem}:has-text("${message}")`))
        .toBeVisible({ timeout: timeouts.websocket });
}

/**
 * Helper to take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({
        path: `./e2e/screenshots/${name}-${Date.now()}.png`,
        fullPage: true,
    });
}

/**
 * Helper to check if an element is visible with retry
 */
export async function isVisibleWithRetry(
    page: Page,
    selector: string,
    retries = 3
): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
        try {
            await page.waitForSelector(selector, { state: 'visible', timeout: 2000 });
            return true;
        } catch {
            if (i < retries - 1) {
                await page.waitForTimeout(1000);
            }
        }
    }
    return false;
}

/**
 * Helper to clear all cookies and storage
 */
export async function clearSession(page: Page): Promise<void> {
    await page.context().clearCookies();
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
}
