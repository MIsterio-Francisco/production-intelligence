/**
 * FRESHNESS & PROJECT ACTIVITY ENGINE — PRODUCTION INTELLIGENCE V1.3
 * Misterio Color Lab
 * 
 * Evaluates real data freshness, event timeline, and activity status based on explicit source metadata.
 * Differentiates PROJECT_EXISTENCE != PROJECT_ACTIVITY != PROJECT_FRESHNESS.
 */

import { DataFreshness } from "../../types/commercial";

export type ProjectActivityStatus =
  | "PROJECT_ACTIVE"     // Active production/post-production with recent verified activity
  | "PROJECT_RECENT"     // Active project with activity within 90-180 days
  | "PROJECT_STALE"      // Activity date > 180 days without recent update
  | "PROJECT_COMPLETED"  // Project has finished or been released
  | "PROJECT_UNKNOWN";   // Insufficient date or activity data

export type ProjectTimelineStage =
  | "PROJECT_ANNOUNCED"
  | "PRE_PRODUCTION"
  | "SHOOTING"
  | "WRAP"
  | "POST_PRODUCTION"
  | "COLOR"
  | "MASTERING"
  | "DELIVERIES"
  | "FESTIVAL"
  | "RELEASE"
  | "COMPLETED";

export interface DateSourceMetadata {
  date?: string | null;
  dateType: "production_status_date" | "announcement_date" | "release_date" | "retrieved_at";
  sourceName: string;
  sourceType: "official" | "trade_press" | "database" | "unverified";
  extractedAt: string;
  expiresAt?: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export function evaluateProjectActivity(project?: any): {
  activityStatus: ProjectActivityStatus;
  timelineStage: ProjectTimelineStage;
  freshness: DataFreshness;
  metadata: DateSourceMetadata;
} {
  if (!project) {
    return {
      activityStatus: "PROJECT_UNKNOWN",
      timelineStage: "PROJECT_ANNOUNCED",
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

  // Expiration calculation: 180 days from extractedAt
  const expiresAt = new Date(new Date(extractedAt).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

  const metadata: DateSourceMetadata = {
    date: dateStr,
    dateType: rawStatus === "released" || rawStatus === "completed" ? "release_date" : "production_status_date",
    sourceName: project.sources?.[0]?.source_name || "Trade Press Slate Monitor",
    sourceType: project.provenance_type === "verified" ? "official" : "trade_press",
    extractedAt,
    expiresAt,
    confidence: project.provenance_type === "verified" ? "HIGH" : "MEDIUM",
  };

  let timelineStage: ProjectTimelineStage = "POST_PRODUCTION";

  if (rawStatus === "completed" || rawStatus === "released") {
    timelineStage = "COMPLETED";
    return {
      activityStatus: "PROJECT_COMPLETED",
      timelineStage: "COMPLETED",
      freshness: "STALE",
      metadata,
    };
  }

  if (rawStatus === "production" || rawStatus === "filming") {
    timelineStage = "SHOOTING";
  } else if (rawStatus === "post_production" || rawStatus === "finishing") {
    timelineStage = "POST_PRODUCTION";
  } else if (rawStatus === "pre_production") {
    timelineStage = "PRE_PRODUCTION";
  }

  if (!dateStr) {
    return {
      activityStatus: "PROJECT_UNKNOWN",
      timelineStage,
      freshness: "UNKNOWN",
      metadata,
    };
  }

  const time = new Date(dateStr).getTime();
  if (isNaN(time)) {
    return {
      activityStatus: "PROJECT_UNKNOWN",
      timelineStage,
      freshness: "UNKNOWN",
      metadata,
    };
  }

  const diffDays = Math.abs(Date.now() - time) / (1000 * 60 * 60 * 24);

  if (diffDays <= 90) {
    return {
      activityStatus: "PROJECT_ACTIVE",
      timelineStage,
      freshness: "CURRENT",
      metadata,
    };
  } else if (diffDays <= 180) {
    return {
      activityStatus: "PROJECT_RECENT",
      timelineStage,
      freshness: "RECENT",
      metadata,
    };
  } else {
    return {
      activityStatus: "PROJECT_STALE",
      timelineStage,
      freshness: "STALE",
      metadata,
    };
  }
}
