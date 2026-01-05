import { test } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test('Debug Creation Logs & Net', async ({ page }) => {
    test.setTimeout(60000);

    // Browser Consoles
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning')
            console.log(`BROWSER ${msg.type().toUpperCase()}:`, msg.text());
    });
    page.on('pageerror', err => console.log('BROWSER UNCAUGHT:', err));

    // Network Monitoring
    page.on('request', req => {
        if (req.url().includes('/campaigns') && req.method() === 'POST')
            console.log('API POST sent to campaigns');
    });
    page.on('response', async res => {
        if (res.url().includes('/campaigns') && res.request().method() === 'POST') {
            console.log(`API POST response: ${res.status()}`);
            if (res.status() >= 400) {
                console.log('Response body:', await res.text().catch(() => 'no text'));
            }
        }
    });

    console.log('Login...');
    await loginAs(page, 'brand');
    await page.goto('/dashboard/campaigns/create');

    // PREENCHIMENTO RÁPIDO
    await page.getByPlaceholder('Campanha Verão 2024').fill('Debug Title Log');
    await page.getByPlaceholder('Queremos conteúdo autêntico', { exact: false }).fill('Desc');
    await page.getByPlaceholder('R$ 800,00').fill('100');

    const selects = page.locator('select');
    if (await selects.count() > 1) await selects.nth(1).selectOption({ index: 1 });

    await page.locator('label').filter({ hasText: 'UGC' }).click();
    await page.locator('label').filter({ hasText: 'Selecionar todos os estados' }).click();

    const dateInput = page.getByPlaceholder('Selecione uma data');
    await dateInput.fill('28/12/2025');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(500);

    console.log('Submitting...');
    const btn = page.getByRole('button', { name: /Criar/i });
    console.log('Btn text:', await btn.innerText());

    await btn.click();

    console.log('Clicked. Waiting...');
    await page.waitForTimeout(5000);

    const submitted = await page.getByText('Campanha Criada!').isVisible();
    console.log('Success visible?', submitted);
});
