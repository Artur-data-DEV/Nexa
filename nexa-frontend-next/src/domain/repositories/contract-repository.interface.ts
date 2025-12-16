import { Contract } from "@/domain/entities/contract"

export interface ContractRepository {
    getContracts(filters?: Record<string, any>): Promise<Contract[]>
    getContract(id: number): Promise<Contract>
    updateStatus(id: number, status: string): Promise<Contract>
    create(data: Partial<Contract>): Promise<Contract>
}
