import { FinancialRepository } from "@/domain/repositories/financial-repository.interface"
import { WithdrawalMethod } from "@/domain/entities/financial"

export class GetWithdrawalMethodsUseCase {
  constructor(private financialRepository: FinancialRepository) {}

  async execute(): Promise<WithdrawalMethod[]> {
    return this.financialRepository.getWithdrawalMethods()
  }
}
