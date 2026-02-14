/**
 * Test Data Fixtures - PRODUCTION
 * 
 * Hardcoded for Production environment.
 * Users must match: backend/database/seeders/ProductionTestUsersSeeder.php
 */

export const testUsers = {
    brand: {
        email: 'brand.teste@nexacreators.com.br',
        password: 'BrandTeste@2025',
        name: 'Brand Teste Produção',
        role: 'brand',
    },
    creator: {
        email: 'creator.premium@nexacreators.com.br',
        password: 'CreatorPremium@2025',
        name: 'Creator Premium Teste',
        role: 'creator',
    },
    admin: {
        email: 'admin@nexacreators.com.br',
        password: 'NexaAdmin@2025',
        name: 'Admin Nexa',
        role: 'admin',
    },
};

export const stripeTestCards = {
    success: {
        number: '4242424242424242',
        expiry: '12/30',
        cvc: '123',
        zip: '12345',
    },
    declined: {
        number: '4000000000000002',
        expiry: '12/30',
        cvc: '123',
        zip: '12345',
    },
};

export const testCampaign = {
    title: 'Campanha E2E Prod',
    description: 'Campanha de teste em produção.',
    budget: 500,
    category: 'lifestyle',
    requirements: 'Mínimo 1000 seguidores',
};

export const testApplication = {
    coverLetter: 'Candidatura teste produção.',
    proposedValue: 450,
};

export const testMessages = {
    greeting: 'Olá.',
};

export const timeouts = {
    pageLoad: 30000,
    apiResponse: 30000,
    stripeIframe: 45000,
    websocket: 20000,
    animation: 2000,
};

export const selectors = {
    auth: {
        emailInput: '[data-testid="email-input"]',
        passwordInput: '[data-testid="password-input"]',
        loginButton: '[data-testid="login-button"]',
        logoutButton: 'div[role="menuitem"]:has-text("Sair")',
        errorMessage: '[data-testid="error-message"]',
        sendOtpButton: 'button:has-text("Próxima etapa")',
        verifyOtpButton: 'button:has-text("Confirmar Código")',
    },
    dashboard: {
        sidebar: 'aside',
        userMenu: 'button[id^="radix-"]',
        notifications: 'button[aria-label="Notifications"]',
    },
    campaigns: {
        card: '.card, div[class*="rounded-xl"]',
        applyButton: 'button:has-text("Candidatar-se")',
        coverLetterInput: 'textarea',
        submitApplication: 'button:has-text("Enviar Candidatura")',
        applicationStatus: 'span[class*="badge"]',
        applicationRow: 'tr',
        approveButton: 'button:has-text("Aprovar")',
    },
    chat: {
        roomList: 'div[class*="flex-col gap-1"]',
        room: 'button[class*="text-left"]',
        messageInput: 'input[placeholder*="mensagem"]',
        sendButton: 'button:has(svg.lucide-send)',
        fileUpload: 'input[type="file"]',
    },
    contracts: {
        card: 'div.rounded-xl.border.bg-card',
        status: 'div.inline-flex.items-center.rounded-full',
    },
    payment: {
        payButton: 'button:has-text("Realizar Pagamento")',
        successMessage: 'text=/pagamento realizado|sucesso/i',
        errorMessage: 'text=/erro no pagamento/i',
        stripeFrame: 'iframe[name^="__privateStripeFrame"]',
    },
};
