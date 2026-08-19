export const SCORING_ENGINE_VERSION = "v1.0";

export type ScoreStatus = "CALCULATED" | "INSUFFICIENT_DATA";

export type ConfidenceTier = "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE" | "INSUFFICIENT_DATA";

export interface ScoreComponentResult {
  score: number | null; // 0 - 100 or null if INSUFFICIENT_DATA
  status: ScoreStatus;
  confidence: number; // 0 - 100
}

export interface ScoreBreakdown {
  productionScale: number;
  creative: number;
  commercial: number;
  momentum: number;
  international: number;
  social: number | null;
  postVfxOpportunity: number;
  relationshipAccessibility: number;
}

export interface ScoreExplanation {
  drivers: string[];
  limitations: string[];
}

export interface ComprehensiveScoreResult {
  companyId: string;
  engineVersion: string;
  calculatedAt: string;
  powerScore: number;
  creativeScore: number;
  commercialScore: number;
  momentumScore: number;
  internationalScore: number;
  socialScore: number | null;
  mclMatchScore: number;
  confidence: number;
  confidenceTier: ConfidenceTier;
  breakdown: ScoreBreakdown;
  explanation: ScoreExplanation;
}

export interface CompanyScoringInput {
  id: string;
  name: string;
  country_code: string | null;
  company_type: string | null;
  employee_count_min: number | null;
  employee_count_max: number | null;
  founded_year: number | null;
  is_active: boolean;
  categories: string[];
  projects: {
    id: string;
    project_type: string | null;
    status: string | null;
    country_code?: string | null;
    budget_min: number | null;
    budget_max: number | null;
    release_date: string | null;
    company_role: string | null;
  }[];
  people: {
    id: string;
    role: string | null;
    seniority: string | null;
    is_current: boolean;
  }[];
  events: {
    id: string;
    event_type: string;
    event_date: string;
    importance_score: number | null;
  }[];
  awards: {
    id: string;
    organization: string | null;
    category: string | null;
    result: string | null;
    year: number | null;
  }[];
  socialProfiles: {
    platform: string;
    follower_count: number | null;
    engagement_rate: number | null;
  }[];
}
