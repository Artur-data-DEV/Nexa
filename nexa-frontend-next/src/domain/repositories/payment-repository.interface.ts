export interface SubscriptionPlan {
    id: number;
    name: string;
    description: string;
    price: number;
    duration_months: number;
    monthly_price: number;
    savings_percentage?: number;
    features: string[];
    sort_order: number;
}

export interface SubscriptionStatus {
    has_premium: boolean;
    premium_expires_at?: string;
    free_trial_expires_at?: string;
    is_premium_active: boolean;
    is_on_trial?: boolean;
    is_student?: boolean;
    days_remaining: number;
    subscription?: {
        status: string;
    };
}

export interface SubscriptionPaymentRequest {
    subscription_plan_id: number;
    payment_method_id: string;
}

export interface PaymentRepositoryInterface {
    getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
    processSubscription(data: SubscriptionPaymentRequest): Promise<unknown>;
    getSubscriptionStatus(): Promise<SubscriptionStatus>;
    getCheckoutUrl(planId: number): Promise<string>;
    createSubscriptionFromCheckout(sessionId: string): Promise<unknown>;
}
