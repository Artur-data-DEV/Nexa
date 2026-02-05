import { CampaignMilestone } from "../entities/milestone"

export interface CampaignTimelineRepository {
    getTimeline(contractId: number): Promise<CampaignMilestone[]>
    createMilestones(contractId: number): Promise<CampaignMilestone[]>
    uploadFile(milestoneId: number, file: File): Promise<{ success: boolean; message: string }>
    approveMilestone(milestoneId: number, comment?: string): Promise<{ success: boolean; message: string }>
    rejectMilestone(milestoneId: number, comment?: string): Promise<{ success: boolean; message: string }>
    completeMilestone(milestoneId: number): Promise<{ success: boolean; message: string }>
    justifyDelay(milestoneId: number, justification: string): Promise<{ success: boolean; message: string }>
    extendTimeline(milestoneId: number, days: number, reason: string): Promise<{ success: boolean; message: string }>
    completeContract(contractId: number): Promise<{ success: boolean; message: string }>
}
