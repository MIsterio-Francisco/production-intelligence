/**
 * MARKET SOURCE REGISTRY — PRODUCTION INTELLIGENCE V1.5
 * Misterio Color Lab
 * 
 * Centralized declarative registry for external trade press, official registries,
 * film commission slates, and industry monitors.
 */

import { MarketSource } from "../../types/commercial";

export class SourceRegistry {
  private static sources: Map<string, MarketSource> = new Map();

  public static getSources(): MarketSource[] {
    this.initDefaultSources();
    return Array.from(this.sources.values());
  }

  public static getEnabledSources(): MarketSource[] {
    return this.getSources().filter((s) => s.enabled);
  }

  public static getSourceById(id: string): MarketSource | undefined {
    this.initDefaultSources();
    return this.sources.get(id);
  }

  public static registerSource(source: MarketSource): void {
    this.sources.set(source.id, source);
  }

  public static updateSourceStatus(id: string, status: MarketSource["status"], lastScannedAt?: string): void {
    const s = this.sources.get(id);
    if (s) {
      s.status = status;
      if (lastScannedAt) s.lastScannedAt = lastScannedAt;
    }
  }

  private static initDefaultSources(): void {
    if (this.sources.size === 0) {
      const defaults: MarketSource[] = [
        {
          id: "src_official_morena",
          name: "Morena Films Official Press & Slate Catalog",
          url: "https://morenafilms.com/news",
          sourceTier: "TIER_1_OFFICIAL",
          sourceType: "OFFICIAL_PRODUCTION_COMPANY",
          enabled: true,
          scanFrequency: "HIGH_PRIORITY",
          reliabilityScore: 98,
          rateLimitPerMin: 30,
          status: "CONNECTED",
        },
        {
          id: "src_official_nostromo",
          name: "Nostromo Pictures Slate Monitor",
          url: "https://nostromopictures.com/projects",
          sourceTier: "TIER_1_OFFICIAL",
          sourceType: "OFFICIAL_PRODUCTION_COMPANY",
          enabled: true,
          scanFrequency: "HIGH_PRIORITY",
          reliabilityScore: 98,
          rateLimitPerMin: 30,
          status: "CONNECTED",
        },
        {
          id: "src_official_zeta",
          name: "Zeta Studios Official Announcements",
          url: "https://zetastudios.com/press",
          sourceTier: "TIER_1_OFFICIAL",
          sourceType: "OFFICIAL_PRODUCTION_COMPANY",
          enabled: true,
          scanFrequency: "HIGH_PRIORITY",
          reliabilityScore: 98,
          rateLimitPerMin: 30,
          status: "CONNECTED",
        },
        {
          id: "src_trade_variety",
          name: "Variety International Film & TV Production News",
          url: "https://variety.com/v/film/news",
          sourceTier: "TIER_2_TRADE_PRESS",
          sourceType: "TRADE_PRESS",
          enabled: true,
          scanFrequency: "STANDARD",
          reliabilityScore: 92,
          rateLimitPerMin: 60,
          status: "CONNECTED",
        },
        {
          id: "src_trade_cineuropa",
          name: "Cineuropa European Production Monitor",
          url: "https://cineuropa.org/en/news",
          sourceTier: "TIER_2_TRADE_PRESS",
          sourceType: "TRADE_PRESS",
          enabled: true,
          scanFrequency: "STANDARD",
          reliabilityScore: 94,
          rateLimitPerMin: 60,
          status: "CONNECTED",
        },
        {
          id: "src_official_icaa",
          name: "ICAA / BOE Official Spanish Film Grants & Registries",
          url: "https://www.cultura.gob.es/cultura/areas/cine/ayudas.html",
          sourceTier: "TIER_1_OFFICIAL",
          sourceType: "GOVERNMENT",
          enabled: true,
          scanFrequency: "DAILY",
          reliabilityScore: 99,
          rateLimitPerMin: 20,
          status: "CONNECTED",
        },
        {
          id: "src_trade_hollywoodreporter",
          name: "The Hollywood Reporter Film Production Feed",
          url: "https://hollywoodreporter.com/c/movies",
          sourceTier: "TIER_2_TRADE_PRESS",
          sourceType: "TRADE_PRESS",
          enabled: true,
          scanFrequency: "STANDARD",
          reliabilityScore: 91,
          rateLimitPerMin: 60,
          status: "CONNECTED",
        },
      ];

      defaults.forEach((s) => this.sources.set(s.id, s));
    }
  }
}
