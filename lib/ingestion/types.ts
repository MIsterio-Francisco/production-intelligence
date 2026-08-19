export type ProviderType =
  | "COMPANY_WEBSITE"
  | "INDUSTRY_NEWS"
  | "PRESS_RELEASE"
  | "FESTIVAL"
  | "AWARDS"
  | "PROJECT_DATABASE"
  | "PEOPLE_DATABASE"
  | "SOCIAL"
  | "MANUAL";

export type DataFreshnessState = "FRESH" | "AGING" | "STALE" | "UNKNOWN";

export type EntityMatchStatus = "MATCHED" | "POSSIBLE_MATCH" | "UNMATCHED";

export interface DataProviderConfig {
  provider_id: string;
  provider_name: string;
  provider_type: ProviderType;
  enabled: boolean;
  supported_entities: string[];
  rate_limit_per_min: number;
  priority: number; // 1 = highest
  reliability_score: number; // 0 - 100
  source_tier: number; // 1 - 4
  terms_reference: string;
  last_success?: string | null;
  last_failure?: string | null;
}

export interface RawRecordPayload {
  external_id: string;
  entity_type: "company" | "project" | "person" | "news" | "award" | "social";
  raw_data: Record<string, any>;
  source_url?: string;
  published_at?: string;
}

export interface NormalizedRecordPayload {
  external_id: string;
  entity_type: string;
  content_hash: string;
  data: Record<string, any>;
  source_url?: string;
  published_at?: string;
  source_tier: number;
  quality_score: number;
}

export interface EntityResolutionResult {
  status: EntityMatchStatus;
  matchedId?: string | null;
  matchedName?: string | null;
  confidence: number; // 0 - 100
  reason: string;
}

export interface IngestionRunResult {
  jobId: string;
  providerId: string;
  recordsFetched: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  affectedCompanyIds: string[];
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  errors: string[];
}
