import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    testIgnore: [
        '**/src/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
    ],
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'on',
        video: 'retain-on-failure',
        actionTimeout: 45000,
        navigationTimeout: 60000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    timeout: 180000,
    expect: {
        timeout: 20000,
    },
})

