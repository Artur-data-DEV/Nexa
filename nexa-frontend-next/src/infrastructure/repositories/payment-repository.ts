import { PaymentRepositoryInterface, SubscriptionPlan, SubscriptionPaymentRequest, SubscriptionStatus } from "@/domain/repositories/payment-repository.interface";
import { HttpClient } from "@/infrastructure/api/axios-adapter";

type RawSubscriptionPlan = {
    id?: number;
    name?: string;
    description?: string;
    price?: number | string | null;
    duration_months?: number | string | null;
    monthly_price?: number | string | null;
    savings_percentage?: number | string | null;
    features?: string[];
    sort_order?: number | string | null;
};

type SubscriptionPlansResponse = {
    success?: boolean;
    data?: RawSubscriptionPlan[];
};

export class ApiPaymentRepository implements PaymentRepositoryInterface {
    constructor(private http: HttpClient) {}

    async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
        const response = await this.http.get<SubscriptionPlansResponse>("/subscription/plans");
        const plans = response?.data;

        if (!Array.isArray(plans)) {
            return [];
        }

        const mappedPlans: SubscriptionPlan[] = plans.map((plan) => {
            const price =
                typeof plan.price === "number"
                    ? plan.price
                    : plan.price != null
                    ? parseFloat(String(plan.price))
                    : 0;

            const durationMonths =
                typeof plan.duration_months === "number"
                    ? plan.duration_months
                    : plan.duration_months != null
                    ? parseInt(String(plan.duration_months))
                    : 1;

            const monthlyPrice =
                typeof plan.monthly_price === "number"
                    ? plan.monthly_price
                    : plan.monthly_price != null
                    ? parseFloat(String(plan.monthly_price))
                    : 0;

            const savingsPercentageRaw = plan.savings_percentage;
            const savingsPercentage =
                typeof savingsPercentageRaw === "number"
                    ? savingsPercentageRaw
                    : savingsPercentageRaw != null
                    ? parseFloat(String(savingsPercentageRaw))
                    : undefined;

            const sortOrder =
                typeof plan.sort_order === "number"
                    ? plan.sort_order
                    : plan.sort_order != null
                    ? parseInt(String(plan.sort_order))
                    : 0;

            const features = Array.isArray(plan.features) ? plan.features : [];

            return {
                id: plan.id ?? 0,
                name: plan.name ?? "Plano",
                description: plan.description ?? "Descrição não disponível",
                price: Number.isFinite(price) ? price : 0,
                duration_months: Number.isFinite(durationMonths) ? durationMonths : 1,
                monthly_price: Number.isFinite(monthlyPrice) ? monthlyPrice : 0,
                savings_percentage: typeof savingsPercentage === "number" && Number.isFinite(savingsPercentage)
                    ? savingsPercentage
                    : undefined,
                features,
                sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
            };
        });

        return mappedPlans.sort((a, b) => a.sort_order - b.sort_order);
    }

    async processSubscription(data: SubscriptionPaymentRequest): Promise<unknown> {
        return this.http.post("/payment/subscription", data);
    }

    async getSubscriptionStatus(): Promise<SubscriptionStatus> {
        return this.http.get("/payment/subscription-status");
    }

    async getCheckoutUrl(planId: number): Promise<string> {
        const response = await this.http.get<{ success?: boolean; url?: string }>("/payment/checkout-url", {
            params: { plan_id: planId },
        });

        if (typeof response === "string") {
            return response;
        }

        if (response && typeof (response as { url?: string }).url === "string") {
            return (response as { url: string }).url;
        }

        throw new Error("URL de checkout não disponível");
    }

    async createSubscriptionFromCheckout(sessionId: string): Promise<unknown> {
        return this.http.post("/payment/create-subscription-from-checkout", {
            session_id: sessionId,
        });
    }
}
