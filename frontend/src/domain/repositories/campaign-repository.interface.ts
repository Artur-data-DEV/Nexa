import { Campaign } from "@/domain/entities/campaign"
import { Application } from "@/domain/entities/application"

type QueryFilters = Record<string, string | number | boolean | null | undefined>
type JsonObject = Record<string, unknown>

export interface CampaignRepository {
  findAll(filters?: QueryFilters): Promise<Campaign[]>
  findById(id: number): Promise<Campaign | null>
  create(data: FormData | JsonObject): Promise<Campaign>
  update(id: number, data: JsonObject): Promise<Campaign>
  delete(id: number): Promise<void>
  apply(id: number, data: JsonObject): Promise<Application>
  getStats?(): Promise<unknown>
  getPending?(filters?: QueryFilters): Promise<Campaign[]>
}
