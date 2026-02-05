import { CampaignTimelineRepository } from "@/domain/repositories/campaign-timeline-repository.interface"
import { CampaignMilestone } from "@/domain/entities/milestone"
import { HttpClient } from "../api/axios-adapter"

export class ApiCampaignTimelineRepository implements CampaignTimelineRepository {
    constructor(private http: HttpClient) { }

    async getTimeline(contractId: number): Promise<CampaignMilestone[]> {
        const response = await this.http.get<{ success: boolean; data: CampaignMilestone[] }>(`/campaign-timeline?contract_id=${contractId}`)
        return response.data || []
    }

    async createMilestones(contractId: number): Promise<CampaignMilestone[]> {
        const response = await this.http.post<{ success: boolean; data: CampaignMilestone[] }>("/campaign-timeline/create-milestones", { contract_id: contractId })
        return response.data || []
    }

    async uploadFile(milestoneId: number, file: File): Promise<{ success: boolean; message: string }> {
        const formData = new FormData()
        formData.append("milestone_id", String(milestoneId))
        formData.append("file", file)
        return this.http.post("/campaign-timeline/upload-file", formData)
    }

    async approveMilestone(milestoneId: number, comment?: string): Promise<{ success: boolean; message: string }> {
        return this.http.post("/campaign-timeline/approve-milestone", { milestone_id: milestoneId, comment })
    }

    async rejectMilestone(milestoneId: number, comment?: string): Promise<{ success: boolean; message: string }> {
        return this.http.post("/campaign-timeline/reject-milestone", { milestone_id: milestoneId, comment })
    }

    async completeMilestone(milestoneId: number): Promise<{ success: boolean; message: string }> {
        return this.http.post("/campaign-timeline/complete-milestone", { milestone_id: milestoneId })
    }

    async justifyDelay(milestoneId: number, justification: string): Promise<{ success: boolean; message: string }> {
        return this.http.post("/campaign-timeline/justify-delay", { milestone_id: milestoneId, justification })
    }

    async extendTimeline(milestoneId: number, days: number, reason: string): Promise<{ success: boolean; message: string }> {
        return this.http.post("/campaign-timeline/extend-timeline", { milestone_id: milestoneId, days, reason })
    }

    async completeContract(contractId: number): Promise<{ success: boolean; message: string }> {
        return this.http.post(`/contracts/${contractId}/complete`)
    }
}
