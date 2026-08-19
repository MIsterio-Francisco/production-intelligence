import { BaseProvider } from "./providers/base-provider";
import { NewsProvider } from "./providers/news-provider";
import { SocialProvider } from "./providers/social-provider";
import { CompanyWebsiteProvider } from "./providers/company-provider";
import { DataProviderConfig } from "./types";

export class ProviderRegistry {
  private static providers: Map<string, BaseProvider> = new Map();

  public static register(provider: BaseProvider): void {
    this.providers.set(provider.config.provider_id, provider);
  }

  public static get(providerId: string): BaseProvider | undefined {
    this.initDefaultProviders();
    return this.providers.get(providerId);
  }

  public static getAllConfigs(): DataProviderConfig[] {
    this.initDefaultProviders();
    return Array.from(this.providers.values()).map((p) => p.config);
  }

  private static initDefaultProviders(): void {
    if (this.providers.size === 0) {
      const companySite = new CompanyWebsiteProvider();
      const news = new NewsProvider();
      const social = new SocialProvider();
      this.providers.set(companySite.config.provider_id, companySite);
      this.providers.set(news.config.provider_id, news);
      this.providers.set(social.config.provider_id, social);
    }
  }
}
