import { expect, test, type Page } from '@playwright/test'
import { testUsers } from '../fixtures/test-data'

const CAMPAIGN_ID = 1
const BACKEND_API = 'http://localhost:8000/api'

async function loginViaApi(page: Page, userType: 'brand' | 'creator'): Promise<void> {
    const credentials = testUsers[userType]
    const response = await page.request.post(`${BACKEND_API}/login`, {
        data: {
            email: credentials.email,
            password: credentials.password,
        },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json() as { success?: boolean; token?: string }
    expect(data.success).toBeTruthy()
    expect(data.token).toBeTruthy()

    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.evaluate((token: string) => {
        sessionStorage.setItem('auth_token', token)
    }, data.token as string)

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
        } catch {
            // Retry on transient dev-server aborts during navigation/HMR.
        }

        if (/\/dashboard/.test(page.url())) {
            return
        }

        await page.waitForTimeout(1000)
    }

    throw new Error(`Failed to establish authenticated dashboard session for ${userType}`)
}

async function acceptTermsIfNeeded(page: Page): Promise<void> {
    const acceptButton = page.getByRole('button', { name: 'Aceitar e Continuar' })
    const checkbox = page.locator('#terms')

    if (await acceptButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await checkbox.click()
        await acceptButton.click()
    }
}

async function openMilestonesDialog(page: Page, roomId: string) {
    await page.goto(`/dashboard/messages?roomId=${roomId}`)
    await page.waitForLoadState('domcontentloaded')

    await page.locator('button:has(svg.lucide-more-vertical)').first().click()
    await page.getByRole('menuitem', { name: /Ver detalhes da campanha/i }).click()

    const dialog = page.getByRole('dialog').last()
    await expect(dialog).toBeVisible()

    const milestonesTab = dialog.getByRole('tab', { name: 'Milestones' })
    if (await milestonesTab.isVisible().catch(() => false)) {
        await milestonesTab.click()
    }

    return dialog
}

async function expandMilestone(dialog: ReturnType<Page['getByRole']>, title: string): Promise<void> {
    const milestoneTitle = dialog.getByText(title, { exact: false }).first()
    await expect(milestoneTitle).toBeVisible()
    await milestoneTitle.click()
}

async function uploadMilestoneFile(dialog: ReturnType<Page['getByRole']>, uploadButtonLabel: string, fileName: string): Promise<void> {
    await dialog.getByRole('button', { name: uploadButtonLabel }).click()
    await dialog.locator('input[type="file"]').setInputFiles({
        name: fileName,
        mimeType: 'application/pdf',
        buffer: Buffer.from(`file-${fileName}-${Date.now()}`),
    })
    await dialog.getByRole('button', { name: 'Enviar' }).click()
}

async function moderateMilestone(dialog: ReturnType<Page['getByRole']>, action: 'approve' | 'reject'): Promise<void> {
    if ('approve' === action) {
        await dialog.getByRole('button', { name: /^Aprovar$/ }).first().click()
        await dialog.getByRole('button', { name: 'Confirmar' }).click()
    } else {
        await dialog.getByRole('button', { name: /^Rejeitar$/ }).first().click()
        await dialog.getByRole('button', { name: /^Rejeitar$/ }).last().click()
    }
}

test.describe('Milestone Sync End-to-End', () => {
    test('should keep modal/buttons in sync across approve -> reject -> reupload -> approve flow', async ({ browser }) => {
        const brandContext = await browser.newContext()
        const creatorContext = await browser.newContext()
        const brandPage = await brandContext.newPage()
        const creatorPage = await creatorContext.newPage()

        try {
            await loginViaApi(brandPage, 'brand')
            await brandPage.goto(`/dashboard/campaigns/${CAMPAIGN_ID}/manage`)
            await brandPage.waitForLoadState('domcontentloaded')
            await expect(brandPage.getByRole('heading', { name: /Gerenciar Candidatos/i })).toBeVisible()

            const approveResponsePromise = brandPage.waitForResponse((response) =>
                /\/api\/applications\/\d+\/approve$/.test(response.url()) &&
                response.request().method() === 'POST'
            )

            await brandPage.locator('table').first().getByRole('button', { name: /^Aprovar$/ }).first().click()
            await acceptTermsIfNeeded(brandPage)
            const approveResponse = await approveResponsePromise
            expect(approveResponse.ok()).toBeTruthy()

            await expect(brandPage).toHaveURL(/dashboard\/messages\?roomId=/)
            const roomId = new URL(brandPage.url()).searchParams.get('roomId')
            expect(roomId).toBeTruthy()
            if (!roomId) throw new Error('roomId not found after approval')

            await loginViaApi(creatorPage, 'creator')

            const creatorDialogV1 = await openMilestonesDialog(creatorPage, roomId)
            await expandMilestone(creatorDialogV1, 'Envio do Roteiro')
            await uploadMilestoneFile(creatorDialogV1, 'Enviar Script', 'script-v1.pdf')

            const brandDialogReject = await openMilestonesDialog(brandPage, roomId)
            await expandMilestone(brandDialogReject, 'Envio do Roteiro')
            await expect(brandDialogReject.getByRole('button', { name: 'Aprovar' }).first()).toBeVisible()
            await expect(brandDialogReject.getByRole('button', { name: 'Rejeitar' }).first()).toBeVisible()
            await moderateMilestone(brandDialogReject, 'reject')

            const creatorDialogAfterReject = await openMilestonesDialog(creatorPage, roomId)
            await expandMilestone(creatorDialogAfterReject, 'Envio do Roteiro')
            await expect(creatorDialogAfterReject.getByRole('button', { name: 'Enviar Script' })).toBeVisible()
            await uploadMilestoneFile(creatorDialogAfterReject, 'Enviar Script', 'script-v2.pdf')

            const brandDialogApproveScript = await openMilestonesDialog(brandPage, roomId)
            await expandMilestone(brandDialogApproveScript, 'Envio do Roteiro')
            await moderateMilestone(brandDialogApproveScript, 'approve')

            const brandDialogApproveScriptGate = await openMilestonesDialog(brandPage, roomId)
            await expandMilestone(brandDialogApproveScriptGate, 'Aprovação do Roteiro')
            await moderateMilestone(brandDialogApproveScriptGate, 'approve')

            const creatorDialogVideo = await openMilestonesDialog(creatorPage, roomId)
            await expandMilestone(creatorDialogVideo, 'Envio de Imagem e Vídeo')
            await expect(creatorDialogVideo.getByRole('button', { name: 'Enviar Arquivo' })).toBeVisible()
            await uploadMilestoneFile(creatorDialogVideo, 'Enviar Arquivo', 'video-v1.pdf')

            const brandDialogApproveVideo = await openMilestonesDialog(brandPage, roomId)
            await expandMilestone(brandDialogApproveVideo, 'Envio de Imagem e Vídeo')
            await moderateMilestone(brandDialogApproveVideo, 'approve')

            const brandDialogFinalApproval = await openMilestonesDialog(brandPage, roomId)
            await expandMilestone(brandDialogFinalApproval, 'Aprovação Final')
            await moderateMilestone(brandDialogFinalApproval, 'approve')

            await expect(brandDialogFinalApproval.getByText(/Aprovado/i).first()).toBeVisible()
        } finally {
            await brandContext.close()
            await creatorContext.close()
        }
    })
})
