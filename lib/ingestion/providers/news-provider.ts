import { BaseProvider } from "./base-provider";
import { RawRecordPayload } from "../types";

export class NewsProvider extends BaseProvider {
  constructor() {
    super({
      provider_id: "industry_news_provider",
      provider_name: "Industry Trade Press News Feed",
      provider_type: "INDUSTRY_NEWS",
      enabled: true,
      status: "CONNECTED",
      supported_entities: ["news", "project", "event"],
      rate_limit_per_min: 60,
      priority: 1,
      reliability_score: 90,
      source_tier: 2,
      terms_reference: "Public Industry Trade News Specification",
    });
  }

  async fetchRawRecords(limit: number = 10): Promise<RawRecordPayload[]> {
    // Controlled mock dataset for news ingestion pipeline testing
    const mockNews = [
      {
        external_id: "news_001",
        entity_type: "news" as const,
        source_url: "https://variety.com/2026/film/la-infiltrada-post-production",
        published_at: new Date().toISOString(),
        raw_data: {
          title: "Morena Films Begins Picture Finishing on La Infiltrada",
          summary: "Spanish thriller La Infiltrada enters post-production phase in Madrid.",
          company_name: "Morena Films",
          country_code: "ES",
          status: "post_production",
        },
      },
      {
        external_id: "news_002",
        entity_type: "news" as const,
        source_url: "https://hollywoodreporter.com/2026/a24-civil-war-distro",
        published_at: new Date().toISOString(),
        raw_data: {
          title: "A24 Expands International Distribution Slate",
          summary: "A24 announces multi-territory theatrical release pipeline for feature slate.",
          company_name: "A24",
          country_code: "US",
          status: "production",
        },
      },
    ];

    return mockNews.slice(0, limit);
  }
}
