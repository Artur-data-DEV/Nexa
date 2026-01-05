import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"

type QueryFilters = Record<string, string | number | boolean | null | undefined>

export class ListCampaignsUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  async execute(filters?: QueryFilters): Promise<Campaign[]> {
    return this.campaignRepository.findAll(filters)
  }
}
