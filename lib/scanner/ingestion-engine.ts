/**
 * RAW INGESTION ENGINE — PRODUCTION INTELLIGENCE V1.5
 * Misterio Color Lab
 * 
 * Normalizes raw signals, generates unique SHA-256 fingerprints,
 * filters duplicates, and preserves strict provenance data.
 */

import { RawSignal, MarketSource } from "../../types/commercial";
import { calculateContentHash } from "../ingestion/normalizer";

export class IngestionEngine {
  private static processedFingerprints: Set<string> = new Set();
  private static rawSignalStore: RawSignal[] = [];

  /**
   * Generates a deterministic 64-char SHA-256 fingerprint for deduplication.
   */
  public static generateSignalFingerprint(
    sourceId: string,
    url: string | undefined,
    title: string,
    publishedAt: string
  ): string {
    const payload = {
      sourceId,
      url: (url || "").trim().toLowerCase(),
      title: title.trim().toLowerCase(),
      publishedAt: publishedAt.slice(0, 10), // Date precision
    };
    return calculateContentHash(payload);
  }

  /**
   * Processes an incoming raw market payload, deduplicating via fingerprint.
   */
  public static processRawPayload(
    source: MarketSource,
    payload: {
      url?: string;
      title: string;
      contentSummary?: string;
      publishedAt?: string;
      entityName?: string;
      projectTitle?: string;
      personName?: string;
      roleTitle?: string;
      proposedStatus?: string;
    }
  ): { signal?: RawSignal; isDuplicate: boolean } {
    const publishedAt = payload.publishedAt || new Date().toISOString();
    const fingerprint = this.generateSignalFingerprint(source.id, payload.url, payload.title, publishedAt);

    if (this.processedFingerprints.has(fingerprint)) {
      return { isDuplicate: true };
    }

    const signal: RawSignal = {
      id: `sig_raw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sourceId: source.id,
      url: payload.url,
      title: payload.title,
      contentSummary: payload.contentSummary,
      publishedAt,
      extractedAt: new Date().toISOString(),
      fingerprint,
      sourceTier: source.sourceTier,
      entityName: payload.entityName,
      projectTitle: payload.projectTitle,
      personName: payload.personName,
      roleTitle: payload.roleTitle,
      proposedStatus: payload.proposedStatus,
      status: "NEW",
    };

    this.processedFingerprints.add(fingerprint);
    this.rawSignalStore.push(signal);

    return { signal, isDuplicate: false };
  }

  public static getProcessedSignals(): RawSignal[] {
    return [...this.rawSignalStore];
  }

  public static clearStore(): void {
    this.processedFingerprints.clear();
    this.rawSignalStore = [];
  }
}
