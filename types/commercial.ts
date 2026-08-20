/**
 * CANONICAL COMMERCIAL INTELLIGENCE DATA MODEL — PRODUCTION INTELLIGENCE V1.5.1
 * Misterio Color Lab
 * 
 * V1.5.1 Evidence Quality & Source Hardening
 * Adds atomic ExtractedClaims, SignalProcessingStage pipeline, SourceHealth metrics,
 * and strict temporal event date separation.
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

export type ScanFrequency = "HIGH_PRIORITY" | "STANDARD" | "DAILY" | "WEEKLY";

export type MarketDataSourceMode = "LIVE_DATA" | "RECENTLY_SCANNED" | "IN_MEMORY_FALLBACK" | "SOURCE_ERROR";

export type SourceHealthStatus = "HEALTHY" | "DEGRADED" | "BLOCKED" | "UNAVAILABLE";

export type SignalProcessingStage =
  | "FETCH_SUCCESS"
  | "CONTENT_VALID"
  | "CLAIM_EXTRACTED"
  | "CLAIM_VERIFIED"
  | "EVENT_ACCEPTED"
  | "EVENT_REJECTED"
  | "FETCHED_BUT_NOT_EVIDENCE";

export type EntityResolutionStatus = "MATCH" | "POSSIBLE_MATCH" | "NEW_ENTITY_CANDIDATE" | "ENTITY_UNRESOLVED";

export type ChangeType =
  | "NEW_PROJECT_ANNOUNCED"
  | "PROJECT_ENTERED_PRODUCTION"
  | "PROJECT_ENTERED_POST"
  | "PROJECT_RELEASED"
  | "PROJECT_CANCELLED"
  | "NEW_DECISION_MAKER"
  | "ROLE_CHANGED"
  | "PERSON_DEPARTURE"
  | "SIGNAL_SUPERSEDED"
  | "DATA_CONFLICT_DETECTED"
  | "SALES_READINESS_CHANGED";

export interface ExtractedClaim {
  id: string;
  claimType:
    | "PROJECT_STATUS"
    | "PROJECT_RELEASE_DATE"
    | "PROJECT_POST_PRODUCTION"
    | "PROJECT_PRODUCTION_START"
    | "PERSON_CURRENT_ROLE"
    | "PERSON_DEPARTURE";
  subject: string;       // e.g. "Morena Films" or "La Infiltrada"
  predicate: string;     // e.g. "entered_phase"
  object: string;        // e.g. "POST_PRODUCTION"
  eventDate?: string;    // Actual real-world event timestamp
  publishedAt: string;   // Article publication timestamp
  source: string;
  sourceTier: SourceTier;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  evidenceSnippet: string;
  verificationStatus: "VERIFIED" | "CONTRADICTED" | "UNVERIFIED" | "REJECTED";
}

export interface MarketSource {
  id: string;
  name: string;
  url: string;
  sourceTier: SourceTier;
  sourceType: "OFFICIAL_PRODUCTION_COMPANY" | "TRADE_PRESS" | "INDUSTRY_DATABASE" | "FESTIVAL" | "GOVERNMENT" | "GENERAL_NEWS";
  enabled: boolean;
  scanFrequency: ScanFrequency;
  lastScannedAt?: string;
  nextScanAt?: string;
  reliabilityScore: number;
  rateLimitPerMin: number;
  lastEtag?: string;
  lastModified?: string;
  status: "CONNECTED" | "DEGRADED" | "CONFIG_REQUIRED" | "DISABLED";
  healthStatus: SourceHealthStatus;
  lastSuccessfulFetch?: string;
  lastContentValidFetch?: string;
  lastEvidenceAccepted?: string;
  consecutiveFailures: number;
}

export interface RawSignal {
  id: string;
  sourceId: string;
  url?: string;
  finalUrl?: string;
  httpStatus?: number;
  contentType?: string;
  contentLength?: number;
  title: string;
  contentSummary?: string;
  publishedAt: string;
  eventDate?: string;
  extractedAt: string;
  fingerprint: string;
  sourceTier: SourceTier;
  entityName?: string;
  projectTitle?: string;
  personName?: string;
  roleTitle?: string;
  proposedStatus?: string;
  status: "NEW" | "PROCESSED" | "DUPLICATE" | "REJECTED" | "ERROR";
  processingStage: SignalProcessingStage;
  entityResolutionStatus: EntityResolutionStatus;
  evidenceSnippet?: string;
  errorReason?: string;
  extractedClaims?: ExtractedClaim[];
}

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
  eventDate: string;     // Real-world occurrence date
  publishedAt?: string;  // Publication date
  extractedAt?: string;
  source: string;
  url?: string;
  sourceTier: SourceTier;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  isEvidenceBased: boolean;
  claim: string;
  previousState?: ProjectLifecycleState;
  resultingState?: ProjectLifecycleState;
  status?: "PROPOSED" | "VERIFIED" | "REJECTED" | "SUPERSEDED";
}

export interface PersonEvent {
  id: string;
  personId?: string;
  personName: string;
  companyName: string;
  eventType: "PERSON_JOINED" | "PERSON_LEFT" | "ROLE_STARTED" | "ROLE_ENDED" | "ROLE_CHANGED";
  previousRole?: string;
  newRole?: string;
  eventDate: string;
  source: string;
  sourceTier: SourceTier;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  isEvidenceBased: boolean;
  status: "VERIFIED" | "INFERRED" | "UNVERIFIED";
}

export interface WhatChangedEntry {
  id: string;
  changeType: ChangeType;
  entityId: string;
  entityType: "project" | "company" | "person" | "signal" | "opportunity";
  entityName: string;
  companyName: string;
  detectedAt: string;
  sourceName: string;
  sourceTier: SourceTier;
  previousValue?: string;
  newValue?: string;
  factSummary: string; // EVIDENCE FACT (isEvidenceBased: true)
  commercialImpact: string; // AI SUGGESTION (isEvidenceBased: false)
  salesReadinessBefore?: SalesReadiness;
  salesReadinessAfter?: SalesReadiness;
  isEvidenceBased: boolean;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface MarketScanResult {
  scanId: string;
  startedAt: string;
  completedAt: string;
  mode: MarketDataSourceMode;
  sourcesScanned: number;
  documentsFound: number;
  newSignals: number;
  duplicateSignals: number;
  claimsExtracted: number;
  claimsVerified: number;
  eventsDetected: number;
  conflictsDetected: number;
  opportunitiesChanged: number;
  changesGenerated: WhatChangedEntry[];
  errors: { sourceId: string; message: string; timestamp: string }[];
}

export interface EvidenceQualityAuditMetrics {
  sourcesFetched: number;
  validContentCount: number;
  invalidContentCount: number;
  claimsExtractedCount: number;
  claimsVerifiedCount: number;
  claimsRejectedCount: number;
  eventsAcceptedCount: number;
  eventsRejectedCount: number;
  conflictsCount: number;
  unresolvedEntitiesCount: number;
  signalsSupersededCount: number;
  salesReadinessChangesCount: number;
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
  totalScore: number;
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
  isEvidenceBased: boolean;
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
  isFact: boolean;
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
  identityConfidence: number;
  currentRoleConfidence: number;
  commercialRelevance: CommercialRelevanceLevel;
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
  signalStatus?: SignalStatus;
}

export interface HistoricalSignal {
  id: string;
  title: string;
  originalPhase: string;
  discoveredAt: string;
  supersededByEvent?: string;
  supersededAt?: string;
  status: SignalStatus;
}

export interface AuditLogEntry {
  id: string;
  previousStatus: SalesReadiness;
  newStatus: SalesReadiness;
  reason: string;
  timestamp: string;
  evidenceClaim?: string;
  triggeredBy?: string;
}

export interface TopCommercialTarget {
  id: string;
  category: CommercialTargetCategory;
  salesReadiness: SalesReadiness;
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
    score: number;
    reasoning: string;
  };
  relevantProject?: {
    id: string;
    title: string;
    status: string;
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
    isEvidenceBased: boolean;
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
  dataConflict?: DataConflictEntry | null;
  disclaimer: string;
  lastVerifiedAt: string;
  nextVerificationAt: string;
  auditLog: AuditLogEntry[];
}
