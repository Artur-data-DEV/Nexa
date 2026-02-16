﻿import { expect, test, type Locator, type Page } from '@playwright/test'
import { testUsers, timeouts } from '../fixtures/test-data'

const NEXT_BUTTON_PATTERN = /Pr[o\u00F3]ximo/i
const PROD_BASE_URL = process.env.E2E_BASE_URL || 'https://www.nexacreators.com'

test.use({ baseURL: PROD_BASE_URL })

async function clickNext(page: Page): Promise<void> {
    await page.getByRole('button', { name: NEXT_BUTTON_PATTERN }).click()
}

async function loginForFlow(page: Page, userType: keyof typeof testUsers): Promise<void> {
    const credentials = testUsers[userType]
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            await page.goto('/login', { waitUntil: 'domcontentloaded' })

            if (/\/dashboard|\/admin/.test(page.url())) {
                return
            }

            const emailInput = page.locator('[data-testid="email-input"], input[name="email"], input[type="email"]').first()
            const passwordInput = page.locator('[data-testid="password-input"], input[name="password"], input[type="password"]').first()
            const loginButton = page.locator('[data-testid="login-button"], button:has-text("Entrar na plataforma"), button:has-text("Entrar"), button:has-text("Login")').first()

            await expect(emailInput).toBeVisible({ timeout: 20000 })
            await expect(passwordInput).toBeVisible({ timeout: 20000 })
            await expect(loginButton).toBeVisible({ timeout: 20000 })

            await emailInput.fill(credentials.email)
            await passwordInput.fill(credentials.password)
            await loginButton.click()

            const rateLimitMessage = page.getByText(/Muitas tentativas/i).first()
            if (await rateLimitMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
                await page.waitForTimeout(10000)
                continue
            }

            await expect(page).toHaveURL(/\/dashboard|\/admin/, { timeout: timeouts.pageLoad * 2 })
            return
        } catch (error) {
            lastError = error as Error
            if (attempt < maxRetries) {
                await page.waitForTimeout(2000)
            }
        }
    }

    throw lastError ?? new Error(`Failed to login as ${userType}`)
}

async function acceptTermsIfNeeded(page: Page): Promise<void> {
    const checkbox = page.locator('#terms')
    const acceptButton = page.getByRole('button', { name: /Aceitar e Continuar|Aceitar|Confirmar/i }).first()

    const isTermsVisible = await checkbox.isVisible({ timeout: 3000 }).catch(() => false)
    if (!isTermsVisible) return

    await checkbox.click()
    if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await acceptButton.click()
    }
}

async function openMilestonesDialog(page: Page, roomId: string): Promise<Locator> {
    if (!page.url().includes(`roomId=${roomId}`)) {
        await page.goto(`/dashboard/messages?roomId=${roomId}`, { waitUntil: 'domcontentloaded' })
    }

    const moreOptionsButton = page.locator('button:has(svg.lucide-more-vertical)').first()
    await expect(moreOptionsButton).toBeVisible({ timeout: timeouts.pageLoad })
    await moreOptionsButton.click()

    await page.getByRole('menuitem', { name: /Ver detalhes da campanha/i }).click()

    const dialog = page.getByRole('dialog').last()
    await expect(dialog).toBeVisible({ timeout: timeouts.pageLoad })

    const milestonesTab = dialog.getByRole('tab', { name: /Milestones/i })
    if (await milestonesTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await milestonesTab.click()
    }

    return dialog
}

async function expandMilestone(dialog: Locator, titlePattern: RegExp): Promise<void> {
    const milestoneTitle = dialog.getByText(titlePattern, { exact: false }).first()
    await expect(milestoneTitle).toBeVisible({ timeout: timeouts.pageLoad })
    await milestoneTitle.click()
}

async function uploadMilestoneFile(
    page: Page,
    dialog: Locator,
    uploadButtonLabelPattern: RegExp,
    fileName: string,
    mimeType: string
): Promise<void> {
    await dialog.getByRole('button', { name: uploadButtonLabelPattern }).first().click()
    await dialog.locator('input[type="file"]').first().setInputFiles({
        name: fileName,
        mimeType,
        buffer: Buffer.from(`file-${fileName}-${Date.now()}`),
    })
    await dialog.getByRole('button', { name: /^Enviar$/i }).first().click()
    await page.waitForTimeout(1000)
}

async function moderateMilestone(page: Page, dialog: Locator, action: 'approve' | 'reject'): Promise<void> {
    if ('approve' === action) {
        await dialog.getByRole('button', { name: /^Aprovar$/i }).first().click()
        await dialog.getByRole('button', { name: /Confirmar/i }).click()
    } else {
        await dialog.getByRole('button', { name: /^Rejeitar$/i }).first().click()
        await dialog.getByRole('button', { name: /^Rejeitar$/i }).last().click()
    }
    await page.waitForTimeout(1000)
}

