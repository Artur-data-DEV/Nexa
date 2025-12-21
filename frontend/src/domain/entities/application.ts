export interface Application {
  id: number
  campaign_id: number
  creator_id: number
  status: 'pending' | 'approved' | 'rejected'
  proposal: string
  budget?: number
  delivery_days?: number
  created_at: string
}
