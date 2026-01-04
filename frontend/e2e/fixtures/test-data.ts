/**
 * Test Data Fixtures for E2E Tests
 * 
 * These are test users and data used across all E2E tests.
 * In a real scenario, these users should be seeded in the test database.
 */

export const testUsers = {
    brand: {
        email: 'brand-e2e@nexa.test',
        password: 'Test@123456',
        name: 'Marca Teste E2E',
        role: 'brand',
    },
    creator: {
        email: 'creator-e2e@nexa.test',
        password: 'Test@123456',
        name: 'Criador Teste E2E',
        role: 'creator',
    },
    admin: {
        email: 'admin-e2e@nexa.test',
        password: 'Admin@123456',
        name: 'Admin Teste E2E',
        role: 'admin',
    },
};

/**
 * Stripe Test Cards
 * @see https://stripe.com/docs/testing#cards
 */
export const stripeTestCards = {
    // Successful payment
    success: {
        number: '4242424242424242',
        expiry: '12/30',
        cvc: '123',
        zip: '12345',
    },
    // Card declined
    declined: {
        number: '4000000000000002',
        expiry: '12/30',
        cvc: '123',
        zip: '12345',
    },
    // Requires 3D Secure authentication
    requires3DS: {
        number: '4000002500003155',
        expiry: '12/30',
        cvc: '123',
        zip: '12345',
    },
    // Insufficient funds
    insufficientFunds: {
        number: '4000000000009995',
        expiry: '12/30',
        cvc: '123',
        zip: '12345',
    },
};

/**
 * Test Campaign Data
 */
export const testCampaign = {
    title: 'Campanha E2E Test',
    description: 'Campanha criada automaticamente para testes E2E. Esta campanha será usada para validar o fluxo completo de candidatura, aprovação, pagamento e chat.',
    budget: 500,
    category: 'lifestyle',
    requirements: 'Mínimo 1000 seguidores',
};

/**
 * Test Application Data
 */
export const testApplication = {
    coverLetter: 'Olá! Sou o candidato ideal para esta campanha. Tenho experiência em criação de conteúdo e uma audiência engajada no segmento.',
    proposedValue: 450,
};

/**
 * Test Messages
 */
export const testMessages = {
    greeting: 'Olá! Obrigado por aprovar minha candidatura.',
    question: 'Podemos discutir os detalhes da entrega?',
    confirmation: 'Perfeito, vou começar a trabalhar no conteúdo.',
};

/**
 * Timeouts for various operations (in milliseconds)
 */
export const timeouts = {
    pageLoad: 10000,
    apiResponse: 15000,
    stripeIframe: 20000,
    websocket: 10000,
    animation: 1000,
};

/**
 * Selectors using data-testid
 * Centralized for easy maintenance
 */
export const selectors = {
    // Auth
    auth: {
        emailInput: 'input[name="email"]', // Fallback from [data-testid="email-input"]
        passwordInput: 'input[name="password"]', // Fallback from [data-testid="password-input"]
        loginButton: 'button[type="submit"]', // Fallback from [data-testid="login-button"]
        logoutButton: 'div[role="menuitem"]:has-text("Sair")', // Generic fallback
        errorMessage: 'div[role="alert"]', // Generic fallback
        otpInput: 'input[type="text"]', // Generic fallback
        sendOtpButton: 'button:has-text("Próxima etapa")',
        verifyOtpButton: 'button:has-text("Confirmar Código")',
    },

    // Dashboard
    dashboard: {
        sidebar: 'aside', // Semantic HTML fallback
        userMenu: 'button[id^="radix-"]', // Radix trigger fallback
        notifications: 'button[aria-label="Notifications"]',
    },

    // Campaigns
    campaigns: {
        card: '.card, div[class*="rounded-xl"]',
        applyButton: 'button:has-text("Candidatar-se")',
        coverLetterInput: 'textarea',
        submitApplication: 'button:has-text("Enviar Candidatura")',
        applicationStatus: 'span[class*="badge"]',
        applicationsTab: 'button[role="tab"]:has-text("Candidaturas")',
        applicationRow: 'tr',
        approveButton: 'button:has-text("Aprovar")',
        rejectButton: 'button:has-text("Rejeitar")',
    },

    // Chat
    chat: {
        roomList: 'div[class*="flex-col gap-1"]',
        room: 'button[class*="text-left"]',
        messageInput: 'input[placeholder*="mensagem"], textarea[placeholder*="mensagem"]',
        sendButton: 'button:has(svg.lucide-send)', // Icon based fallback
        messageItem: 'div[class*="max-w-[75%]"]',
        typingIndicator: 'div[class*="animate-bounce"]',
        fileUpload: 'input[type="file"]',
    },

    // Contracts
    contracts: {
        card: '[data-testid="contract-card"]',
        status: '[data-testid="contract-status"]',
        activateButton: '[data-testid="activate-contract"]',
        completeButton: '[data-testid="complete-contract"]',
    },

    // Payment
    payment: {
        payButton: '[data-testid="pay-button"]',
        successMessage: '[data-testid="payment-success"]',
        errorMessage: '[data-testid="payment-error"]',
        stripeFrame: 'iframe[name*="stripe"]',
    },
};
