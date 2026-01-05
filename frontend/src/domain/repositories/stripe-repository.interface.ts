export interface StripeAccountStatus {
    has_account: boolean;
    account_id?: string;
    verification_status?: 'pending' | 'restricted' | 'enabled' | 'disabled';
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
    requirements?: {
      currently_due: string[];
      eventually_due: string[];
      past_due: string[];
      pending_verification: string[];
    };
  }
  
  export interface StripeAccountLink {
    url: string;
    expires_at: number;
  }
  
  export interface CreateStripeAccountRequest {
    type: 'express' | 'standard';
    country: string;
    email: string;
  }

  export type StripeApiResponse = Record<string, unknown>
  
  export interface StripeRepositoryInterface {
    createOrLinkAccount(data: CreateStripeAccountRequest): Promise<StripeApiResponse>;
    createAccountLink(): Promise<StripeAccountLink>;
    getAccountStatus(): Promise<StripeAccountStatus>;
    checkConfiguration(): Promise<StripeApiResponse>;
    createSetupIntent(data: { username: string; email: string }): Promise<StripeApiResponse>;
    createPaymentMethodCheckout(): Promise<{ success: boolean; url: string; message?: string }>;
  }
