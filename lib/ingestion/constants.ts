import { DataFreshnessState } from "./types";

// Source Quality Tiers & Weights (PRD Section 12)
export const SOURCE_QUALITY_TIERS = {
  TIER_1: { weight: 100, label: "Official Studio / Festival / Award" },
  TIER_2: { weight: 80,  label: "Established Trade Press / Variety / Hollywood Reporter" },
  TIER_3: { weight: 60,  label: "Professional Databases / Aggregators" },
  TIER_4: { weight: 40,  label: "Unverified Public Content" },
};

// Entity Matching Confidence Thresholds (PRD Section 15)
export const ENTITY_MATCH_THRESHOLDS = {
  AUTOMATIC_MERGE: 85, // >= 85 confidence allows automatic entity match
  CANDIDATE_REVIEW: 50, // 50 - 84 flags entity candidate for review
};

// Data Freshness Thresholds in Days (PRD Section 41)
export const FRESHNESS_THRESHOLDS = {
  COMPANY_DAYS: { FRESH: 30, AGING: 90 },
  PROJECT_DAYS: { FRESH: 30, AGING: 90 },
  PEOPLE_DAYS: { FRESH: 60, AGING: 180 },
  SOCIAL_DAYS: { FRESH: 7, AGING: 30 },
};

export function calculateFreshnessState(lastVerifiedISO?: string | null, entityType: string = "company"): DataFreshnessState {
  if (!lastVerifiedISO) return "UNKNOWN";
  const date = new Date(lastVerifiedISO).getTime();
  if (isNaN(date)) return "UNKNOWN";

  const ageDays = (new Date().getTime() - date) / (1000 * 60 * 60 * 24);
  const thresholds = (FRESHNESS_THRESHOLDS as any)[`${entityType.toUpperCase()}_DAYS`] || FRESHNESS_THRESHOLDS.COMPANY_DAYS;

  if (ageDays <= thresholds.FRESH) return "FRESH";
  if (ageDays <= thresholds.AGING) return "AGING";
  return "STALE";
}
