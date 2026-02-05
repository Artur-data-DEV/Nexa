export interface DeliveryMaterial {
    id: number
    campaign_milestone_id: number
    file_path: string
    file_name: string
    file_size: number
    file_type: string
    status: 'pending' | 'approved' | 'rejected'
    comment?: string
    created_at: string
}

export interface CampaignMilestone {
    id: number
    contract_id: number
    title: string
    description?: string
    milestone_type: 'script_submission' | 'script_approval' | 'video_submission' | 'final_approval' | 'other'
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'delayed'
    deadline: string
    formatted_deadline?: string
    is_overdue: boolean
    is_delayed: boolean
    days_overdue?: number
    can_upload_file: boolean
    can_be_approved: boolean
    can_justify_delay: boolean
    can_be_extended: boolean
    file_path?: string
    file_name?: string
    comment?: string
    justification?: string
    delivery_materials?: DeliveryMaterial[]
}
