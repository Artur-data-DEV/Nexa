import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Nexa E2E Tests
 * @see https://playwright.dev/docs/test-configuration
 * 
 * NOTE: Configured to test against PRODUCTION environment
 */
export default defineConfig({
    testDir: './e2e',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use */
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL - PRODUCTION environment */
        baseURL: process.env.BASE_URL || 'https://nexa-frontend-bwld7w5onq-rj.a.run.app',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'on-first-retry',

        /* Timeout for each action */
        actionTimeout: 15000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Global timeout for each test */
    timeout: 60000,

    /* Expect timeout */
    expect: {
        timeout: 10000,
    },
});
