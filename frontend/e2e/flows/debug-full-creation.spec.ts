import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test('Debug Final Creation Fix V2', async ({ page }) => {
    test.setTimeout(60000);
    console.log('Login...');
    await loginAs(page, 'brand');
    await page.goto('/dashboard/campaigns/create');

    // Fill essentials
    await page.getByPlaceholder('Campanha Verão 2024').fill('Final Debug Title ' + Date.now());
    await page.getByPlaceholder('Queremos conteúdo autêntico', { exact: false }).fill('Desc');
    await page.getByPlaceholder('R$ 800,00').fill('100');

    // Select Campaign Type
    const selects = page.locator('select');
    if (await selects.count() > 1) {
        await selects.nth(1).selectOption({ index: 1 });
    }

    // Checkboxes - FORCE CLICK INPUTS directly (sr-only elements)
    console.log('Clicking UGC Checkbox Force...');
    await page.locator('label').filter({ hasText: 'UGC' }).locator('input').click({ force: true });

    console.log('Clicking States Checkbox Force...');
    await page.locator('label').filter({ hasText: 'Selecionar todos os estados' }).locator('input').click({ force: true });

    // Date
    const dateInput = page.getByPlaceholder('Selecione uma data');
    await dateInput.click();
    const picker = page.locator('.react-datepicker');
    await expect(picker).toBeVisible({ timeout: 5000 });
    const day = page.locator('.react-datepicker__day:not(.react-datepicker__day--outside-month)').first();
    await day.click({ force: true });

    await page.keyboard.press('Escape'); // Close picker

    // Submit
    console.log('Clicking Submit Force...');
    const btn = page.getByRole('button', { name: /Criar Campanha/i });
    await btn.click({ force: true });

    // Wait for success
    console.log('Waiting for success...');
    await expect(page.getByText(/Campanha Criada|sucesso/i)).toBeVisible({ timeout: 20000 });
    console.log('SUCCESS!');
});
