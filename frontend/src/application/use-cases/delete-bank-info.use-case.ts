import { FinancialRepository } from "@/domain/repositories/financial-repository.interface"

export class DeleteBankInfoUseCase {
  constructor(private financialRepository: FinancialRepository) {}

  async execute(): Promise<void> {
    return await this.financialRepository.deleteBankInfo()
  }
}
