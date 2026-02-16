import { User } from "./user"
import { Campaign } from "./campaign"

export interface Contract {
    id: number
    campaign_id: number
    brand_id: number
    creator_id: number
    status: 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed'
    amount: number | string
    created_at: string
    updated_at: string
    title: string
    description?: string
    start_date?: string
    end_date?: string
    workflow_status?: string
    tracking_code?: string | null
    budget?: number | string
    formatted_budget?: string
    creator_amount?: number | string
    platform_fee?: number | string
    estimated_days?: number
    requirements?: Record<string, any> | null
    started_at?: string
    expected_completion_at?: string
    completed_at?: string | null
    cancelled_at?: string | null
    cancellation_reason?: string | null
    days_until_completion?: number
    progress_percentage?: number
    is_overdue?: boolean
    is_near_completion?: boolean
    can_be_completed?: boolean
    can_be_cancelled?: boolean
    can_be_terminated?: boolean
    can_be_started?: boolean
    phase?: string
    current_milestone_id?: number | null
    has_brand_review?: boolean
    has_creator_review?: boolean
    has_both_reviews?: boolean
    briefing?: {
        objectives?: string
        target_audience?: string
        key_messages?: string
        channels?: string
        deadlines?: string
        brand_requirements?: string
        [key: string]: any
    } | null
    
    // Relations
    campaign?: Campaign
    brand?: User
    creator?: User
    other_user?: User // Helper for display (brand or creator depending on viewer)
}
