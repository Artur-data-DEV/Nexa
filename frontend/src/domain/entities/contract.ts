import { User } from "./user"
import { Campaign } from "./campaign"

export interface Contract {
    id: number
    campaign_id: number
    brand_id: number
    creator_id: number
    status: 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed'
    amount: number
    created_at: string
    updated_at: string
    title: string
    description?: string
    start_date?: string
    end_date?: string
    
    // Relations
    campaign?: Campaign
    brand?: User
    creator?: User
    other_user?: User // Helper for display (brand or creator depending on viewer)
}
