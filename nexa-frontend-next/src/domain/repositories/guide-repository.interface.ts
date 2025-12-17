import { Guide } from "../entities/guide";

export interface GuideRepositoryInterface {
    getGuides(): Promise<Guide[]>;
}
