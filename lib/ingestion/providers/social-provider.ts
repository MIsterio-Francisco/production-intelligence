import { BaseProvider } from "./base-provider";
import { RawRecordPayload } from "../types";

export class SocialProvider extends BaseProvider {
  constructor() {
    super({
      provider_id: "authorized_social_provider",
      provider_name: "Authorized Social Metrics API",
      provider_type: "SOCIAL",
      enabled: false, // Disabled by default until official API keys configured (PRD Section 59)
      supported_entities: ["social"],
      rate_limit_per_min: 30,
      priority: 4,
      reliability_score: 75,
      source_tier: 4,
      terms_reference: "Official Platform API Terms of Service",
    });
  }

  async fetchRawRecords(): Promise<RawRecordPayload[]> {
    return [];
  }
}
