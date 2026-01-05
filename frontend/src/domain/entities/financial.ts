export interface Balance {
  available_balance: number
  pending_balance: number
  total_balance: number
  total_earned: number
  total_withdrawn: number
  formatted_available_balance: string
  formatted_pending_balance: string
  formatted_total_balance: string
  formatted_total_earned: string
  formatted_total_withdrawn: string
}

export interface Earnings {
  this_month: number
  this_year: number
  formatted_this_month: string
  formatted_this_year: string
}

export interface WithdrawalStats {
  pending_count: number
  pending_amount: number
  formatted_pending_amount: string
}

export interface Transaction {
  id: number
  contract_title: string
  amount: string
  status: string
  processed_at?: string
}

export interface Withdrawal {
  id: number
  amount: string
  method: string
  status: string
  created_at: string
  can_be_cancelled: boolean
  status_badge_color: string
}

export interface WithdrawalMethod {
  id: string
  name: string
  description: string
  min_amount: number
  max_amount: number
  processing_time: string
  fee: number
  required_fields?: string[]
  field_config?: Record<string, unknown>
}

export interface BankInfo {
  bank_code: string
  agencia: string
  agencia_dv: string
  conta: string
  conta_dv: string
  cpf: string
  name: string
}

export interface BankRegistrationRequest {
  bank_code: string
  agencia: string
  agencia_dv: string
  conta: string
  conta_dv: string
  cpf: string
  name: string
}

export interface BankRegistrationResponse {
  success: boolean
  message?: string
  error?: string
  data?: {
    bank_account_id?: string
    status?: string
  }
}

export interface CreatorBalance {
  balance: Balance
  earnings: Earnings
  withdrawals: WithdrawalStats
  recent_transactions: Transaction[]
  recent_withdrawals: Withdrawal[]
}
