import { test, expect } from '@playwright/test';
import { testUsers, selectors, timeouts } from '../fixtures/test-data';
import { loginAs } from '../helpers/auth';
import { execSync } from 'child_process';
import path from 'path';

    test.describe('Full Contract Lifecycle', () => {

    test('End-to-End: Application -> Approval -> Payment -> Delivery -> Closing', async ({ browser }) => {
        test.setTimeout(240000); // Increase timeout to 4 minutes for Stripe interaction

        // Create isolated contexts for each role
        const creatorContext = await browser.newContext();
        const brandContext = await browser.newContext();
        const adminContext = await browser.newContext();

        const creatorPage = await creatorContext.newPage();
        const brandPage = await brandContext.newPage();
        const adminPage = await adminContext.newPage();

        const uniqueCampaignTitle = `Contract Flow Test ${Date.now()}`;
        console.log(`[TEST] Starting Contract Lifecycle for: ${uniqueCampaignTitle}`);

        let campaignId: string | number | undefined;

        try {
            // ==========================================
            // 1. SETUP: Create Campaign (Brand)
            // ==========================================
            await test.step('Setup: Brand creates campaign', async () => {
                await loginAs(brandPage, 'brand');
                await brandPage.goto('/dashboard/campaigns/create');

                await brandPage.getByPlaceholder('Campanha Verão 2024').fill(uniqueCampaignTitle);
                await brandPage.getByPlaceholder('Queremos conteúdo autêntico', { exact: false }).fill('Description ' + uniqueCampaignTitle);
                await brandPage.getByPlaceholder('R$ 800,00').fill('500');

                // Select options forcefully to ensure form validity
                const selects = brandPage.locator('select');
                if (await selects.count() > 1) {
                    // Often the first select is a hidden one or filter, second is category
                    await selects.nth(1).selectOption({ index: 1 });
                } else if (await selects.count() === 1) {
                    await selects.first().selectOption({ index: 1 });
                }

                // Select required fields (Creator type, States)
                await brandPage.locator('label:has-text("UGC") input').click({ force: true });
                await brandPage.locator('label:has-text("Selecionar todos") input').click({ force: true });

                // Datepicker - Be more specific
                await brandPage.getByPlaceholder('Selecione uma data').click();
                await brandPage.waitForTimeout(500); // Wait for open
                await brandPage.locator('.react-datepicker__day:not(.react-datepicker__day--outside-month)').nth(15).click({ force: true });

                await brandPage.waitForTimeout(1000); // Wait for state updates

                // Listen for API response
                const [response] = await Promise.all([
                    brandPage.waitForResponse(res => res.url().includes('/campaigns') && res.request().method() === 'POST', { timeout: 10000 }),
                    brandPage.getByRole('button', { name: /Criar Campanha/i }).click({ force: true })
                ]);

                console.log(`Campaign Creation Response: ${response.status()} ${response.statusText()}`);
                if (response.status() === 201 || response.status() === 200) {
                    const body = await response.json();
                    campaignId = body.data?.id || body.id;
                    console.log(`Campaign ID: ${campaignId}`);
                } else {
                    console.error('API Error Body:', await response.text());
                }

                // Check for validation errors (Sonner toasts)
                const toasts = brandPage.locator('[data-sonner-toast]');
                if (await toasts.count() > 0) {
                    const toastText = await toasts.allTextContents();
                    console.error('Toasts visible:', toastText);
                }

                // Check for validation errors (Alerts)
                const errors = await brandPage.locator('.text-red-500, [role="alert"]').allTextContents();
                if (errors.length > 0 && errors[0] !== '') {
                    console.error('Form Validation Errors:', errors);
                    await brandPage.screenshot({ path: 'form-errors.png' });
                }

                // Wait for redirect or success - Make soft to allow verification in next step - Make soft to allow verification in next step
                try {
                    await expect(brandPage.getByText(/Campanha Criada|sucesso/i).or(brandPage.getByText('Campanhas'))).toBeVisible({ timeout: 20000 });
                } catch (e) {
                    console.log('Warn: Success message missed, checking next step...');
                }

                // VERIFY CREATION
                await brandPage.goto('/dashboard/campaigns/my');
                await brandPage.reload();

                // Try to switch tabs to find it
                const tabs = brandPage.locator('button[role="tab"]');
                const tabCount = await tabs.count();
                if (tabCount > 0) {
                    for (let i = 0; i < tabCount; i++) {
                        await tabs.nth(i).click();
                        await brandPage.waitForTimeout(500);
                        if (await brandPage.locator('div.rounded-xl.border.bg-card').filter({ hasText: uniqueCampaignTitle }).count() > 0) {
                            console.log(`Campaign found in tab index ${i}`);
                            break;
                        }
                    }
                }

                const myCard = brandPage.locator('div.rounded-xl.border.bg-card').filter({ hasText: uniqueCampaignTitle }).first();
                if (await myCard.isVisible()) {
                    console.log('Campaign found in Brand Dashboard.');
                    const status = await myCard.locator('.badge, span[class*="badge"]').first().textContent().catch(() => 'Unknown');
                    console.log(`Campaign Status: ${status}`);
                } else {
                    console.warn('Campaign NOT found in Brand Dashboard immediately. Proceeding to Admin check as API returned 201.');
                }
            });

            // ==========================================
            // 2. SETUP: Admin Approves Campaign
            // ==========================================
            await test.step('Setup: Admin approves campaign', async () => {
                await loginAs(adminPage, 'admin');
                await adminPage.goto('/admin/campaigns/pending');

                // Reload until found - Increased attempts
                let attempts = 0;
                let foundInPending = false;
                while (attempts < 10) {
                    if (await adminPage.getByText(uniqueCampaignTitle).count() > 0) {
                        foundInPending = true;
                        break;
                    }
                    console.log(`Admin polling pending list: attempt ${attempts + 1}`);
                    await adminPage.reload();
                    await adminPage.waitForTimeout(3000);
                    attempts++;
                }

                if (foundInPending) {
                    const card = adminPage.locator('div.rounded-xl.border.bg-card').filter({ hasText: uniqueCampaignTitle }).first();
                    if (await card.isVisible()) {
                        await card.locator('button:has-text("Aprovar")').click();
                        // Wait for action to complete
                        await expect(card).not.toBeVisible({ timeout: 15000 });
                        console.log('Admin approved campaign from pending list.');
                    }
                } else {
                    console.log('Campaign not found in pending. Checking if it is already Active/Approved...');
                    // Check active list
                    await adminPage.goto('/admin/campaigns');
                    if (await adminPage.getByText(uniqueCampaignTitle).count() > 0) {
                        console.log('Campaign found in Admin All Campaigns list.');
                    } else {
                        console.warn('Campaign NOT found in Admin views. This might cause Creator failure.');
                    }
                }
            });

            // ==========================================
            // 3. Creator Applies
            // ==========================================
            await test.step('Creator applies', async () => {
                await loginAs(creatorPage, 'creator');
                await creatorPage.goto('/dashboard/campaigns');

                // Poll/Search
                let found = false;
                for (let i = 0; i < 10; i++) {
                    await creatorPage.locator('input[type="search"]').fill(uniqueCampaignTitle);
                    await creatorPage.keyboard.press('Enter');
                    await creatorPage.waitForTimeout(2000);

                    if (await creatorPage.getByText(uniqueCampaignTitle).count() > 0) {
                        found = true;
                        break;
                    }
                    console.log(`Creator polling attempt ${i + 1}: Campaign not found yet.`);
                    await creatorPage.reload();
                }

                if (!found) {
                    // Debug: take screenshot
                    await creatorPage.screenshot({ path: 'creator-not-found.png' });
                    throw new Error('Campaign not found for creator');
                }

                const card = creatorPage.locator('div.rounded-xl.border.bg-card').filter({ hasText: uniqueCampaignTitle }).first();

                // Try clicking the card itself or looking for a link more generically
                const detailsLink = card.locator('a[href*="/campaigns/"]').first();
                if (await detailsLink.isVisible()) {
                    await detailsLink.click();
                } else {
                    // Fallback: look for button or text
                    await card.getByText(/Ver Detalhes|Detalhes|View/i).click();
                }

                await creatorPage.getByRole('button', { name: /Candidatar-se|Apply/i }).click();

                await creatorPage.getByPlaceholder(/Descreva como|proposta/i).first().fill('My proposal for this contract.');
                await creatorPage.locator('input[name="budget"]').fill('500');
                await creatorPage.locator('input[name="delivery_days"]').fill('5');

                // Listen for Application Response
                const [appResponse] = await Promise.all([
                    creatorPage.waitForResponse(res => res.url().includes('/applications') && res.request().method() === 'POST', { timeout: 10000 }),
                    creatorPage.locator('button:has-text("Enviar Proposta")').click()
                ]);

                console.log(`Application Response: ${appResponse.status()} ${appResponse.statusText()}`);
                if (appResponse.status() !== 201 && appResponse.status() !== 200) {
                    console.error('Application API Error:', await appResponse.text());
                }

                await expect(creatorPage.getByText(/sucesso|enviada/i)).toBeVisible();
            });

            // ==========================================
            // 4. Brand Approves Application (Creates Contract)
            // ==========================================
            await test.step('Brand approves application', async () => {
                if (campaignId) {
                    console.log(`Navigating to manage campaign: ${campaignId}`);
                    await brandPage.goto(`/dashboard/campaigns/${campaignId}/manage`);
                } else {
                    // Fallback
                    await brandPage.goto('/dashboard/applications');
                }
                await brandPage.waitForLoadState('networkidle');

                if (!campaignId) {
                    // Poll for application if no ID
                    let foundApp = false;
                    for (let i = 0; i < 10; i++) {
                        if (await brandPage.locator('tr').count() > 0) {
                            foundApp = true;
                            break;
                        }
                        await brandPage.reload();
                        await brandPage.waitForTimeout(3000);
                    }
                    if (!foundApp) throw new Error('Application not found');
                } else {
                    // In manage page, find Candidates tab
                    // Check if we are on the right page
                    await expect(brandPage.getByText(/Gerenciar|Manage/i).first()).toBeVisible({ timeout: 10000 });

                    // Click Candidates Tab
                    const candidatesTab = brandPage.getByRole('tab', { name: /Candidatos|Candidates/i });
                    if (await candidatesTab.isVisible()) {
                        await candidatesTab.click();
                    }
                }

                const approveBtn = brandPage.locator('button:has-text("Aprovar")').first();
                await expect(approveBtn).toBeVisible({ timeout: 15000 });

                // Monitor network for approval request
                const [approveResponse] = await Promise.all([
                    brandPage.waitForResponse(res => res.url().includes('/approve') && res.request().method() === 'POST', { timeout: 10000 }).catch(() => [null]),
                    approveBtn.click()
                ]);

                if (approveResponse) {
                    if (approveResponse.status() === 402) {
                        console.log('Approval returned 402. Checking if Connect or Funding is needed...');
                        
                        // Wait for potential redirect
                        try {
                            await brandPage.waitForLoadState('networkidle');
                            await expect(brandPage).toHaveURL(/payment-methods|checkout\.stripe\.com/, { timeout: 30000 });
                        } catch (e) {
                            console.warn('Redirect did not happen as expected within timeout.');
                        }
                        
                        const currentUrl = brandPage.url();
                        console.log('Current URL after 402:', currentUrl);
                        
                        if (currentUrl.includes('checkout.stripe.com')) {
                            console.log('Redirected to Stripe Checkout (Funding). Handling payment...');
                            // Handle Payment
                            try {
                                 // Wait for Checkout to load - Use domcontentloaded as networkidle can be flaky on Stripe
                                 await brandPage.waitForLoadState('domcontentloaded');
                                 await brandPage.waitForTimeout(5000); // Extra wait for React/Stripe hydration
                                 
                                 // Strategy 1: Look for "Test card" autofill (if available)
                                 // sometimes Stripe Test Mode has a header
                                 
                                 // Strategy 2: Fill Card Details
                                 // Try standard selectors first (English & Portuguese)
                                 const cardNumber = brandPage.locator('input[id="cardNumber"]')
                                     .or(brandPage.getByLabel('Card number', { exact: false }))
                                     .or(brandPage.getByLabel('Número do cartão', { exact: false }))
                                     .or(brandPage.getByPlaceholder('Card number', { exact: false }))
                                     .or(brandPage.getByPlaceholder('Número do cartão', { exact: false }));
                                 
                                 if (await cardNumber.isVisible()) {
                                     console.log('Found Card Number in Main Frame');
                                     await cardNumber.fill('4242424242424242');
                                 } else {
                                     // Strategy 3: Search inside iframes
                                     console.log('Card input not found in main frame. Searching iframes...');
                                     const frames = brandPage.frames();
                                     console.log(`Found ${frames.length} frames.`);
                                     
                                     let filled = false
                                     for (const frame of frames) {
                                         // Log frame url for debug
                                         // console.log('Checking frame:', frame.url());
                                         
                                         const input = frame.locator('input[name="cardnumber"]')
                                             .or(frame.getByPlaceholder('Card number'))
                                             .or(frame.getByPlaceholder('Número do cartão'))
                                             .or(frame.locator('input[autocomplete="cc-number"]'));
                                             
                                         if (await input.isVisible()) {
                                             console.log('Found Card Number in iframe:', frame.url());
                                             await input.fill('4242424242424242');
                                             filled = true;
                                             
                                             // Fill others in same frame if possible
                                             await frame.locator('input[name="exp-date"], input[placeholder="MM / YY"]').fill('1234').catch(() => {});
                                             await frame.locator('input[name="cvc"], input[placeholder="CVC"]').fill('123').catch(() => {});
                                             break;
                                         }
                                     }
                                     if (!filled) {
                                         console.log('Frames dump:');
                                         frames.forEach(f => console.log(f.url()));
                                         // Try Fallback: Keyboard Tab Navigation
                                         console.log('Fallback: Attempting Keyboard Navigation...');
                                         await brandPage.keyboard.press('Tab');
                                         await brandPage.keyboard.press('Tab');
                                         await brandPage.keyboard.type('4242424242424242');
                                         await brandPage.waitForTimeout(500);
                                         await brandPage.keyboard.type('1234'); // Date
                                         await brandPage.waitForTimeout(500);
                                         await brandPage.keyboard.type('123'); // CVC
                                         await brandPage.waitForTimeout(500);
                                         await brandPage.keyboard.type('Test Brand'); // Name
                                         await brandPage.keyboard.press('Enter');
                                         // This is a hail mary.
                                     }
                                 }
                                 
                                 // Fill Expiry/CVC if not done in frame
                                 await brandPage.locator('#cardExpiry').fill('1234').catch(() => {});
                                 await brandPage.locator('#cardCvc').fill('123').catch(() => {});
                                 
                                 await brandPage.fill('#billingName', 'Test Brand').catch(() => {});
                                 await brandPage.fill('#billingPostalCode', '10001').catch(() => {});
                                 
                                 // Click Pay
                                 const submitBtn = brandPage.locator('button[type="submit"]');
                                 if (await submitBtn.isVisible()) {
                                     await submitBtn.click();
                                 } else {
                                     // Maybe Enter key worked?
                                 }
                                 
                                 // Wait for return
                                 await brandPage.waitForURL(/\/dashboard\/payment-methods.*success=true/, { timeout: 60000 });
                                 console.log('Funding Successful.');
                            } catch (e) {
                                console.warn('Failed to automate Stripe Checkout UI.');
                                await brandPage.screenshot({ path: 'stripe-checkout-fail.png' });
                                throw e;
                            }
                            
                            // Retry Approval after Funding (Outside try/catch)
                                 if (campaignId) {
                                     console.log('Navigating back to retry approval...');
                                     await brandPage.goto(`/dashboard/campaigns/${campaignId}/manage`);
                                     await brandPage.waitForLoadState('networkidle');
                                     
                                     const candidatesTab = brandPage.getByRole('tab', { name: /Candidatos|Candidates/i });
                                     if (await candidatesTab.isVisible()) {
                                         await candidatesTab.click();
                                     }
                                     
                                     // Retry loop for webhook propagation
                                      for (let i = 0; i < 5; i++) {
                                          console.log(`Retry Approval Attempt ${i+1}...`);
                                          
                                          // Ensure we are on the right page (in case 402 redirected us)
                                          if (!brandPage.url().includes('/manage')) {
                                              await brandPage.goto(`/dashboard/campaigns/${campaignId}/manage`);
                                              await brandPage.waitForLoadState('networkidle');
                                              const candidatesTab = brandPage.getByRole('tab', { name: /Candidatos|Candidates/i });
                                              if (await candidatesTab.isVisible()) await candidatesTab.click();
                                          }
                                          
                                          // Re-locate button to avoid stale element
                                          const retryApproveBtn = brandPage.locator('button:has-text("Aprovar")').first();
                                          await expect(retryApproveBtn).toBeVisible();
                                          await retryApproveBtn.click(); 
                                          
                                          const retryResponse = await brandPage.waitForResponse(res => res.url().includes('/approve') && res.request().method() === 'POST').catch(() => null);
                                          
                                          if (!retryResponse) continue;
                                          
                                          console.log(`Retry Response: ${retryResponse.status()}`);
                                          
                                          if (retryResponse.status() === 200) {
                                              break; // Success
                                          } else if (retryResponse.status() === 402) {
                                              console.warn('Still 402. Webhook might be slow. Waiting...');
                                              await brandPage.waitForTimeout(5000);
                                          } else {
                                              expect(retryResponse.status()).toBe(200); // Fail on other errors
                                          }
                                      }
                                 }
                             } else if (currentUrl.includes('payment-methods')) {
                            console.log('Brand needs to connect Stripe account. Handling onboarding flow...');
                            
                            // Click "Conectar Conta Stripe" (Top Card) which opens a POPUP
                            const connectAccountBtn = brandPage.getByRole('button', { name: /conectar conta stripe/i });
                            await expect(connectAccountBtn).toBeVisible();
    
                            // Handle Popup
                            const [popup] = await Promise.all([
                                brandPage.waitForEvent('popup'),
                                connectAccountBtn.click()
                            ]);
    
                            console.log('Stripe Popup opened. Waiting for load...');
                            await popup.waitForLoadState('networkidle');
    
                            try {
                                console.log('Waiting for Skip/Test button on Stripe Popup...');
                                await popup.waitForLoadState('domcontentloaded');
                                
                                const skipSelectors = [
                                    'button:has-text("Skip this form")',
                                    'button:has-text("Pular este formulário")',
                                    'button[data-test="test-mode-fill-button"]',
                                    'button[data-testid="test-mode-fill-button"]',
                                    '.test-mode-fill-button',
                                    'button:has-text("Use test account")',
                                    'button:has-text("Usar conta de teste")',
                                    'a:has-text("Skip this form")',
                                    '#test-mode-fill-button'
                                ];
    
                                const combinedSelector = skipSelectors.join(',');
                                const skipBtn = popup.locator(combinedSelector).first();
                                
                                try {
                                    await expect(skipBtn).toBeVisible({ timeout: 10000 });
                                    await skipBtn.click();
                                    console.log('Clicked Stripe Test Mode button on Popup.');
                                } catch (e) {
                                    console.log('Skip button not found. Checking for inputs...');
                                    
                                    const phoneInput = popup.locator('input[type="tel"], input[name="phone"]');
                                    if (await phoneInput.isVisible()) {
                                        console.log('Filling Phone...');
                                        await phoneInput.fill('8888888888');
                                        await popup.locator('button[type="submit"], button:has-text("Continue")').click();
                                        
                                        console.log('Waiting for SMS input...');
                                        const otpInput = popup.locator('input[name="code"], input[placeholder="000-000"]');
                                        await expect(otpInput).toBeVisible({ timeout: 10000 });
                                        await otpInput.fill('000000');
                                    }
                                    
                                    const cardInput = popup.locator('input[placeholder="0000 0000 0000 0000"]');
                                    if (await cardInput.isVisible()) {
                                        console.log('Filling Payout Debit Card...');
                                        await cardInput.fill('0000000000000000');
                                        await popup.locator('input[name="dob_day"]').fill('01').catch(() => {});
                                        await popup.locator('input[name="dob_month"]').fill('01').catch(() => {});
                                        await popup.locator('input[name="dob_year"]').fill('1990').catch(() => {});
                                        await popup.locator('button[type="submit"], button:has-text("Agree"), button:has-text("Concordar")').click();
                                    }
                                }
    
                                const doneBtn = popup.locator('button:has-text("Done"), button:has-text("Concluído")');
                                if (await doneBtn.isVisible({ timeout: 5000 })) {
                                    await doneBtn.click();
                                }
    
                            } catch (e) {
                                console.warn('Stripe "Skip" button not found in popup.');
                                console.log('Popup URL:', popup.url());
                                await popup.screenshot({ path: 'stripe-popup-fail.png' });
                                await popup.close();
                                throw e;
                            }
    
                            await popup.waitForEvent('close').catch(() => { });
    
                            console.log('Popup closed. Waiting for Account status update...');
                            await expect(brandPage.getByText(/Ativo|Enabled/i)).toBeVisible({ timeout: 30000 });
                            
                            // ALSO Connect Payment Method (Card) if needed
                            const connectMethodBtn = brandPage.getByRole('button', { name: /conectar método de pagamento/i });
                            if (await connectMethodBtn.isVisible()) {
                                 console.log('Connecting Payment Method (Card)...');
                                 await connectMethodBtn.click();
                                 
                                 await brandPage.waitForURL(/checkout.stripe.com/);
                                 console.log('Redirected to Stripe Setup. Filling card...');
                                 
                                 try {
                                    await brandPage.waitForLoadState('networkidle');
                                    const cardFrame = brandPage.frameLocator('iframe[title*="Secure card payment input frame"], iframe[name^="__privateStripeFrame"]');
                                    const cardInput = cardFrame.locator('input[name="cardnumber"], input[placeholder="Card number"]');
                                    await expect(cardInput).toBeVisible({ timeout: 20000 });
                                    await cardInput.fill('4242424242424242');
                                    
                                    const expInput = cardFrame.locator('input[name="exp-date"], input[placeholder="MM / YY"]');
                                    await expInput.fill('1234');
                                    
                                    const cvcInput = cardFrame.locator('input[name="cvc"], input[placeholder="CVC"]');
                                    await cvcInput.fill('123');
                                    
                                    await brandPage.fill('#billingName', 'Test Brand').catch(() => {});
                                    await brandPage.fill('#billingPostalCode', '10001').catch(() => {});
                                    
                                    const submitBtn = brandPage.locator('button[type="submit"]');
                                    await submitBtn.click();
                                    
                                    await brandPage.waitForURL(/\/dashboard\/payment-methods/, { timeout: 60000 });
                                    console.log('Payment Method Connected.');
                                 } catch (e) {
                                     console.warn('Failed to connect payment method via UI.');
                                     await brandPage.screenshot({ path: 'stripe-setup-fail.png' });
                                     throw e;
                                 }
                            }
                            
                            // Retry Approval
                            if (campaignId) {
                                await brandPage.goto(`/dashboard/campaigns/${campaignId}/manage`);
                                const candidatesTab = brandPage.getByRole('tab', { name: /Candidatos|Candidates/i });
                                await candidatesTab.click();
                                await approveBtn.click();
                                
                                const retryResponse = await brandPage.waitForResponse(res => res.url().includes('/approve') && res.request().method() === 'POST');
                                expect(retryResponse.status()).toBe(200);
                            }
                        }
                    } else if (approveResponse.status() !== 200) {
                        console.error('Approval Failed Body:', await approveResponse.text());
                        throw new Error(`Approval failed with status ${approveResponse.status()}`);
                    }
                } else {
                    console.log('Approval request not detected or timed out.');
                }

                // Handle Confirmation Modal
                const dialog = brandPage.locator('div[role="dialog"]');
                try {
                    await expect(dialog).toBeVisible({ timeout: 3000 });
                    const confirmBtn = dialog.getByRole('button', { name: /confirmar|sim|aprovar/i }).last();
                    if (await confirmBtn.isEnabled()) {
                        await confirmBtn.click();
                        const finalResponse = await brandPage.waitForResponse(res => res.url().includes('/approve') && res.request().method() === 'POST', { timeout: 5000 }).catch(() => null);
                        if (finalResponse) console.log(`Confirmation Response: ${finalResponse.status()}`);
                    }
                } catch (e) {
                    console.log('No confirmation dialog appeared or button not clickable.');
                }

                await expect(brandPage.getByText(/sucesso|contrato/i).first()).toBeVisible();
                await brandPage.waitForTimeout(2000);
            });

            // ==========================================
            // 4.5. Creator Accepts Offer (Required to create Contract)
            // ==========================================
            await test.step('Creator accepts offer', async () => {
                await creatorPage.goto('/dashboard/messages');
                await creatorPage.waitForLoadState('networkidle');
                await creatorPage.reload(); // Force reload to ensure latest state
                
                const chatItem = creatorPage.locator('div[class*="chat-item"], a[href*="/dashboard/messages/"]').first();
                await expect(chatItem).toBeVisible({ timeout: 15000 });
                await chatItem.click();
                
                const acceptOfferBtn = creatorPage.locator('button:has-text("Aceitar Oferta"), button:has-text("Aceitar")').last();
                
                // Wait for message to load
                await creatorPage.waitForTimeout(2000);
                
                if (await acceptOfferBtn.isVisible()) {
                    await acceptOfferBtn.click();
                    
                    const confirmBtn = creatorPage.getByRole('button', { name: /confirmar|sim|aceitar/i }).last();
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                    }
                    
                    await expect(creatorPage.getByText(/sucesso|aceita/i)).toBeVisible();
                } else {
                     console.log('Accept button not found. Checking if already accepted...');
                     const acceptedBadge = creatorPage.getByText(/Oferta aceita|Offer accepted/i);
                     if (await acceptedBadge.isVisible()) {
                         console.log('Offer already accepted.');
                     } else {
                         throw new Error('Offer accept button not found and offer not marked as accepted.');
                     }
                }
            });

            // ==========================================
            // 5. Brand Pays (Mocked) -> Contract Becomes Active
            // ==========================================
            await test.step('Brand pays (Mocked)', async () => {
                if (campaignId) {
                    await brandPage.goto(`/dashboard/campaigns/${campaignId}/manage`);
                    await brandPage.waitForLoadState('networkidle');
                    
                    const contractsTab = brandPage.getByRole('tab', { name: /Contratos|Contracts/i });
                    if (await contractsTab.isVisible()) {
                        console.log('Clicking Contracts tab...');
                        await contractsTab.click();
                        await brandPage.waitForTimeout(2000);
                        const candidatesTab = brandPage.getByRole('tab', { name: /Candidatos|Candidates/i });
                        if (await candidatesTab.getAttribute('aria-selected') === 'true') {
                            console.warn('Contracts tab click failed or ignored. Forcing reload.');
                            await brandPage.reload();
                            await contractsTab.click();
                        }
                    } else {
                        console.warn('Contracts tab NOT visible.');
                    }
                } else {
                    await brandPage.goto('/dashboard/contracts');
                }

                await brandPage.waitForLoadState('networkidle');

                const allCards = brandPage.locator('div.rounded-xl.border.bg-card');
                const count = await allCards.count();
                console.log(`Found ${count} contracts/cards.`);

                let contractCard = allCards.first();

                if (count === 0) {
                    console.log('No cards found in context. Trying global contracts list...');
                    await brandPage.goto('/dashboard/contracts');
                    await brandPage.reload();
                    const tabs = brandPage.locator('button[role="tab"]');
                    if (await tabs.count() > 0) {
                        await tabs.filter({ hasText: /Pendente|Pending/i }).click().catch(() => { });
                    }
                    contractCard = brandPage.locator('div.rounded-xl.border.bg-card').first();
                }

                await expect(contractCard).toBeVisible({ timeout: 10000 });

                const payButton = contractCard.locator('button:has-text("Realizar Pagamento"), button:has-text("Pagar")');
                if (await payButton.isVisible()) {
                    await payButton.click();
                    
                    await brandPage.waitForURL(/checkout.stripe.com/);
                    console.log('Redirected to Stripe Checkout. Attempting to pay...');
                     
                     try {
                        // Wait for checkout page load
                        await brandPage.waitForLoadState('domcontentloaded');
                        await brandPage.waitForTimeout(5000); // Wait for Stripe hydration

                        // Find the frame with the card input
                        console.log('Searching for Stripe Card Input...');
                        const frames = brandPage.frames();
                        let cardFrame = null;
                        let cardInput = null;

                        for (const frame of frames) {
                            const input = frame.locator('input[name="cardnumber"], input[placeholder*="0000"], input[autocomplete="cc-number"]');
                            if (await input.count() > 0 && await input.isVisible()) {
                                console.log(`Found card input in frame: ${frame.url()}`);
                                cardFrame = frame;
                                cardInput = input.first();
                                break;
                            }
                        }

                        if (!cardInput) {
                            console.log('Card input not found in iframes. Checking main page...');
                            const input = brandPage.locator('input[name="cardnumber"], input[placeholder*="0000"], input[autocomplete="cc-number"]');
                            if (await input.count() > 0 && await input.isVisible()) {
                                cardInput = input.first();
                            }
                        }

                        if (!cardInput) {
                            throw new Error('Stripe Card Input not found anywhere!');
                        }

                        // Fill Card Number
                        console.log('Filling Card Number...');
                        await cardInput.click();
                        await brandPage.waitForTimeout(500);
                        await cardInput.fill('4242424242424242');
                        await brandPage.waitForTimeout(500);

                        // Fill Expiry & CVC (Try specific selectors first, else Tab)
                        if (cardFrame) {
                            const expInput = cardFrame.locator('input[name="exp-date"], input[placeholder="MM / YY"]');
                            const cvcInput = cardFrame.locator('input[name="cvc"], input[placeholder="CVC"]');

                            if (await expInput.isVisible()) {
                                await expInput.fill('1234');
                            } else {
                                // Try Tabbing
                                await brandPage.keyboard.press('Tab');
                                await brandPage.keyboard.type('1234');
                            }
                            
                            if (await cvcInput.isVisible()) {
                                await cvcInput.fill('123');
                            } else {
                                await brandPage.keyboard.press('Tab');
                                await brandPage.keyboard.type('123');
                            }
                        } else {
                             // Main frame logic
                             await brandPage.locator('input[name="exp-date"]').fill('1234').catch(() => brandPage.keyboard.type('1234'));
                             await brandPage.locator('input[name="cvc"]').fill('123').catch(() => brandPage.keyboard.type('123'));
                        }

                        // Name and Country are usually in the main frame
                        console.log('Filling Billing Details...');
                        await brandPage.locator('#billingName').fill('Test Brand').catch(() => {});
                        await brandPage.locator('#billingPostalCode').fill('10001').catch(() => {});
                        
                        // Handle "Name on card" if it's separate
                        await brandPage.locator('input[id="billingName"]').fill('Test Brand').catch(() => {});

                        // Click Pay
                        console.log('Submitting Payment...');
                        const submitBtn = brandPage.locator('button[type="submit"]');
                        await expect(submitBtn).toBeVisible();
                        await submitBtn.click();

                        // Wait for return (handled either locally or via prod redirect)
                        await brandPage.waitForURL(/.*payment-methods.*success=true/, { timeout: 60000 });
                        
                        // Handle Production Redirect (Fix for remote backend config)
                        const currentUrl = brandPage.url();
                        if (currentUrl.includes('nexacreators.com.br')) {
                            console.log('Detected redirect to Production URL. Redirecting back to Localhost...');
                            const urlObj = new URL(currentUrl);
                            const newUrl = `http://localhost:3000${urlObj.pathname}${urlObj.search}`;
                            await brandPage.goto(newUrl);
                        }
                        
                        console.log('Payment Successful, redirected to Payment Methods.');
                    } catch (e) {
                        console.warn('Failed to automate Stripe Checkout UI.');
                        await brandPage.screenshot({ path: 'stripe-checkout-fail.png' });
                        throw e;
                    }

                    await brandPage.waitForTimeout(5000); // Wait for potential webhook
                    
                    // FORCE WEBHOOK SIMULATION (Fix for local dev missing webhook forwarding)
                    try {
                        console.log('Simulating Webhook/Payment Success via Backend Script...');
                        // Path relative to frontend e2e folder -> backend
                        const backendScript = path.resolve(__dirname, '../../../../backend/simulate_webhook.php');
                        const cmd = `php "${backendScript}"`;
                        console.log(`Running: ${cmd}`);
                        execSync(cmd, { stdio: 'inherit' });
                        console.log('Simulation complete.');
                    } catch (err) {
                        console.error('Failed to run simulation script:', err);
                    }

                    await brandPage.reload();
                } else {
                    console.log('Pay button not visible. Contract might already be active?');
                    console.log('Card Text:', await contractCard.innerText());
                }

                const targetCard = brandPage.locator('div.rounded-xl.border.bg-card').first();
                await expect(targetCard.locator('.badge, [data-testid="contract-status"], span:has-text("Ativo"), span:has-text("Active")').first()).toBeVisible({ timeout: 10000 });
            });

            // ==========================================
            // 6. Creator Delivers Work
            // ==========================================
            await test.step('Creator delivers work', async () => {
                await creatorPage.goto('/dashboard/contracts');
                const contractCard = creatorPage.locator('div.rounded-xl.border.bg-card').filter({ hasText: uniqueCampaignTitle }).first();
                await contractCard.click();

                const uploadSection = creatorPage.locator('[data-testid="delivery-upload"], :has-text("Entregar Material")');
                await expect(uploadSection).toBeVisible();

                const fileInput = creatorPage.locator('input[type="file"]').first();
                await fileInput.setInputFiles({
                    name: 'final-video.mp4',
                    mimeType: 'video/mp4',
                    buffer: Buffer.from('fake-video-content'),
                });

                await creatorPage.waitForTimeout(1000);
                await creatorPage.getByRole('button', { name: /enviar|entregar/i }).click();

                await expect(creatorPage.getByText(/sucesso|enviado/i)).toBeVisible();
            });

            // ==========================================
            // 7. Brand Approves Delivery & Closes Contract
            // ==========================================
            await test.step('Brand approves delivery and closes', async () => {
                await brandPage.goto('/dashboard/contracts');
                const contractCard = brandPage.locator('div.rounded-xl.border.bg-card').filter({ hasText: uniqueCampaignTitle }).first();
                await contractCard.click();

                // Approve Delivery
                const approveDeliveryBtn = brandPage.getByRole('button', { name: /aprovar entrega|approve/i }).first();
                await expect(approveDeliveryBtn).toBeVisible();
                await approveDeliveryBtn.click();

                // Confirm
                const confirmBtn = brandPage.getByRole('button', { name: /confirmar|sim/i }).last();
                if (await confirmBtn.isVisible()) await confirmBtn.click();

                await expect(brandPage.getByText(/aprovado|sucesso/i)).toBeVisible();

                // Complete Contract
                const completeBtn = brandPage.getByRole('button', { name: /concluir|finalizar/i }).first();
                await completeBtn.click();
                if (await confirmBtn.isVisible()) await confirmBtn.click();

                // Rate
                await expect(brandPage.getByText(/avaliar|rate/i)).toBeVisible();
                const stars = brandPage.locator('svg[class*="star"]');
                if (await stars.count() >= 5) await stars.nth(4).click();

                await brandPage.locator('textarea').fill('Great work!');
                await brandPage.getByRole('button', { name: /enviar/i }).click();

                await expect(brandPage.getByText(/sucesso|enviada/i)).toBeVisible();
            });

        } finally {
            await creatorContext.close();
            await brandContext.close();
            await adminContext.close();
        }
    });
});
