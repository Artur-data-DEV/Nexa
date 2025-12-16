import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"
import { Application } from "@/domain/entities/application"
import { HttpClient } from "../api/axios-adapter"

export class ApiCampaignRepository implements CampaignRepository {
  constructor(private http: HttpClient) {}

  async findAll(filters?: Record<string, any>): Promise<Campaign[]> {
    const params = new URLSearchParams(filters).toString()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await this.http.get<any>(`/campaigns?${params}`)
    
    // Handle Laravel Resource wrapping
    if (response && Array.isArray(response.data)) {
        return response.data
    }
    
    return Array.isArray(response) ? response : []
  }

  async findById(id: number): Promise<Campaign | null> {
    return this.http.get<Campaign>(`/campaigns/${id}`)
  }

  async create(data: FormData | Record<string, any>): Promise<Campaign> {
    // If data is FormData, axios handles headers automatically
    return this.http.post<Campaign>("/campaigns", data)
  }

  async update(id: number, data: Record<string, any>): Promise<Campaign> {
    return this.http.put<Campaign>(`/campaigns/${id}`, data)
  }

  async delete(id: number): Promise<void> {
    await this.http.delete(`/campaigns/${id}`)
  }

  async apply(id: number, data: Record<string, any>): Promise<Application> {
    return this.http.post<Application>(`/campaigns/${id}/apply`, data)
  }
}
