import { test } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test('dump campaign form html', async ({ page }) => {
    await loginAs(page, 'brand');
    await page.goto('/dashboard/campaigns/create');
    await page.waitForLoadState('networkidle');
    console.log(await page.content());
});
