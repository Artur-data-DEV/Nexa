import { GuideRepositoryInterface } from "@/domain/repositories/guide-repository.interface";
import { Guide } from "@/domain/entities/guide";
import { HttpClient } from "@/infrastructure/api/axios-adapter";

export class ApiGuideRepository implements GuideRepositoryInterface {
    constructor(private http: HttpClient) {}

    async getGuides(): Promise<Guide[]> {
        const response = await this.http.get<{ data: Guide[] } | Guide[]>("/guides");
        // Handle both wrapped and unwrapped responses
        if (Array.isArray(response)) {
            return response;
        }
        return response.data || [];
    }
}