test.describe('Campaign End-to-End Flow (Brand -> Admin -> Creator -> Brand)', () => {
    let campaignTitle = ''
    let campaignId = ''
    let roomId = ''

    test.beforeAll(() => {
        campaignTitle = `E2E Campaign ${Date.now()}`
    })

    test('Full Lifecycle: Create, Approve, Apply, Hire, Deliver', async ({ browser }) => {
        test.setTimeout(240000)

        const brandContext = await browser.newContext()
        const adminContext = await browser.newContext()
        const creatorContext = await browser.newContext()

        const brandPage = await brandContext.newPage()
        const adminPage = await adminContext.newPage()
        const creatorPage = await creatorContext.newPage()

        try {
            await test.step('Brand: Create Campaign', async () => {
                await loginForFlow(brandPage, 'brand')
                await brandPage.goto('/dashboard/campaigns/create', { waitUntil: 'domcontentloaded' })
                await acceptTermsIfNeeded(brandPage)

                const profileIncompleteTitle = brandPage.getByRole('heading', { name: /Perfil Incompleto/i })
                if (await profileIncompleteTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
                    test.skip(true, 'Brand profile is incomplete. Cannot create campaign in this environment.')
                }

                const productInput = brandPage.locator('input[placeholder*="Cosm"], input[placeholder*="produto"], input[placeholder^="Ex:"]').first()
                const objectiveInput = brandPage.locator('textarea[placeholder*="Aumentar reconhecimento"], textarea[placeholder*="UGC"], textarea').first()
                await expect(productInput).toBeVisible({ timeout: timeouts.pageLoad })
                await expect(objectiveInput).toBeVisible({ timeout: timeouts.pageLoad })
                await productInput.fill('Produto E2E Teste')
                await objectiveInput.fill('Objetivo E2E Teste')
                await clickNext(brandPage)

                const titleInput = brandPage.getByPlaceholder(/Campanha Ver/i).first()
                await expect(titleInput).toBeVisible({ timeout: timeouts.pageLoad })
                await titleInput.fill(campaignTitle)

                const campaignTypeSelect = brandPage.locator('select').first()
                await expect(campaignTypeSelect).toBeVisible({ timeout: timeouts.pageLoad })
                const optionCount = await campaignTypeSelect.locator('option').count()
                expect(optionCount, 'Campaign type select has no available options').toBeGreaterThan(1)
                await campaignTypeSelect.selectOption({ index: 1 })
                await clickNext(brandPage)

                await clickNext(brandPage)

                await brandPage.locator('label', { hasText: /UGC/i }).first().click()
                await brandPage.locator('label', { hasText: /Selecionar todos os estados/i }).first().click()
                await clickNext(brandPage)

                await brandPage.getByPlaceholder('800,00').fill('1500')
                await clickNext(brandPage)

                const futureDate = new Date()
                futureDate.setMonth(futureDate.getMonth() + 1)
                const dateStr = futureDate.toLocaleDateString('pt-BR')
                await brandPage.getByPlaceholder(/Selecione uma data/i).fill(dateStr)
                await brandPage.keyboard.press('Enter')
                await clickNext(brandPage)

                await brandPage.getByRole('button', { name: /Publicar Campanha/i }).click()
                await expect(brandPage.getByRole('heading', { name: /Campanha Criada/i })).toBeVisible({ timeout: timeouts.pageLoad })

                await brandPage.goto('/dashboard/campaigns', { waitUntil: 'domcontentloaded' })
                const searchInput = brandPage.getByPlaceholder(/Buscar campanhas/i).first()
                if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await searchInput.fill(campaignTitle)
                }

                const campaignCard = brandPage.locator('div.rounded-xl.border.bg-card', { hasText: campaignTitle }).first()
                await expect(campaignCard).toBeVisible({ timeout: timeouts.pageLoad })
                await campaignCard.getByRole('link', { name: /Ver Detalhes/i }).click()

                await brandPage.waitForURL(/\/dashboard\/campaigns\/\d+/, { timeout: timeouts.pageLoad })
                const match = brandPage.url().match(/\/dashboard\/campaigns\/(\d+)/)
                expect(match, 'Failed to parse campaign id from URL').toBeTruthy()
                campaignId = match?.[1] ?? ''
                expect(campaignId).not.toBe('')
            })

            await test.step('Admin: Approve Campaign', async () => {
                await loginForFlow(adminPage, 'admin')
                await adminPage.goto('/admin/campaigns/pending', { waitUntil: 'domcontentloaded' })

                const campaignCard = adminPage.locator('div.rounded-xl.border.bg-card', { hasText: campaignTitle }).first()
                await expect(campaignCard).toBeVisible({ timeout: timeouts.pageLoad })
                await campaignCard.getByRole('button', { name: /Aprovar/i }).click()
                await expect(campaignCard).toBeHidden({ timeout: 20000 })
            })

            await test.step('Creator: Apply to Campaign', async () => {
                await loginForFlow(creatorPage, 'creator')
                await creatorPage.goto(`/dashboard/campaigns/${campaignId}`, { waitUntil: 'domcontentloaded' })
                await expect(creatorPage.getByText(campaignTitle).first()).toBeVisible({ timeout: timeouts.pageLoad })

                const applyButton = creatorPage.getByRole('button', { name: /Candidatar-se/i }).first()
                await expect(applyButton).toBeVisible({ timeout: timeouts.pageLoad })
                await applyButton.click()
                await acceptTermsIfNeeded(creatorPage)

                const proposalDialog = creatorPage.getByRole('dialog').filter({ hasText: /Nova Proposta/i }).first()
                if (!(await proposalDialog.isVisible({ timeout: 5000 }).catch(() => false))) {
                    await applyButton.click()
                }
                await expect(proposalDialog).toBeVisible({ timeout: timeouts.pageLoad })

                await proposalDialog.locator('textarea').first().fill('Proposta E2E: entrega completa e dentro do prazo.')

                const numberInputs = proposalDialog.locator('input[type="number"]')
                await numberInputs.nth(0).fill('1500')
                await numberInputs.nth(1).fill('7')
                await proposalDialog.getByRole('button', { name: NEXT_BUTTON_PATTERN }).click()

                const portfolioInput = proposalDialog.getByPlaceholder('https://...').first()
                await expect(portfolioInput).toBeVisible({ timeout: timeouts.pageLoad })
                const portfolioUrl = `https://nexa-e2e.example/${Date.now()}`
                await portfolioInput.fill(portfolioUrl)
                await portfolioInput.locator('xpath=following-sibling::button').click()

                await proposalDialog.getByRole('button', { name: /Enviar Proposta/i }).click()
                await expect(proposalDialog).toBeHidden({ timeout: timeouts.pageLoad * 2 })
            })

            await test.step('Brand: Hire Creator', async () => {
                await brandPage.goto(`/dashboard/campaigns/${campaignId}/manage`, { waitUntil: 'domcontentloaded' })
                await expect(brandPage.getByRole('heading', { name: /Gerenciar Candidatos/i })).toBeVisible({ timeout: timeouts.pageLoad })

                const approveButton = brandPage.locator('table').first().getByRole('button', { name: /^Aprovar$/i }).first()
                await expect(approveButton).toBeVisible({ timeout: timeouts.pageLoad })
                await approveButton.click()
                await acceptTermsIfNeeded(brandPage)

                await expect(brandPage).toHaveURL(/\/dashboard\/messages\?roomId=/, { timeout: timeouts.pageLoad * 2 })
                const maybeRoomId = new URL(brandPage.url()).searchParams.get('roomId')
                expect(maybeRoomId).toBeTruthy()
                roomId = maybeRoomId ?? ''
            })

            await test.step('Milestone Workflow', async () => {
                const creatorDialog = await openMilestonesDialog(creatorPage, roomId)
                await expandMilestone(creatorDialog, /Envio do Roteiro/i)
                await uploadMilestoneFile(creatorPage, creatorDialog, /Enviar Script|Substituir Script|Enviar Arquivo/i, 'script.pdf', 'application/pdf')
                await creatorPage.keyboard.press('Escape')

                const brandDialogScript = await openMilestonesDialog(brandPage, roomId)
                await expandMilestone(brandDialogScript, /Envio do Roteiro/i)
                await moderateMilestone(brandPage, brandDialogScript, 'approve')
                await brandPage.keyboard.press('Escape')

                const creatorDialogVideo = await openMilestonesDialog(creatorPage, roomId)
                await expandMilestone(creatorDialogVideo, /Envio.*V[i\u00ED]deo/i)
                await uploadMilestoneFile(creatorPage, creatorDialogVideo, /Enviar Arquivo|Substituir Arquivo/i, 'video.mp4', 'video/mp4')
                await creatorPage.keyboard.press('Escape')

                const brandDialogVideo = await openMilestonesDialog(brandPage, roomId)
                await expandMilestone(brandDialogVideo, /Envio.*V[i\u00ED]deo/i)
                await moderateMilestone(brandPage, brandDialogVideo, 'approve')
                await brandPage.keyboard.press('Escape')
                await expect(brandDialogVideo.getByText(/Aprovado/i).first()).toBeVisible({ timeout: timeouts.pageLoad })
            })
        } finally {
            await Promise.allSettled([
                brandContext.close(),
                adminContext.close(),
                creatorContext.close(),
            ])
        }
    })
})
