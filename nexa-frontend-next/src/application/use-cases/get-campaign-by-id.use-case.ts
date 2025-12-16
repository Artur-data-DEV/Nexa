import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"

export class GetCampaignByIdUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  async execute(id: number): Promise<Campaign | null> {
    return this.campaignRepository.findById(id)
  }
}
