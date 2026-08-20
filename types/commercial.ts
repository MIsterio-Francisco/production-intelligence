/**
 * CANONICAL COMMERCIAL INTELLIGENCE DATA MODEL — PRODUCTION INTELLIGENCE V1.4
 * Misterio Color Lab
 */

export type DataFreshness = "CURRENT" | "RECENT" | "STALE" | "UNKNOWN";

export type EvidenceClassification = "VERIFIED_FACT" | "SEED_DATA" | "AI_INFERENCE" | "UNKNOWN";

export type ServiceFitLevel = "VERIFIED_FIT" | "PROBABLE_FIT" | "POSSIBLE_FIT" | "UNKNOWN";

export type ServiceNeedType = "CONFIRMED_NEED" | "POTENTIAL_FIT" | "UNSUPPORTED";

export type CommercialTargetCategory =
  | "PRIORITY_TARGET"     // Verified project + Fresh evidence + Verified Contact + High MCL fit + Valid Why Now
  | "CONTACTABLE_TARGET font-medium"  // Active project + Verified Contact + Evidence
  | "RESEARCH_TARGET flex"     // Potential opportunity, missing verified contact or evidence
  | "DISCOVERY_TARGET";   // Weak opportunity or no verified active project

export type SalesReadiness =
  | "CALL_NOW"          // 🟢 Priority outreach ready (Target + Contact + Why Now)
  | "CONTACT_SOON"      // 🟡 Active opportunity in pipeline maturation
  | "RESEARCH_FIRST"    // 🔵 Potential opportunity requiring contact research
  | "DO_NOT_CONTACT";   // 🔴 Completed or unverified data

export type DecisionMakerCategory =
  | "DIRECT_DECISION_MAKER"  // Head of Post, Post Producer
  | "LIKELY_INFLUENCER"      // Head of Production, Executive Producer, Producer
  | "RELEVANT_CONTACT"       // Founder, CEO, Managing Director
  | "CREATIVE_CONTACT"       // Director, DoP
  | "UNKNOWN";

export type CommercialRelevanceLevel = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export type SourceTier = "TIER_1_OFFICIAL" | "TIER_2_TRADE_PRESS" | "TIER_3_SECONDARY" | "UNKNOWN";

export type ProjectLifecycleState =
  | "ANNOUNCED"
  | "PRE_PRODUCTION"
  | "IN_PRODUCTION"
  | "POST_PRODUCTION"
  | "COMPLETED"
  | "RELEASED"
  | "CANCELLED"
  | "SHELVED"
  | "UNKNOWN";

export type SignalStatus =
  | "ACTIVE"
  | "HISTORICAL"
  | "SUPERSEDED"
  | "STALE"
  | "CONFLICT"
  | "INVALID";

export type EvidenceTemporalStatus =
  | "CURRENT"
  | "HISTORICAL"
  | "STALE"
  | "CONFLICT"
  | "UNKNOWN";

export interface ProjectEvent {
  id: string;
  projectId: string;
  eventType:
    | "PROJECT_ANNOUNCED"
    | "PRE_PRODUCTION_STARTED"
    | "PRODUCTION_STARTED"
    | "PRODUCTION_COMPLETED"
    | "POST_PRODUCTION_STARTED"
    | "POST_PRODUCTION_COMPLETED"
    | "FESTIVAL_PREMIERE"
    | "THEATRICAL_PREMIERE"
    | "THEATRICAL_RELEASE"
    | "STREAMING_RELEASE"
    | "PROJECT_COMPLETED"
    | "PROJECT_CANCELLED"
    | "PROJECT_SHELVED"
    | "PROJECT_DELAYED"
    | "PROJECT_REACTIVATED"
    | "UNKNOWN_STATUS";
  eventDate: string;
  publishedAt?: string;
  extractedAt?: string;
  source: string;
  url?: string;
  sourceTier: SourceTier;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  isEvidenceBased: boolean;
  claim: string;
  previousState?: ProjectLifecycleState;
  resultingState?: ProjectLifecycleState;
}

export interface MCLServiceDefinition {
  serviceId: string;
  serviceName: string;
  category: "COLOR_GRADING" | "MASTERING" | "DAILIES" | "POST_SUPERVISION" | "VFX" | "SOUND" | "ARCHIVING";
  description: string;
  officialSourceUrl: string;
  isActive: boolean;
  idealProductionPhases: string[];
  idealProjectTypes: string[];
}

export interface ScoreComponent {
  label: string;
  points: number;
  maxPoints: number;
  reason: string;
}

export interface TargetScoreBreakdown {
  totalScore: number; // 0-100
  components: ScoreComponent[];
  explanation: string;
}

