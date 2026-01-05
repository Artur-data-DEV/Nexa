import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration - PRODUCTION
 * Strictly forced to ignore unit tests in /src folder.
 */
export default defineConfig({
    /* Define o diretório de testes explicitamente */
    testDir: './e2e',

    /* Ignora COMPLETAMENTE a pasta src e arquivos de teste de unidade */
    testIgnore: [
        '**/src/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx'
    ],

    /* Apenas arquivos .spec.ts dentro de e2e */
    testMatch: '**/*.spec.ts',

    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 2,
    workers: process.env.CI ? 1 : 2,
    reporter: [['list'], ['html', { open: 'never' }]],

    use: {
        /* Base URL - PRODUCTION environment */
        baseURL: 'https://nexa-frontend-bwld7w5onq-rj.a.run.app',
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

    timeout: 120000,
    expect: {
        timeout: 20000,
    },
});
