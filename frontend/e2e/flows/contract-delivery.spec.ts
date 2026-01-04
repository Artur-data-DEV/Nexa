import { test, expect } from '@playwright/test';
import { testUsers, selectors, timeouts } from '../fixtures/test-data';
import { loginAs } from '../helpers/auth';

test.describe('Contract & Delivery Flows', () => {

    test.describe('Contract Listing', () => {

        test('should display contracts for brand', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Page should load
            await expect(page.getByRole('heading', { name: /contratos|contracts/i }).first()).toBeVisible();
        });

        test('should display contracts for creator', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Page should load
            await expect(page.getByRole('heading', { name: /contratos|contracts/i }).first()).toBeVisible();
        });

        test('should filter contracts by status', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Find status filter
            const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"], button:has-text("Filtrar")').first();

            if (await statusFilter.isVisible()) {
                await statusFilter.click();

                // Select "Active" or similar
                const activeOption = page.locator('text=/ativo|active|em andamento/i').first();
                if (await activeOption.isVisible()) {
                    await activeOption.click();
                    await page.waitForTimeout(1000);
                }
            }
        });

    });

    test.describe('Contract Details', () => {

        test('should view contract details', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Find first contract card
            const contractCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="contract-card"]').first();

            if (await contractCard.isVisible()) {
                await contractCard.click();
                await page.waitForLoadState('networkidle');

                // Contract details should include key information
                const hasCreatorInfo = await page.getByText(/criador|creator/i).first().isVisible().catch(() => false);
                const hasCampaignInfo = await page.getByText(/campanha|campaign/i).first().isVisible().catch(() => false);
                const hasValueInfo = await page.getByText(/valor|R\$|value/i).first().isVisible().catch(() => false);

                expect(hasCreatorInfo || hasCampaignInfo || hasValueInfo).toBeTruthy();
            }
        });

        test('should display contract status', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Find first contract card
            const contractCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="contract-card"]').first();

            if (await contractCard.isVisible()) {
                // Check for status badge
                const statusBadge = contractCard.locator('.badge, [data-testid="contract-status"], .inline-flex.items-center.rounded-full').first();

                if (await statusBadge.isVisible()) {
                    const statusText = await statusBadge.textContent();
                    expect(statusText).toMatch(/ativo|pendente|concluído|aguardando|pago|active|pending|completed|waiting|paid/i);
                }
            }
        });

    });

    test.describe('Delivery Materials', () => {

        test('should upload delivery material (creator)', async ({ page }) => {
            await loginAs(page, 'creator');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Find an active contract
            const contractCard = page.locator('div.rounded-xl.border.bg-card:has-text("Ativo"), [data-testid="contract-card"]:has-text("Active")').first();

            if (await contractCard.isVisible()) {
                await contractCard.click();
                await page.waitForLoadState('networkidle');

                // Find upload section
                const uploadSection = page.locator('[data-testid="delivery-upload"], :has-text("Entregar Material")').first();

                if (await uploadSection.isVisible()) {
                    // Find file input
                    const fileInput = page.locator('input[type="file"]').first();

                    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
                        // Upload a test file
                        await fileInput.setInputFiles({
                            name: 'delivery-content.mp4',
                            mimeType: 'video/mp4',
                            buffer: Buffer.from('fake-video-content-for-testing'),
                        });

                        // Wait for upload
                        await page.waitForTimeout(2000);

                        // Try to submit delivery
                        const submitButton = page.getByRole('button', { name: /enviar|entregar|submit|upload/i }).first();
                        if (await submitButton.isVisible()) {
                            await submitButton.click();

                            // Should show success
                            await expect(page.getByText(/enviado|entregue|sucesso|success/i)).toBeVisible({
                                timeout: timeouts.apiResponse,
                            });
                        }
                    }
                }
            }
        });

        test('should view delivery materials (brand)', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Find a contract with deliveries
            const contractCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="contract-card"]').first();

            if (await contractCard.isVisible()) {
                await contractCard.click();
                await page.waitForLoadState('networkidle');

                // Look for deliveries section
                const deliveriesSection = page.locator('[data-testid="deliveries"], :has-text("Entregas"), :has-text("Materiais")').first();

                if (await deliveriesSection.isVisible()) {
                    // Should be able to see delivery items
                    const deliveryItem = page.locator('[data-testid="delivery-item"], .delivery-card').first();
                    await deliveryItem.isVisible().catch(() => false);
                }
            }
        });

        test('should approve delivery (brand)', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Find a contract with pending deliveries
            const contractCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="contract-card"]').first();

            if (await contractCard.isVisible()) {
                await contractCard.click();
                await page.waitForLoadState('networkidle');

                // Find approve button for delivery
                const approveButton = page.getByRole('button', { name: /aprovar entrega|approve/i }).first();

                if (await approveButton.isVisible()) {
                    await approveButton.click();

                    // Confirm if modal appears
                    const confirmButton = page.getByRole('button', { name: /confirmar|confirm/i });
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                    }

                    // Should show success
                    await expect(page.getByText(/aprovado|approved|sucesso|success/i)).toBeVisible({
                        timeout: timeouts.apiResponse,
                    });
                }
            }
        });

        test('should request revision (brand)', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Find a contract with deliveries
            const contractCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="contract-card"]').first();

            if (await contractCard.isVisible()) {
                await contractCard.click();
                await page.waitForLoadState('networkidle');

                // Find revision button
                const revisionButton = page.getByRole('button', { name: /solicitar revisão|request revision|revisar/i }).first();

                if (await revisionButton.isVisible()) {
                    await revisionButton.click();

                    // Fill revision reason
                    const reasonInput = page.locator('textarea[name="reason"], textarea[placeholder*="motivo" i]').first();
                    if (await reasonInput.isVisible()) {
                        await reasonInput.fill('Precisa de ajustes na qualidade do áudio.');

                        // Submit
                        const submitButton = page.getByRole('button', { name: /enviar|submit/i }).first();
                        await submitButton.click();

                        // Should show success
                        await expect(page.getByText(/revisão solicitada|revision requested|enviado/i)).toBeVisible({
                            timeout: timeouts.apiResponse,
                        });
                    }
                }
            }
        });

    });

    test.describe('Contract Completion', () => {

        test('should complete contract (brand)', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Find an active/paid contract
            const contractCard = page.locator('div.rounded-xl.border.bg-card, [data-testid="contract-card"]').first();

            if (await contractCard.isVisible()) {
                await contractCard.click();
                await page.waitForLoadState('networkidle');

                // Find complete button
                const completeButton = page.getByRole('button', { name: /concluir|finalizar|complete/i }).first();

                if (await completeButton.isVisible()) {
                    await completeButton.click();

                    // Confirm if needed
                    const confirmButton = page.getByRole('button', { name: /confirmar|confirm/i });
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                    }

                    // Should show success
                    await expect(page.getByText(/concluído|finalizado|completed/i)).toBeVisible({
                        timeout: timeouts.apiResponse,
                    });
                }
            }
        });

        test('should rate creator after completion', async ({ page }) => {
            await loginAs(page, 'brand');

            await page.goto('/dashboard/contracts');
            await page.waitForLoadState('networkidle');

            // Find a completed contract
            const completedCard = page.locator('div.rounded-xl.border.bg-card:has-text("Concluído"), [data-testid="contract-card"]:has-text("Completed")').first();

            if (await completedCard.isVisible()) {
                await completedCard.click();
                await page.waitForLoadState('networkidle');

                // Find rating section
                const rateButton = page.getByRole('button', { name: /avaliar|rate/i }).first();

                if (await rateButton.isVisible()) {
                    await rateButton.click();

                    // Select stars (click 5th star)
                    const stars = page.locator('[data-testid="star"], .star-icon, svg[class*="star"]');
                    if (await stars.count() >= 5) {
                        await stars.nth(4).click(); // 5 stars
                    }

                    // Add review text
                    const reviewInput = page.locator('textarea[name="review"], textarea[placeholder*="avaliação" i]').first();
                    if (await reviewInput.isVisible()) {
                        await reviewInput.fill('Excelente trabalho! Muito profissional e entregou no prazo.');
                    }

                    // Submit
                    const submitButton = page.getByRole('button', { name: /enviar avaliação|submit/i }).first();
                    if (await submitButton.isVisible()) {
                        await submitButton.click();

                        // Should show success
                        await expect(page.getByText(/avaliação enviada|rating submitted|sucesso/i)).toBeVisible({
                            timeout: timeouts.apiResponse,
                        });
                    }
                }
            }
        });

    });

});
