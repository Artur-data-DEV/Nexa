import { CreatorBalance, Withdrawal, WithdrawalMethod, BankInfo, BankRegistrationRequest, BankRegistrationResponse } from "../entities/financial"

export interface FinancialRepository {
  getCreatorBalance(): Promise<CreatorBalance>
  getWithdrawals(): Promise<Withdrawal[]>
  getWithdrawalMethods(): Promise<WithdrawalMethod[]>
  requestWithdrawal(data: { amount: number; withdrawal_method: string; bank_account_id?: string }): Promise<void>
  cancelWithdrawal(id: number): Promise<void>
  registerBank(data: BankRegistrationRequest): Promise<BankRegistrationResponse>
  getBankInfo(): Promise<BankInfo>
  updateBankInfo(data: BankRegistrationRequest): Promise<BankRegistrationResponse>
  deleteBankInfo(): Promise<void>
}
