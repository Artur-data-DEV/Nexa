import { FinancialRepository } from "@/domain/repositories/financial-repository.interface"

export class RequestWithdrawalUseCase {
  constructor(private financialRepository: FinancialRepository) {}

  async execute(data: any): Promise<void> {
    return this.financialRepository.requestWithdrawal(data)
  }
}
