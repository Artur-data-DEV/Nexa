import { PaymentRepositoryInterface, SubscriptionPlan, SubscriptionPaymentRequest, SubscriptionStatus } from "@/domain/repositories/payment-repository.interface";
import { HttpClient } from "@/infrastructure/api/axios-adapter";

export class ApiPaymentRepository implements PaymentRepositoryInterface {
    constructor(private http: HttpClient) {}

    async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
        const response = await this.http.get<{ data: SubscriptionPlan[] }>("/subscription/plans");
        return response.data || [];
    }

    async processSubscription(data: SubscriptionPaymentRequest): Promise<any> {
        return this.http.post("/payment/subscription", data);
    }

    async getSubscriptionStatus(): Promise<SubscriptionStatus> {
        return this.http.get("/payment/subscription-status");
    }
}
