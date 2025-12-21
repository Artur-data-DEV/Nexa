import { FinancialRepository } from "@/domain/repositories/financial-repository.interface"
import { Withdrawal } from "@/domain/entities/financial"

export class GetWithdrawalsUseCase {
  constructor(private financialRepository: FinancialRepository) {}

  async execute(): Promise<Withdrawal[]> {
    return this.financialRepository.getWithdrawals()
  }
}
