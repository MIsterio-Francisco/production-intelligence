/**
 * SOURCE DISCOVERY ENGINE — PRODUCTION INTELLIGENCE V1.5.2
 * Misterio Color Lab
 * 
 * Manages candidate source discovery when primary sources fail.
 * Prevents DISCOVERED_SOURCE or PENDING_REVIEW sources from modifying Sales Readiness.
 */

import { DiscoveredSourceEntry, DiscoveredSourceStatus, SourceTier } from "../../types/commercial";
import { SourceAuthenticityEngine } from "./source-authenticity-engine";

export class SourceDiscoveryEngine {
  private static discoveredStore: Map<string, DiscoveredSourceEntry> = new Map();

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
