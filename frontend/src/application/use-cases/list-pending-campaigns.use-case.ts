import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"

type QueryFilters = Record<string, string | number | boolean | null | undefined>

export class ListPendingCampaignsUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  async execute(filters?: QueryFilters): Promise<Campaign[]> {
    if (this.campaignRepository.getPending) {
      return this.campaignRepository.getPending(filters)
    }

    return this.campaignRepository.findAll({ ...filters, status: "pending" })
  }
}

