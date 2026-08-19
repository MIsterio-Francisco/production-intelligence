export interface ProvenanceMeta {
  provider_id: string;
  source_url?: string;
  external_id?: string;
  retrieved_at: string;
  published_at?: string;
  source_tier: number;
  data_classification: "VERIFIED_FACT" | "ESTIMATE" | "AI_INFERENCE" | "UNKNOWN";
  confidence: number;
}

export function buildProvenanceMetadata(
  providerId: string,
  sourceTier: number = 2,
  sourceUrl?: string,
  externalId?: string,
  publishedAt?: string
): ProvenanceMeta {
  let classification: "VERIFIED_FACT" | "ESTIMATE" | "AI_INFERENCE" | "UNKNOWN" = "UNKNOWN";

  if (sourceTier === 1) {
    classification = "VERIFIED_FACT";
  } else if (sourceTier === 2) {
    classification = "VERIFIED_FACT";
  } else if (sourceTier === 3) {
    classification = "ESTIMATE";
  } else {
    classification = "UNKNOWN";
  }

  let confidence = 90;
  if (sourceTier === 1) confidence = 98;
  else if (sourceTier === 2) confidence = 90;
  else if (sourceTier === 3) confidence = 75;
  else confidence = 50;

  return {
    provider_id: providerId,
    source_url: sourceUrl,
    external_id: externalId,
    retrieved_at: new Date().toISOString(),
    published_at: publishedAt,
    source_tier: sourceTier,
    data_classification: classification,
    confidence,
  };
}
