import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"
import { Application } from "@/domain/entities/application"
import { HttpClient } from "../api/axios-adapter"

export class ApiCampaignRepository implements CampaignRepository {
  constructor(private http: HttpClient) {}

  private buildParams(filters?: Record<string, string | number | boolean | null | undefined>) {
    const params = new URLSearchParams()
    if (!filters) return params
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue
      params.append(key, String(value))
    }
    return params
  }

  async findAll(filters?: Record<string, string | number | boolean | null | undefined>): Promise<Campaign[]> {
    const params = this.buildParams(filters).toString()
    const response = await this.http.get<Campaign[] | { data: Campaign[] }>(`/campaigns?${params}`)
    
    // Handle Laravel Resource wrapping
    if (response && Array.isArray((response as { data?: Campaign[] }).data)) {
        return (response as { data: Campaign[] }).data
    }
    
    return Array.isArray(response) ? (response as Campaign[]) : []
  }

  async findById(id: number): Promise<Campaign | null> {
    const response = await this.http.get<Campaign | { data?: Campaign }>(`/campaigns/${id}`)
    
    // Handle wrapper { success: true, data: Campaign }
    if (response && (response as { data?: Campaign }).data) {
        return (response as { data: Campaign }).data
    }
    
    return response as Campaign
  }

  async create(data: FormData | Record<string, unknown>): Promise<Campaign> {
    // If data is FormData, axios handles headers automatically
    const response = await this.http.post<Campaign | { data?: Campaign }, FormData | Record<string, unknown>>("/campaigns", data)

    if (response && (response as { data?: Campaign }).data) {
        return (response as { data: Campaign }).data
    }

    return response as Campaign
  }

  async update(id: number, data: Record<string, unknown>): Promise<Campaign> {
    const response = await this.http.put<Campaign | { data?: Campaign }, Record<string, unknown>>(`/campaigns/${id}`, data)

    if (response && (response as { data?: Campaign }).data) {
        return (response as { data: Campaign }).data
    }

    return response as Campaign
  }

  async delete(id: number): Promise<void> {
    await this.http.delete(`/campaigns/${id}`)
  }

  async apply(id: number, data: Record<string, unknown>): Promise<Application> {
    const payload = {
      proposal: data.proposal as string,
      portfolio_links: data.portfolio_links as string[] | undefined,
      estimated_delivery_days: (data.delivery_days ?? data.estimated_delivery_days) as number | undefined,
      proposed_budget: (data.budget ?? data.proposed_budget) as number | undefined,
    }

    return this.http.post<Application>(`/campaigns/${id}/applications`, payload)
  }

  async getPending(filters?: Record<string, string | number | boolean | null | undefined>): Promise<Campaign[]> {
    const params = this.buildParams(filters).toString()
    const response = await this.http.get<Campaign[] | { data: Campaign[] }>(`/campaigns/pending?${params}`)

    // Handle Laravel Resource wrapping
    if (response && Array.isArray((response as { data?: Campaign[] }).data)) {
        return (response as { data: Campaign[] }).data
    }

    return Array.isArray(response) ? (response as Campaign[]) : []
  }
}
