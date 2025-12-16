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
        return this.http.post<Application>(`/campaigns/${campaignId}/apply`, data)
    }

    async updateStatus(id: number, status: 'approved' | 'rejected'): Promise<Application> {
        return this.http.put<Application>(`/applications/${id}/status`, { status })
    }
}
