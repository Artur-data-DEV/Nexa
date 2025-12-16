import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Application } from "@/domain/entities/application"

export class ApplyToCampaignUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  async execute(campaignId: number, data: any): Promise<Application> {
    return this.campaignRepository.apply(campaignId, data)
  }
}
