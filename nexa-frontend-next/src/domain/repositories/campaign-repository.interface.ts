import { Campaign } from "@/domain/entities/campaign"
import { Application } from "@/domain/entities/application"

export interface CampaignRepository {
  findAll(filters?: any): Promise<Campaign[]>
  findById(id: number): Promise<Campaign | null>
  create(data: any): Promise<Campaign>
  update(id: number, data: any): Promise<Campaign>
  delete(id: number): Promise<void>
  apply(id: number, data: any): Promise<Application>
  getStats?(): Promise<any>
}
