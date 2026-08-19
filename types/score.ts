export interface ScoreBreakdown {
  power_score: number;
  creative_score: number;
  commercial_score: number;
  momentum_score: number;
  international_score: number;
  social_score: number;
  mcl_match_score: number;
  score_confidence: number;
}

export type OpportunityTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface OpportunitySignal {
  company_id: string;
  company_name: string;
  opportunity_score: number;
  mcl_match_score: number;
  tier: OpportunityTier;
  recent_signal: string;
  reason: string;
  recommended_contact: string;
  time_sensitivity: "LOW" | "MEDIUM" | "HIGH";
}
