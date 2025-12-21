import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"

export class ListCampaignsUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  async execute(filters?: any): Promise<Campaign[]> {
    return this.campaignRepository.findAll(filters)
  }
}
