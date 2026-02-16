import { FinancialRepository } from "@/domain/repositories/financial-repository.interface"
import { CreatorBalance, Withdrawal, WithdrawalMethod, BankInfo, BankRegistrationRequest, BankRegistrationResponse } from "@/domain/entities/financial"
import { HttpClient } from "../api/axios-adapter"

export class ApiFinancialRepository implements FinancialRepository {
  constructor(private http: HttpClient) {}

  async getCreatorBalance(): Promise<CreatorBalance> {
    const response = await this.http.get<{ data: CreatorBalance }>("/creator-balance")
    return response.data
  }

  async getWithdrawals(): Promise<Withdrawal[]> {
    const response = await this.http.get<{ data: { data: Withdrawal[] } }>("/freelancer/withdrawals")
    if (response && response.data && Array.isArray(response.data.data)) {
        return response.data.data
    }
    return []
  }

  async getWithdrawalMethods(): Promise<WithdrawalMethod[]> {
      const response = await this.http.get<{ data: WithdrawalMethod[] }>("/creator-balance/withdrawal-methods")
      return response.data
  }

  async requestWithdrawal(data: { amount: number; withdrawal_method: string; bank_account_id?: string }): Promise<void> {
    await this.http.post("/freelancer/withdrawals", data)
  }

  async cancelWithdrawal(id: number): Promise<void> {
    await this.http.delete(`/freelancer/withdrawals/${id}`)
  }

  async registerBank(data: BankRegistrationRequest): Promise<BankRegistrationResponse> {
    const response = await this.http.post<BankRegistrationResponse>("/freelancer/register-bank", data)
    return response
  }

  async getBankInfo(): Promise<BankInfo> {
    const response = await this.http.get<{ data: BankInfo }>("/freelancer/bank-info")
    return response.data
  }

  async updateBankInfo(data: BankRegistrationRequest): Promise<BankRegistrationResponse> {
    const response = await this.http.put<BankRegistrationResponse>("/freelancer/bank-info", data)
    return response
  }

  async deleteBankInfo(): Promise<void> {
    await this.http.delete("/freelancer/bank-info")
  }
}
