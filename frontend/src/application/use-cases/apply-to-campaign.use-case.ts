import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Application } from "@/domain/entities/application"

type JsonObject = Record<string, unknown>

export class ApplyToCampaignUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  async execute(campaignId: number, data: JsonObject): Promise<Application> {
    return this.campaignRepository.apply(campaignId, data)
  }
}
