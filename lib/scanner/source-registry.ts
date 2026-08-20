/**
 * MARKET SOURCE REGISTRY — PRODUCTION INTELLIGENCE V1.5.1
 * Misterio Color Lab
 * 
 * Declarative registry for external market sources with health metrics,
 * failure counters, and content verification tracking.
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

  public static updateSourceStatus(
    id: string,
    status: MarketSource["status"],
    healthStatus: MarketSource["healthStatus"],
    metrics?: {
      lastScannedAt?: string;
      lastSuccessfulFetch?: string;
      lastContentValidFetch?: string;
      lastEvidenceAccepted?: string;
      authenticityStatus?: MarketSource["authenticityStatus"];
      lastHttpStatus?: number;
      lastError?: string;
      incrementFailure?: boolean;
      incrementInvalidContent?: boolean;
      resetFailures?: boolean;
    }
  ): void {
    const s = this.sources.get(id);
    if (s) {
      s.status = status;
      s.healthStatus = healthStatus;
      if (metrics?.authenticityStatus) s.authenticityStatus = metrics.authenticityStatus;
      if (metrics?.lastHttpStatus !== undefined) s.lastHttpStatus = metrics.lastHttpStatus;
      if (metrics?.lastError !== undefined) s.lastError = metrics.lastError;
      if (metrics?.lastScannedAt) s.lastScannedAt = metrics.lastScannedAt;
      if (metrics?.lastSuccessfulFetch) s.lastSuccessfulFetch = metrics.lastSuccessfulFetch;
      if (metrics?.lastContentValidFetch) s.lastContentValidFetch = metrics.lastContentValidFetch;
      if (metrics?.lastEvidenceAccepted) s.lastEvidenceAccepted = metrics.lastEvidenceAccepted;

      s.lastCheckedAt = new Date().toISOString();

      if (metrics?.resetFailures) {
        s.consecutiveFailures = 0;
        s.consecutiveInvalidContent = 0;
      } else {
        if (metrics?.incrementFailure) s.consecutiveFailures = (s.consecutiveFailures || 0) + 1;
        if (metrics?.incrementInvalidContent) s.consecutiveInvalidContent = (s.consecutiveInvalidContent || 0) + 1;
      }
    }
  }

  private static initDefaultSources(): void {
    if (this.sources.size === 0) {
      const defaults: MarketSource[] = [
        {
          id: "src_official_morena",
          name: "Morena Films Official Press & Slate Catalog",
          url: "https://morenafilms.com/news",
          expectedDomain: "morenafilms.com",
          sourceTier: "TIER_1_OFFICIAL",
          sourceType: "OFFICIAL_PRODUCTION_COMPANY",
          enabled: true,
          scanFrequency: "HIGH_PRIORITY",
          reliabilityScore: 98,
          rateLimitPerMin: 30,
          status: "CONNECTED",
          healthStatus: "HEALTHY",
          authenticityStatus: "AUTHENTIC_CORPORATE",
          consecutiveFailures: 0,
          entityScope: "Morena Films",
          fallbackSources: ["src_trade_variety", "src_trade_cineuropa"],
        },
        {
          id: "src_official_luckychap",
          name: "LuckyChap Entertainment Official Portal",
          url: "https://luckychapentertainment.com",
          expectedDomain: "luckychapentertainment.com",
          sourceTier: "TIER_1_OFFICIAL",
          sourceType: "OFFICIAL_PRODUCTION_COMPANY",
          enabled: true,
          scanFrequency: "HIGH_PRIORITY",
          reliabilityScore: 95,
          rateLimitPerMin: 30,
          status: "DEGRADED",
          healthStatus: "PARKED_DOMAIN",
          authenticityStatus: "PARKED_DOMAIN",
          consecutiveFailures: 1,
          entityScope: "LuckyChap Entertainment",
          fallbackSources: ["src_trade_variety", "src_trade_hollywoodreporter"],
          lastError: "GoDaddy Parked Domain detected on official URL.",
        },
        {
          id: "src_trade_variety",
          name: "Variety International Film & TV Production News",
          url: "https://variety.com/v/film/news",
          expectedDomain: "variety.com",
          sourceTier: "TIER_2_TRADE_PRESS",
          sourceType: "TRADE_PRESS",
          enabled: true,
          scanFrequency: "STANDARD",
          reliabilityScore: 92,
          rateLimitPerMin: 60,
          status: "CONNECTED",
          healthStatus: "HEALTHY",
          authenticityStatus: "AUTHENTIC_CORPORATE",
          consecutiveFailures: 0,
        },
        {
          id: "src_trade_hollywoodreporter",
          name: "The Hollywood Reporter Film Production Feed",
          url: "https://hollywoodreporter.com/c/movies",
          expectedDomain: "hollywoodreporter.com",
          sourceTier: "TIER_2_TRADE_PRESS",
          sourceType: "TRADE_PRESS",
          enabled: true,
          scanFrequency: "STANDARD",
          reliabilityScore: 91,
          rateLimitPerMin: 60,
          status: "CONNECTED",
          healthStatus: "HEALTHY",
          authenticityStatus: "AUTHENTIC_CORPORATE",
          consecutiveFailures: 0,
        },
        {
          id: "src_trade_cineuropa",
          name: "Cineuropa European Production Monitor",
          url: "https://cineuropa.org/en/news",
          expectedDomain: "cineuropa.org",
          sourceTier: "TIER_2_TRADE_PRESS",
          sourceType: "TRADE_PRESS",
          enabled: true,
          scanFrequency: "STANDARD",
          reliabilityScore: 94,
          rateLimitPerMin: 60,
          status: "DEGRADED",
          healthStatus: "DEGRADED",
          authenticityStatus: "AUTHENTIC_CORPORATE",
          consecutiveFailures: 1,
        },
        {
          id: "src_official_nostromo",
          name: "Nostromo Pictures Official Portal",
          url: "https://nostromopictures.com",
          expectedDomain: "nostromopictures.com",
          sourceTier: "TIER_1_OFFICIAL",
          sourceType: "OFFICIAL_PRODUCTION_COMPANY",
          enabled: true,
          scanFrequency: "HIGH_PRIORITY",
          reliabilityScore: 98,
          rateLimitPerMin: 30,
          status: "CONFIG_REQUIRED",
          healthStatus: "UNAVAILABLE",
          authenticityStatus: "UNKNOWN",
          consecutiveFailures: 1,
          entityScope: "Nostromo Pictures",
          fallbackSources: ["src_trade_cineuropa"],
        },
        {
          id: "src_official_zeta",
          name: "Zeta Studios Official Portal",
          url: "https://zetastudios.com",
          expectedDomain: "zetastudios.com",
          sourceTier: "TIER_1_OFFICIAL",
          sourceType: "OFFICIAL_PRODUCTION_COMPANY",
          enabled: true,
          scanFrequency: "HIGH_PRIORITY",
          reliabilityScore: 98,
          rateLimitPerMin: 30,
          status: "CONFIG_REQUIRED",
          healthStatus: "UNAVAILABLE",
          authenticityStatus: "UNKNOWN",
          consecutiveFailures: 1,
          entityScope: "Zeta Studios",
          fallbackSources: ["src_trade_variety"],
        },
        {
          id: "src_official_icaa",
          name: "ICAA Official Spanish Film Grants & Registries",
          url: "https://www.cultura.gob.es/cultura/areas/cine/ayudas.html",
          expectedDomain: "cultura.gob.es",
          sourceTier: "TIER_1_OFFICIAL",
          sourceType: "GOVERNMENT",
          enabled: true,
          scanFrequency: "DAILY",
          reliabilityScore: 99,
          rateLimitPerMin: 20,
          status: "DEGRADED",
          healthStatus: "DEGRADED",
          authenticityStatus: "AUTHENTIC_CORPORATE",
          consecutiveFailures: 1,
        },
      ];

      defaults.forEach((s) => this.sources.set(s.id, s));
    }
  }
}
