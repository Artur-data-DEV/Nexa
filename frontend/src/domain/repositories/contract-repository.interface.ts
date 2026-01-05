import { Contract } from "@/domain/entities/contract"

type QueryFilters = Record<string, string | number | boolean | null | undefined>

export interface ContractRepository {
    getContracts(filters?: QueryFilters): Promise<Contract[]>
    getContract(id: number): Promise<Contract>
    updateStatus(id: number, status: string): Promise<Contract>
    create(data: Partial<Contract>): Promise<Contract>
}
