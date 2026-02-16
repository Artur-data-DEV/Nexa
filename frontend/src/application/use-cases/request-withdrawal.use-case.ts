import { FinancialRepository } from "@/domain/repositories/financial-repository.interface"

export class RequestWithdrawalUseCase {
  constructor(private financialRepository: FinancialRepository) {}

  async execute(data: { amount: number; withdrawal_method: string; bank_account_id?: string }): Promise<void> {
    return this.financialRepository.requestWithdrawal(data)
  }
}
