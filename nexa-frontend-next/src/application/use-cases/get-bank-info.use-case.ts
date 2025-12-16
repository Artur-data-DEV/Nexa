import { FinancialRepository } from "@/domain/repositories/financial-repository.interface"
import { BankInfo } from "@/domain/entities/financial"

export class GetBankInfoUseCase {
  constructor(private financialRepository: FinancialRepository) {}

  async execute(): Promise<BankInfo> {
    return await this.financialRepository.getBankInfo()
  }
}
