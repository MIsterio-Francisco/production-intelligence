import * as crypto from "crypto";
import { NormalizedRecordPayload, RawRecordPayload } from "./types";
import { calculateDataQualityScore } from "./quality";

/**
 * Calculates SHA-256 hash of object payload to detect unchanged external records (PRD Section 9)
 */
export function calculateContentHash(data: Record<string, any>): string {
  const serialized = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

/**
 * Normalizes raw external data into canonical schema structure (PRD Section 8)
 */
export function normalizeRawPayload(
  rawPayload: RawRecordPayload,
  sourceTier: number = 2
): NormalizedRecordPayload {
  const rawData = rawPayload.raw_data || {};

  const normalizedData: Record<string, any> = {
    name: (rawData.name || rawData.title || rawData.company_name || "").trim(),
    country_code: (rawData.country_code || rawData.country || "").toUpperCase(),
    company_type: rawData.company_type || rawData.type || "independent",
    description: rawData.description || rawData.synopsis || rawData.summary || null,
    website_url: rawData.website_url || rawData.website || null,
    director_name: rawData.director_name || rawData.director || null,
    release_date: rawData.release_date || rawData.published_at || null,
    status: rawData.status || "announced",
  };

  const contentHash = calculateContentHash(normalizedData);
  const qualityScore = calculateDataQualityScore(normalizedData, sourceTier, rawPayload.published_at);

  return {
    external_id: rawPayload.external_id,
    entity_type: rawPayload.entity_type,
    content_hash: contentHash,
    data: normalizedData,
    source_url: rawPayload.source_url,
    published_at: rawPayload.published_at,
    source_tier: sourceTier,
    quality_score: qualityScore,
  };
}
