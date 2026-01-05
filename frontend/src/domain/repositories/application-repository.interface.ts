import { Application } from "@/domain/entities/application"

type QueryFilters = Record<string, string | number | boolean | null | undefined>
type JsonObject = Record<string, unknown>

export interface ApplicationRepository {
    getMyApplications(filters?: QueryFilters): Promise<Application[]>
    getCampaignApplications(campaignId: number, filters?: QueryFilters): Promise<Application[]>
    create(campaignId: number, data: JsonObject): Promise<Application>
    updateStatus(id: number, status: 'approved' | 'rejected'): Promise<Application>
}
