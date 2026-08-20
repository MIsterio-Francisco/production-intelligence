/**
 * SOURCE DISCOVERY & QUALITY CLASSIFICATION ENGINE — PRODUCTION INTELLIGENCE V1.5.5
 * Misterio Color Lab
 * 
 * Classifies source evidence quality (HIGH_VALUE, EVENT_CAPABLE, CATALOG_ONLY, etc.),
 * discovers RSS / Atom feeds from HTML link tags, and differentiates NEWS_INDEX from ARTICLE pages.
 */

import { DiscoveredSourceEntry, DiscoveredSourceStatus, SourceTier, SourceEvidenceQuality } from "../../types/commercial";
import { SourceAuthenticityEngine } from "./source-authenticity-engine";

export class SourceDiscoveryEngine {
  private static discoveredStore: Map<string, DiscoveredSourceEntry> = new Map();

  /**
   * Discovers RSS / Atom feed links declared in HTML header tags.
   */
  public static discoverFeedFromHtml(baseUrl: string, htmlBody: string): { feedDiscovered: boolean; feedUrl?: string; feedType?: "RSS" | "ATOM" | "JSON" } {
    if (!htmlBody || htmlBody.length < 50) {
      return { feedDiscovered: false };
    }

    const rssLinkMatch = htmlBody.match(/<link[^>]*rel=["']alternate["'][^>]*type=["']application\/rss\+xml["'][^>]*href=["']([^"']+)["']/i) ||
                         htmlBody.match(/<link[^>]*href=["']([^"']+)["'][^>]*type=["']application\/rss\+xml["']/i);
    if (rssLinkMatch && rssLinkMatch[1]) {
      const rawHref = rssLinkMatch[1].trim();
      const feedUrl = rawHref.startsWith("http") ? rawHref : new URL(rawHref, baseUrl).href;
      return { feedDiscovered: true, feedUrl, feedType: "RSS" };
    }

    const atomLinkMatch = htmlBody.match(/<link[^>]*rel=["']alternate["'][^>]*type=["']application\/atom\+xml["'][^>]*href=["']([^"']+)["']/i) ||
                          htmlBody.match(/<link[^>]*href=["']([^"']+)["'][^>]*type=["']application\/atom\+xml["']/i);
    if (atomLinkMatch && atomLinkMatch[1]) {
      const rawHref = atomLinkMatch[1].trim();
      const feedUrl = rawHref.startsWith("http") ? rawHref : new URL(rawHref, baseUrl).href;
      return { feedDiscovered: true, feedUrl, feedType: "ATOM" };
    }

    return { feedDiscovered: false };
  }

  /**
   * Evaluates deterministic evidence quality score for a source or document.
   */
  public static evaluateSourceEvidenceQuality(params: {
    authenticityStatus?: string;
    isParked?: boolean;
    httpStatus?: number;
    url: string;
    bodyText?: string;
    hasArticles?: boolean;
    hasFeed?: boolean;
  }): SourceEvidenceQuality {
    if (params.isParked || params.authenticityStatus === "PARKED_DOMAIN" || params.authenticityStatus === "DOMAIN_FOR_SALE") {
      return "PARKED_DOMAIN";
    }

    if (params.httpStatus === 403 || params.authenticityStatus === "AUTHENTICITY_REJECTED") {
      return "BLOCKED";
    }

    if (params.hasFeed || params.url.includes("/rss") || params.url.includes("/feed") || params.url.includes(".xml")) {
      return "HIGH_VALUE";
    }

    if (params.hasArticles && params.bodyText && (params.bodyText.includes("post-production") || params.bodyText.includes("posproducción") || params.bodyText.includes("filming begins") || params.bodyText.includes("rodaje"))) {
      return "EVENT_CAPABLE";
    }

    if (params.url.includes("/news") || params.url.includes("/prensa") || params.url.includes("/press")) {
      return "MEDIUM_VALUE";
    }

    if (params.bodyText && (params.bodyText.includes("catalogo") || params.bodyText.includes("producciones") || params.bodyText.includes("portfolio"))) {
      return "CATALOG_ONLY";
    }

    return "LOW_VALUE";
  }

  /**
   * Differentiates individual ARTICLE pages from NEWS_INDEX or CORPORATE_CATALOG pages.
   */
  public static classifyPageType(url: string, bodyText: string, title: string): "ARTICLE" | "NEWS_INDEX" | "CATALOG_ONLY" | "PARKED_DOMAIN" {
    const text = `${title} ${bodyText}`.toLowerCase();

    if (text.includes("domain parked") || text.includes("godaddy") || text.includes("domain for sale")) {
      return "PARKED_DOMAIN";
    }

    const isIndividualArticle = (
      bodyText.includes("article:published_time") ||
      bodyText.includes("schema.org/NewsArticle") ||
      bodyText.includes("schema.org/Article") ||
      /<time[^>]*>/i.test(bodyText) ||
      (url.includes("/202") && url.includes("-"))
    );

    if (isIndividualArticle) {
      return "ARTICLE";
    }

    if (text.includes("latest news") || text.includes("noticias") || text.includes("prensa")) {
      return "NEWS_INDEX";
    }

    return "CATALOG_ONLY";
  }

  /**
   * Proposes a newly discovered source.
   */
  public static discoverSource(params: {
    entityName: string;
    url: string;
    suggestedTier?: SourceTier;
    discoveryReason: string;
  }): DiscoveredSourceEntry {
    const domain = SourceAuthenticityEngine.extractDomain(params.url);
    const id = `disc_${domain.replace(/[^a-z0-9]/g, "_")}`;

    if (this.discoveredStore.has(id)) {
      return this.discoveredStore.get(id)!;
    }

    const entry: DiscoveredSourceEntry = {
      id,
      entityName: params.entityName,
      url: params.url,
      domain,
      suggestedTier: params.suggestedTier || "TIER_2_TRADE_PRESS",
      discoveryReason: params.discoveryReason,
      status: "DISCOVERED_SOURCE",
      discoveredAt: new Date().toISOString(),
    };

    this.discoveredStore.set(id, entry);
    return entry;
  }

  /**
   * Verifies or rejects a discovered source.
   */
  public static updateDiscoveredSourceStatus(id: string, status: DiscoveredSourceStatus): DiscoveredSourceEntry | undefined {
    const entry = this.discoveredStore.get(id);
    if (entry) {
      entry.status = status;
      if (status === "VERIFIED_SOURCE") {
        entry.verifiedAt = new Date().toISOString();
      }
    }
    return entry;
  }

  /**
   * Checks if a discovered source is verified for evidence use.
   */
  public static isSourceVerifiedForEvidence(urlOrDomain: string): boolean {
    const domain = SourceAuthenticityEngine.extractDomain(urlOrDomain);
    const id = `disc_${domain.replace(/[^a-z0-9]/g, "_")}`;
    const entry = this.discoveredStore.get(id);
    if (!entry) return true; // Known pre-registered sources are allowed by default
    return entry.status === "VERIFIED_SOURCE";
  }

  public static getDiscoveredSources(): DiscoveredSourceEntry[] {
    return Array.from(this.discoveredStore.values());
  }

  public static clearStore(): void {
    this.discoveredStore.clear();
  }
}
