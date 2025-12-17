import { StripeRepositoryInterface, CreateStripeAccountRequest, StripeAccountLink, StripeAccountStatus } from "@/domain/repositories/stripe-repository.interface";
import { HttpClient } from "@/infrastructure/api/axios-adapter";

export class ApiStripeRepository implements StripeRepositoryInterface {
    constructor(private http: HttpClient) {}

    async createOrLinkAccount(data: CreateStripeAccountRequest): Promise<any> {
        return this.http.post("/stripe/connect/create-or-link", data);
    }

    async createAccountLink(): Promise<StripeAccountLink> {
        return this.http.post("/stripe/connect/account-link");
    }

    async getAccountStatus(): Promise<StripeAccountStatus> {
        return this.http.get("/stripe/connect/status");
    }

    async checkConfiguration(): Promise<any> {
        return this.http.get("/stripe/check");
    }

    async createSetupIntent(data: { username: string; email: string }): Promise<any> {
        return this.http.post("/stripe/setup-intent", data);
    }

    async createPaymentMethodCheckout(): Promise<{ success: boolean; url: string; message?: string }> {
        return this.http.post("/freelancer/stripe-payment-method-checkout");
    }
}
