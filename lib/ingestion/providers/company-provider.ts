import { BaseProvider } from "./base-provider";
import { RawRecordPayload } from "../types";

export class CompanyWebsiteProvider extends BaseProvider {
  constructor() {
    super({
      provider_id: "official_company_website_provider",
      provider_name: "Official Company Website Ingestion Adapter",
      provider_type: "COMPANY_WEBSITE",
      enabled: true,
      status: "CONNECTED",
      supported_entities: ["company", "project", "person"],
      rate_limit_per_min: 120,
      priority: 1,
      reliability_score: 98,
      source_tier: 1,
      terms_reference: "Official Public Company Domain Specification",
    });
  }

  async fetchRawRecords(limit: number = 10): Promise<RawRecordPayload[]> {
    const mockWebsites = [
      {
        external_id: "site_morena_01",
        entity_type: "company" as const,
        source_url: "https://morenafilms.com",
        published_at: new Date().toISOString(),
        raw_data: {
          company_name: "Morena Films",
          legal_name: "Morena Films S.L.",
          country_code: "ES",
          city: "Madrid",
          website_url: "https://morenafilms.com",
          description: "Leading Spanish independent film & television production company.",
          founded_year: 1999,
          company_type: "independent",
          status: "active",
        },
      },
      {
        external_id: "site_a24_02",
        entity_type: "company" as const,
        source_url: "https://a24films.com",
        published_at: new Date().toISOString(),
        raw_data: {
          company_name: "A24",
          legal_name: "A24 LLC",
          country_code: "US",
          city: "New York",
          website_url: "https://a24films.com",
          description: "Independent entertainment company specializing in film and television production.",
          founded_year: 2012,
          company_type: "mini_major",
          status: "active",
        },
      },
    ];

    return mockWebsites.slice(0, limit);
  }
}
