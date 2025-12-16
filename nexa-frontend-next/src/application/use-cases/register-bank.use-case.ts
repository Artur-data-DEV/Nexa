import { FinancialRepository } from "@/domain/repositories/financial-repository.interface"
import { BankRegistrationRequest, BankRegistrationResponse } from "@/domain/entities/financial"

export class RegisterBankUseCase {
  constructor(private financialRepository: FinancialRepository) {}

  async execute(data: BankRegistrationRequest): Promise<BankRegistrationResponse> {
    return await this.financialRepository.registerBank(data)
  }
}
