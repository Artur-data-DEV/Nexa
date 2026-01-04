import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test('Debug Flow: Create -> Approve -> View', async ({ browser }) => {
    test.setTimeout(90000);
    console.log('Starting debug flow...');

    // Contexts
    const brandContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const creatorContext = await browser.newContext();

    const brandPage = await brandContext.newPage();
    const adminPage = await adminContext.newPage();
    const creatorPage = await creatorContext.newPage();

    // A unique string to identify this run
    const uniqueId = Date.now().toString();
    const campaignTitle = `Debug Campaign ${uniqueId}`;

    // 1. BRAND CREATES CAMPAIGN
    await test.step('Brand Creates', async () => {
        console.log('Brand: Login');
        await loginAs(brandPage, 'brand');

        console.log('Brand: Create Page');
        await brandPage.goto('/dashboard/campaigns/create');

        await brandPage.getByPlaceholder(/Campanha Verão|Nome/i).first().fill(campaignTitle);
        await brandPage.getByPlaceholder(/conteúdo autêntico|descrição/i).first().fill('Debug Description');
        await brandPage.getByPlaceholder(/R\$|0,00/i).first().fill('100');

        // Date
        const dateInput = brandPage.getByPlaceholder(/Selecione uma data|Data/i).first();
        await dateInput.click();
        await brandPage.locator('.react-datepicker__day').last().click();
        await brandPage.keyboard.press('Escape');

        await brandPage.getByRole('button', { name: /Criar|Create/i }).click();
        await expect(brandPage.getByText(/sucesso|success|criada|created/i)).toBeVisible();
        console.log('Brand: Campaign Created');
    });

    // 2. ADMIN APPROVES
    await test.step('Admin Approves', async () => {
        console.log('Admin: Login');
        await loginAs(adminPage, 'admin');

        console.log('Admin: Pending List');
        await adminPage.goto('/admin/campaigns/pending');

        // Reload polling
        let found = false;
        for (let i = 0; i < 10; i++) {
            // Check if card with title exists
            if (await adminPage.getByText(campaignTitle).count() > 0) {
                found = true;
                break;
            }
            console.log(`Admin: Polling ${i}...`);
            await adminPage.reload();
            await adminPage.waitForTimeout(2000);
        }

        if (!found) throw new Error('Campaign not found in pending list');

        // Approve
        const card = adminPage.locator('.bg-card').filter({ hasText: campaignTitle }).first();
        await card.locator('button:has-text("Aprovar")').click();

        await expect(card).not.toBeVisible();
        console.log('Admin: Approved');
    });

    // 3. CREATOR VIEWS
    await test.step('Creator Views', async () => {
        console.log('Creator: Login');
        await loginAs(creatorPage, 'creator');

        console.log('Creator: List');
        await creatorPage.goto('/dashboard/campaigns');

        // Reload polling
        let found = false;
        for (let i = 0; i < 10; i++) {
            if (await creatorPage.getByText(campaignTitle).count() > 0) {
                found = true;
                break;
            }
            console.log(`Creator: Polling ${i}...`);
            await creatorPage.reload();
            await creatorPage.waitForTimeout(2000);
        }

        if (!found) {
            console.log('Creator: Campaign NOT found. Dumping page text...');
            // Optional: dump visible text to help debug
            const text = await creatorPage.locator('body').innerText();
            console.log(text.substring(0, 500) + '...');
            throw new Error('Campaign not visible to creator');
        }

        console.log('Creator: Campaign Visible!');
    });

    await brandContext.close();
    await adminContext.close();
    await creatorContext.close();
});
