import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"

export class CreateCampaignUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  async execute(data: any): Promise<Campaign> {
    return this.campaignRepository.create(data)
  }
}
