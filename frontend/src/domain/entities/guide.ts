export interface GuideStep {
    id: number;
    title: string;
    description: string;
    video_path?: string;
    video_url?: string;
    video_mime?: string;
    screenshots?: string[];
    screenshot_urls?: string[];
    order: number;
}

export interface Guide {
    id: number;
    title: string;
    description: string;
    audience: string;
    video_path?: string;
    video_url?: string;
    screenshots?: string[];
    screenshot_urls?: string[];
    created_by?: number;
    created_at: string;
    updated_at: string;
    steps?: GuideStep[];
}
