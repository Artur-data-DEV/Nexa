import { ApplicationRepository } from "@/domain/repositories/application-repository.interface"
import { Application } from "@/domain/entities/application"
import { HttpClient } from "../api/axios-adapter"

export class ApiApplicationRepository implements ApplicationRepository {
    constructor(private http: HttpClient) {}

    async getMyApplications(filters?: Record<string, any>): Promise<Application[]> {
        const params = new URLSearchParams(filters).toString()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await this.http.get<any>(`/applications?${params}`)
        
        // Handle Laravel Paginator: { success: true, data: { data: [...] } }
        if (response && response.data && Array.isArray(response.data.data)) {
            return response.data.data
        }
        // Fallback
        if (response && Array.isArray(response.data)) {
            return response.data
        }
        return Array.isArray(response) ? response : []
    }

  async getCampaignApplications(campaignId: number, filters?: Record<string, any>): Promise<Application[]> {
        const params = new URLSearchParams(filters).toString()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await this.http.get<any>(`/campaigns/${campaignId}/applications?${params}`)
        
        // Handle Laravel Paginator: { success: true, data: { data: [...] } }
        if (response && response.data && Array.isArray(response.data.data)) {
            return response.data.data
        }
        // Fallback
        if (response && Array.isArray(response.data)) {
            return response.data
        }
    return Array.isArray(response) ? response : []
  }

  async create(campaignId: number, data: Record<string, any>): Promise<Application> {
        const payload = {
            proposal: data.proposal,
            portfolio_links: data.portfolio_links,
            estimated_delivery_days: data.delivery_days ?? data.estimated_delivery_days,
            proposed_budget: data.budget ?? data.proposed_budget,
        }

        return this.http.post<Application>(`/campaigns/${campaignId}/applications`, payload)
  }

    async updateStatus(id: number, status: 'approved' | 'rejected'): Promise<Application> {
        const action = status === "approved" ? "approve" : "reject"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await this.http.post<any>(`/applications/${id}/${action}`, {})
        if (response && response.data) {
            return response.data as Application
        }
        return response as Application
    }
}
