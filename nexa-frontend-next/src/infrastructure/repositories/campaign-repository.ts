import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"
import { Application } from "@/domain/entities/application"
import { HttpClient } from "../api/axios-adapter"

export class ApiCampaignRepository implements CampaignRepository {
  constructor(private http: HttpClient) {}

  async findAll(filters?: any): Promise<Campaign[]> {
    // Query params serialization can be improved
    const params = new URLSearchParams(filters).toString()
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

  async create(data: any): Promise<Campaign> {
    const formData = new FormData()
    // Append fields to FormData logic here if needed for file uploads
    // For now, assuming JSON or pre-processed data
    return this.http.post<Campaign>("/campaigns", data)
  }

  async update(id: number, data: any): Promise<Campaign> {
    return this.http.put<Campaign>(`/campaigns/${id}`, data)
  }

  async delete(id: number): Promise<void> {
    await this.http.delete(`/campaigns/${id}`)
  }

  async apply(id: number, data: any): Promise<Application> {
    return this.http.post<Application>(`/campaigns/${id}/apply`, data)
  }
}
