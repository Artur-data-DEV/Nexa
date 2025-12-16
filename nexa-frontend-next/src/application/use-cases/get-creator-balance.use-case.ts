import { FinancialRepository } from "@/domain/repositories/financial-repository.interface"
import { CreatorBalance } from "@/domain/entities/financial"

export class GetCreatorBalanceUseCase {
  constructor(private financialRepository: FinancialRepository) {}

  async execute(): Promise<CreatorBalance> {
    return this.financialRepository.getCreatorBalance()
  }
}