export interface CommercialEvidence {
  id: string;
  type: string;
  claim: string;
  sourceName: string;
  sourceType: string;
  credibilityScore: number;
  url?: string;
  sourceTier: SourceTier;
  evidenceType: "OFFICIAL_ANNNOUNCEMENT" | "SLATE_CATALOG" | "EXECUTIVE_ROSTER" | "TRADE_NEWS";
  provenanceType: "verified" | "seed" | "synthetic" | "inferred";
  classification: EvidenceClassification;
  publishedAt?: string;
  extractedAt?: string;
  expiresAt?: string;
  temporalStatus?: EvidenceTemporalStatus;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  isEvidenceBased: boolean; // false for AI suggestions
}

export interface DataConflictEntry {
  id: string;
  targetId: string;
  claimType: string;
  previousValue: string;
  newValue: string;
  previousSource: string;
  newSource: string;
  detectedAt: string;
  reason: string;
  resolutionStatus: "OPEN" | "RESOLVED" | "IGNORED_WITH_REASON";
}

export interface CommercialNeedRecommendation {
  serviceId: string;
  serviceName: string;
  fitLevel: ServiceFitLevel;
  needType: ServiceNeedType;
  reasoning: string;
  isFact: boolean; // false if inferred/potential
}

export interface CommercialDecisionMakerContact {
  id: string;
  fullName: string;
  companyName: string;
  currentRole: string;
  category: DecisionMakerCategory;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  source: string;
  freshness: DataFreshness;
  identityConfidence: number;      // 0-100 (Person exists)
  currentRoleConfidence: number;   // 0-100 (Role is currently active)
  commercialRelevance: CommercialRelevanceLevel; // HIGH for Head of Post, LOW for CEO without prod role
  relevanceReasoning: string;
  isContactableNow: boolean;
}

export interface CommercialWhyNowTrigger {
  signalType: string;
  title: string;
  timestamp: string;
  sourceName: string;
  sourceType: string;
  url?: string;
  freshness: DataFreshness;
  hasTemporalEvidence: boolean;
  signalStatus?: SignalStatus; // ACTIVE vs SUPERSEDED
}

export interface HistoricalSignal {
  id: string;
  title: string;
  originalPhase: string;
  discoveredAt: string;
  supersededByEvent?: string;
  supersededAt?: string;
  status: SignalStatus; // SUPERSEDED, STALE, HISTORICAL
}

export interface AuditLogEntry {
  id: string;
  previousStatus: SalesReadiness;
  newStatus: SalesReadiness;
  reason: string;
  timestamp: string;
  evidenceClaim?: string;
}

export interface TopCommercialTarget {
  id: string; // companyId
  category: CommercialTargetCategory;
  salesReadiness: SalesReadiness; // Independent V1.4 Sales Readiness Dimension
  salesReadinessReasoning: string;
  company: {
    id: string;
    name: string;
    slug: string;
    countryCode: string;
    websiteUrl?: string;
  };
  targetScore: TargetScoreBreakdown;
  confidence: {
    level: "HIGH" | "MEDIUM" | "LOW";
    score: number; // 0-100
    reasoning: string;
  };
  relevantProject?: {
    id: string;
    title: string;
    status: string; // e.g. "production", "post_production", "released"
    currentLifecycleState: ProjectLifecycleState;
    projectType: string;
    releaseDate?: string;
    directorName?: string;
    freshness: DataFreshness;
    events?: ProjectEvent[];
  };
  historicalSignals?: HistoricalSignal[];
  potentialService?: CommercialNeedRecommendation;
  recommendedContact?: CommercialDecisionMakerContact;
  whyNow?: CommercialWhyNowTrigger;
  evidences: CommercialEvidence[];
  recommendedAction: {
    actionText: string;
    isEvidenceBased: boolean; // true if derived from facts, false if AI suggestion
    actionType: "CONTACT_PRODUCER" | "OFFER_SHOW_LUT" | "PROPOSE_POST_SUPERVISION" | "SUBMIT_MASTERING_QUOTE" | "GENERAL_INTRO";
    label: "EVIDENCE FACT" | "AI SUGGESTION";
  };
  callOpening?: {
    openingText: string;
    whyThisCompany: string;
    whyNow: string;
    whoToAskFor: string;
    mclOffer: string;
    validationQuestion: string;
  };
  freshness: DataFreshness;
  hasInsufficientData: boolean;
  dataConflict?: DataConflictEntry | null; // OPEN conflict blocks CALL_NOW
  disclaimer: string; // "NO SE CONTACTAN PERSONAS SIN EVIDENCIA SUFICIENTE"
  lastVerifiedAt: string;
  nextVerificationAt: string;
  auditLog: AuditLogEntry[];
}
