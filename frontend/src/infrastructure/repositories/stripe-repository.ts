import { StripeRepositoryInterface, CreateStripeAccountRequest, StripeAccountLink, StripeAccountStatus, StripeApiResponse } from "@/domain/repositories/stripe-repository.interface";
import { HttpClient } from "@/infrastructure/api/axios-adapter";

export class ApiStripeRepository implements StripeRepositoryInterface {
    constructor(private http: HttpClient) {}

    async createOrLinkAccount(data: CreateStripeAccountRequest): Promise<StripeApiResponse> {
        return this.http.post<StripeApiResponse, CreateStripeAccountRequest>("/stripe/connect/create-or-link", data);
    }

    async createAccountLink(): Promise<StripeAccountLink> {
        return this.http.post("/stripe/connect/account-link");
    }

    async getAccountStatus(): Promise<StripeAccountStatus> {
        return this.http.get("/stripe/connect/status");
    }

    async checkConfiguration(): Promise<StripeApiResponse> {
        return this.http.get<StripeApiResponse>("/stripe/check");
    }

    async createSetupIntent(data: { username: string; email: string }): Promise<StripeApiResponse> {
        return this.http.post<StripeApiResponse, { username: string; email: string }>("/stripe/setup-intent", data);
    }

    async createPaymentMethodCheckout(): Promise<{ success: boolean; url: string; message?: string }> {
        return this.http.post("/freelancer/stripe-payment-method-checkout");
    }
}
