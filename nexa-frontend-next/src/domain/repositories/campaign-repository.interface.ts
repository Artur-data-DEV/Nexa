import { Campaign } from "@/domain/entities/campaign"
import { Application } from "@/domain/entities/application"

export interface CampaignRepository {
  findAll(filters?: Record<string, any>): Promise<Campaign[]>
  findById(id: number): Promise<Campaign | null>
  create(data: FormData | Record<string, any>): Promise<Campaign>
  update(id: number, data: Record<string, any>): Promise<Campaign>
  delete(id: number): Promise<void>
  apply(id: number, data: Record<string, any>): Promise<Application>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStats?(): Promise<any>
  getPending?(filters?: Record<string, any>): Promise<Campaign[]>
}
