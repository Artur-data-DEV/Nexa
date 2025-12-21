import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"

export class ListPendingCampaignsUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  async execute(filters?: Record<string, any>): Promise<Campaign[]> {
    if (this.campaignRepository.getPending) {
      return this.campaignRepository.getPending(filters)
    }

    return this.campaignRepository.findAll({ ...filters, status: "pending" })
  }
}

