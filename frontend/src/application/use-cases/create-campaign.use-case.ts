import { CampaignRepository } from "@/domain/repositories/campaign-repository.interface"
import { Campaign } from "@/domain/entities/campaign"

type JsonObject = Record<string, unknown>

export class CreateCampaignUseCase {
  constructor(private campaignRepository: CampaignRepository) {}

  async execute(data: FormData | JsonObject): Promise<Campaign> {
    return this.campaignRepository.create(data)
  }
}
