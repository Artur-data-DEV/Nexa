import { CampaignMilestone } from "../entities/milestone"

export interface CampaignTimelineStatistics {
    total_milestones: number
    completed_milestones: number
    pending_milestones: number
    approved_milestones: number
    delayed_milestones: number
    overdue_milestones: number
    progress_percentage: number
}

export interface CampaignTimelineDownloadInfo {
    download_url: string
    file_name?: string
    file_size?: string | number
    file_type?: string
}

export interface CampaignTimelineRepository {
    getTimeline(contractId: number): Promise<CampaignMilestone[]>
    getStatistics(contractId: number): Promise<CampaignTimelineStatistics | null>
    createMilestones(contractId: number): Promise<CampaignMilestone[]>
    uploadFile(milestoneId: number, file: File): Promise<{ success: boolean; message: string }>
    approveMilestone(milestoneId: number, comment?: string): Promise<{ success: boolean; message: string }>
    rejectMilestone(milestoneId: number, comment?: string): Promise<{ success: boolean; message: string }>
    completeMilestone(milestoneId: number): Promise<{ success: boolean; message: string }>
    justifyDelay(milestoneId: number, justification: string): Promise<{ success: boolean; message: string }>
    markDelayed(milestoneId: number, justification?: string): Promise<{ success: boolean; message: string }>
    extendTimeline(milestoneId: number, days: number, reason: string): Promise<{ success: boolean; message: string }>
    downloadFile(milestoneId: number): Promise<CampaignTimelineDownloadInfo | null>
    completeContract(contractId: number): Promise<{ success: boolean; message: string }>
}
