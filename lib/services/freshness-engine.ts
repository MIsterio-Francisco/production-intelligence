/**
 * FRESHNESS & PROJECT LIFECYCLE ENGINE — PRODUCTION INTELLIGENCE V1.4
 * Misterio Color Lab
 * 
 * Evaluates real data freshness, project event timeline, and lifecycle states.
 * Differentiates HISTORICAL DISCOVERY SIGNAL vs CURRENT PROJECT STATE.
 * Implements deterministic event precedence and signal superseding rules.
 */

import {
  DataFreshness,
  ProjectLifecycleState,
  ProjectEvent,
  SignalStatus,
  EvidenceTemporalStatus,
  CommercialEvidence,
  HistoricalSignal,
  CommercialWhyNowTrigger,
} from "../../types/commercial";

export type ProjectActivityStatus =
  | "PROJECT_ACTIVE"     // Active production/post-production with recent verified activity
  | "PROJECT_RECENT"     // Active project with activity within 90-180 days
  | "PROJECT_STALE"      // Activity date > 180 days without recent update
  | "PROJECT_COMPLETED"  // Project has finished or been released
  | "PROJECT_UNKNOWN";   // Insufficient date or activity data

export interface DateSourceMetadata {
  date?: string | null;
  dateType: "production_status_date" | "announcement_date" | "release_date" | "retrieved_at";
  sourceName: string;
  sourceType: "official" | "trade_press" | "database" | "unverified";
  extractedAt: string;
  expiresAt?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * Event Precedence Rank
 * Higher rank = later lifecycle phase, supersedes earlier phases if date is >=
 */
const EVENT_PRECEDENCE: Record<string, number> = {
  UNKNOWN_STATUS: 0,
  PROJECT_ANNOUNCED: 10,
  PRE_PRODUCTION_STARTED: 20,
  PROJECT_DELAYED: 25,
  PRODUCTION_STARTED: 30,
  PRODUCTION_COMPLETED: 40,
  POST_PRODUCTION_STARTED: 50,
  POST_PRODUCTION_COMPLETED: 60,
  FESTIVAL_PREMIERE: 70,
  THEATRICAL_PREMIERE: 80,
  THEATRICAL_RELEASE: 90,
  STREAMING_RELEASE: 90,
  PROJECT_COMPLETED: 100,
  PROJECT_CANCELLED: 100,
  PROJECT_SHELVED: 100,
};

/**
 * Evaluates the CURRENT project lifecycle state based on the latest verified event timeline.
 */
export function evaluateCurrentProjectState(project?: any, events: ProjectEvent[] = []): {
  currentState: ProjectLifecycleState;
  latestEvent?: ProjectEvent;
  activityStatus: ProjectActivityStatus;
  freshness: DataFreshness;
  metadata: DateSourceMetadata;
} {
  if (!project) {
    return {
      currentState: "UNKNOWN",
      activityStatus: "PROJECT_UNKNOWN",
      freshness: "UNKNOWN",
      metadata: {
        dateType: "production_status_date",
        sourceName: "None",
        sourceType: "unverified",
        extractedAt: new Date().toISOString(),
        confidence: "LOW",
      },
    };
  }

  const rawStatus = (project.status || "").toLowerCase().trim();
  const dateStr = project.announced_at || project.release_date || project.updated_at || project.created_at;
  const extractedAt = project.updated_at || new Date().toISOString();
  const expiresAt = new Date(new Date(extractedAt).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

  // If explicit project events are provided, find the latest verified event by eventDate / precedence
  if (events && events.length > 0) {
    const validEvents = events
      .filter((e) => e.isEvidenceBased && e.confidence !== "LOW")
      .sort((a, b) => {
        const timeA = new Date(a.eventDate || a.publishedAt || 0).getTime();
        const timeB = new Date(b.eventDate || b.publishedAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA; // Most recent first
        return (EVENT_PRECEDENCE[b.eventType] || 0) - (EVENT_PRECEDENCE[a.eventType] || 0);
      });

    if (validEvents.length > 0) {
      const topEvent = validEvents[0];
      let state: ProjectLifecycleState = topEvent.resultingState || "UNKNOWN";

      if (!topEvent.resultingState) {
        if (topEvent.eventType === "THEATRICAL_RELEASE" || topEvent.eventType === "STREAMING_RELEASE") {
          state = "RELEASED";
        } else if (topEvent.eventType === "PROJECT_COMPLETED" || topEvent.eventType === "PRODUCTION_COMPLETED") {
          state = "COMPLETED";
        } else if (topEvent.eventType === "POST_PRODUCTION_STARTED") {
          state = "POST_PRODUCTION";
        } else if (topEvent.eventType === "PRODUCTION_STARTED") {
          state = "IN_PRODUCTION";
        } else if (topEvent.eventType === "PRE_PRODUCTION_STARTED") {
          state = "PRE_PRODUCTION";
        } else if (topEvent.eventType === "PROJECT_CANCELLED") {
          state = "CANCELLED";
        } else if (topEvent.eventType === "PROJECT_SHELVED") {
          state = "SHELVED";
        }
      }

      const isFinished = state === "RELEASED" || state === "COMPLETED" || state === "CANCELLED" || state === "SHELVED";
      const activityStatus: ProjectActivityStatus = isFinished
        ? "PROJECT_COMPLETED"
        : state === "POST_PRODUCTION" || state === "IN_PRODUCTION"
        ? "PROJECT_ACTIVE"
        : "PROJECT_RECENT";

      return {
        currentState: state,
        latestEvent: topEvent,
        activityStatus,
        freshness: isFinished ? "STALE" : "CURRENT",
        metadata: {
          date: topEvent.eventDate,
          dateType: isFinished ? "release_date" : "production_status_date",
          sourceName: topEvent.source,
          sourceType: topEvent.sourceTier === "TIER_1_OFFICIAL" ? "official" : "trade_press",
          extractedAt: topEvent.extractedAt || extractedAt,
          expiresAt,
          confidence: topEvent.confidence,
        },
      };
    }
  }

  // Fallback to project record properties if no event timeline array provided
  const metadata: DateSourceMetadata = {
    date: dateStr,
    dateType: rawStatus === "released" || rawStatus === "completed" ? "release_date" : "production_status_date",
    sourceName: project.sources?.[0]?.source_name || "Trade Press Slate Monitor",
    sourceType: project.provenance_type === "verified" ? "official" : "trade_press",
    extractedAt,
    expiresAt,
    confidence: project.provenance_type === "verified" ? "HIGH" : "MEDIUM",
  };

  let currentState: ProjectLifecycleState = "POST_PRODUCTION";

  if (rawStatus === "completed" || rawStatus === "released") {
    currentState = rawStatus === "released" ? "RELEASED" : "COMPLETED";
    return {
      currentState,
      activityStatus: "PROJECT_COMPLETED",
      freshness: "STALE",
      metadata,
    };
  }

  if (rawStatus === "production" || rawStatus === "filming") {
    currentState = "IN_PRODUCTION";
  } else if (rawStatus === "post_production" || rawStatus === "finishing") {
    currentState = "POST_PRODUCTION";
  } else if (rawStatus === "pre_production") {
    currentState = "PRE_PRODUCTION";
  }

  if (!dateStr) {
    return {
      currentState,
      activityStatus: "PROJECT_UNKNOWN",
      freshness: "UNKNOWN",
      metadata,
    };
  }

  const time = new Date(dateStr).getTime();
  if (isNaN(time)) {
    return {
      currentState,
      activityStatus: "PROJECT_UNKNOWN",
      freshness: "UNKNOWN",
      metadata,
    };
  }

  const diffDays = Math.abs(Date.now() - time) / (1000 * 60 * 60 * 24);

  let freshness: DataFreshness = "CURRENT";
  let activityStatus: ProjectActivityStatus = "PROJECT_ACTIVE";

  if (diffDays <= 90) {
    freshness = "CURRENT";
    activityStatus = "PROJECT_ACTIVE";
  } else if (diffDays <= 180) {
    freshness = "RECENT";
    activityStatus = "PROJECT_RECENT";
  } else {
    freshness = "STALE";
    activityStatus = "PROJECT_STALE";
  }

  return {
    currentState,
    activityStatus,
    freshness,
    metadata,
  };
}

export function evaluateProjectActivity(project?: any): {
  activityStatus: ProjectActivityStatus;
  freshness: DataFreshness;
  timelineStage: string;
  metadata: DateSourceMetadata;
  currentState: ProjectLifecycleState;
} {
  const res = evaluateCurrentProjectState(project);
  return {
    ...res,
    timelineStage: res.currentState,
  };
}

/**
 * Invalidates historical / obsolete signals when posterior events or releases supersede them.
 */
export function invalidateObsoleteSignals(
  whyNow?: CommercialWhyNowTrigger,
  events: ProjectEvent[] = [],
  currentState: ProjectLifecycleState = "UNKNOWN"
): {
  isWhyNowActive: boolean;
  whyNowStatus: SignalStatus;
  historicalSignals: HistoricalSignal[];
  reason?: string;
} {
  const historicalSignals: HistoricalSignal[] = [];

  // Check if current project lifecycle state is finished/released
  const isFinishedState =
    currentState === "RELEASED" ||
    currentState === "COMPLETED" ||
    currentState === "CANCELLED" ||
    currentState === "SHELVED";

  if (whyNow) {
    // Check if whyNow title indicates pre-production or old phase while latest state is RELEASED / COMPLETED
    const isPreProdSignal =
      whyNow.title.toLowerCase().includes("pre-production") ||
      whyNow.title.toLowerCase().includes("preproducción") ||
      whyNow.signalType === "PROJECT_PRE_PRODUCTION";

    if (isFinishedState || (isPreProdSignal && (isFinishedState || currentState === "IN_PRODUCTION" || currentState === "POST_PRODUCTION"))) {
      const status: SignalStatus = isFinishedState ? "SUPERSEDED" : "HISTORICAL";
      const reason = isFinishedState
        ? `Historical pre-production/production signal superseded by theatrical/streaming release evidence.`
        : `Signal superseded by later project phase advancement.`;

      historicalSignals.push({
        id: `sig_hist_${Date.now()}`,
        title: whyNow.title,
        originalPhase: "pre_production",
        discoveredAt: whyNow.timestamp,
        supersededByEvent: `Current State: ${currentState}`,
        supersededAt: new Date().toISOString(),
        status,
      });

      return {
        isWhyNowActive: false,
        whyNowStatus: status,
        historicalSignals,
        reason,
      };
    }
  }

  return {
    isWhyNowActive: true,
    whyNowStatus: "ACTIVE",
    historicalSignals,
  };
}

/**
 * Verifies if an evidence claim is temporally valid (not superseded or stale).
 */
export function isEvidenceCurrent(evidence: CommercialEvidence): EvidenceTemporalStatus {
  if (!evidence.extractedAt && !evidence.publishedAt) {
    return "UNKNOWN";
  }

  const dateStr = evidence.publishedAt || evidence.extractedAt;
  const time = new Date(dateStr!).getTime();

  if (isNaN(time)) return "UNKNOWN";

  const diffDays = (Date.now() - time) / (1000 * 60 * 60 * 24);

  if (diffDays > 180) {
    return "STALE";
  }

  return "CURRENT";
}

/**
 * Extracts and filters the latest verified project evidence, filtering out obsolete/superseded claims.
 */
export function getLatestVerifiedProjectEvidence(
  evidences: CommercialEvidence[],
  currentState: ProjectLifecycleState
): CommercialEvidence[] {
  return evidences.map((ev) => {
    const tempStatus = isEvidenceCurrent(ev);
    const isObsolete =
      (currentState === "RELEASED" || currentState === "COMPLETED") &&
      ev.claim.toLowerCase().includes("pre-production");

    return {
      ...ev,
      temporalStatus: isObsolete ? "HISTORICAL" : tempStatus,
    };
  });
}
