import { Application } from "@/domain/entities/application"

export interface ApplicationRepository {
    getMyApplications(filters?: Record<string, any>): Promise<Application[]>
    getCampaignApplications(campaignId: number, filters?: Record<string, any>): Promise<Application[]>
    create(campaignId: number, data: Record<string, any>): Promise<Application>
    updateStatus(id: number, status: 'approved' | 'rejected'): Promise<Application>
}
