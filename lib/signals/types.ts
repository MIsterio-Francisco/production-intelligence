export type SignalType =
  | "NEW_PROJECT"
  | "PROJECT_ENTERED_PRODUCTION"
  | "PROJECT_ENTERED_POST"
  | "PROJECT_COMPLETED"
  | "PROJECT_RELEASED"
  | "NEW_EXECUTIVE"
  | "EXECUTIVE_DEPARTURE"
  | "AWARD_WIN"
  | "FESTIVAL_SELECTION"
  | "DISTRIBUTION_DEAL"
  | "STREAMING_DEAL"
  | "INTERNATIONAL_EXPANSION"
  | "PARTNERSHIP"
  | "ACQUISITION"
  | "FINANCING"
  | "MOMENTUM_SPIKE"
  | "MCL_OPPORTUNITY"
  | "SCORE_CHANGE"
  | "SOCIAL_GROWTH"
  | "COMMERCIAL_OPPORTUNITY";

export type SignalSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type SignalStatus = "ACTIVE" | "ACKNOWLEDGED" | "DISMISSED" | "EXPIRED";

export interface IntelligenceSignal {
  id?: string;
  company_id: string;
  project_id?: string | null;
  person_id?: string | null;
  signal_type: SignalType;
  severity: SignalSeverity;
  signal_score: number; // 0 - 100
  confidence: number; // 0 - 100
  status: SignalStatus;
  signal_title: string;
  signal_description: string;
  signal_date: string;
  detected_at?: string;
  expires_at: string;
  source_id?: string | null;
  dedupe_key: string;
  evidence: {
    claim?: string;
    facts?: string[];
    mclMatchScore?: number;
    momentumScore?: number;
    powerScore?: number;
    previousScore?: number;
    currentScore?: number;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
}
