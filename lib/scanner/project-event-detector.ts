/**
 * PROJECT EVENT DETECTOR — PRODUCTION INTELLIGENCE V1.5
 * Misterio Color Lab
 * 
 * Extracts structured project lifecycle events from normalized raw signals.
 * Never overwrites past events; appends to the immutable event timeline.
 */

import { RawSignal, ProjectEvent, ProjectLifecycleState } from "../../types/commercial";

export class ProjectEventDetector {
  /**
   * Analyzes a raw market signal and attempts to detect a verified project event.
   */
  public static detectProjectEvent(signal: RawSignal): ProjectEvent | null {
    const text = `${signal.title} ${signal.contentSummary || ""}`.toLowerCase();

    let eventType: ProjectEvent["eventType"] | null = null;
    let resultingState: ProjectLifecycleState | undefined = undefined;

    if (text.includes("estreno en cines") || text.includes("theatrical release") || text.includes("premieres in theaters")) {
      eventType = "THEATRICAL_RELEASE";
      resultingState = "RELEASED";
    } else if (text.includes("streaming release") || text.includes("disponible en netflix") || text.includes("disponible en max")) {
      eventType = "STREAMING_RELEASE";
      resultingState = "RELEASED";
    } else if (text.includes("post-production") || text.includes("posproducción") || text.includes("picture finishing") || text.includes("color grading")) {
      eventType = "POST_PRODUCTION_STARTED";
      resultingState = "POST_PRODUCTION";
    } else if (text.includes("begins filming") || text.includes("comienza el rodaje") || text.includes("principal photography") || text.includes("production started")) {
      eventType = "PRODUCTION_STARTED";
      resultingState = "IN_PRODUCTION";
    } else if (text.includes("pre-production") || text.includes("preproducción") || text.includes("in development")) {
      eventType = "PRE_PRODUCTION_STARTED";
      resultingState = "PRE_PRODUCTION";
    } else if (text.includes("cancelled") || text.includes("cancelado") || text.includes("shelved")) {
      eventType = "PROJECT_CANCELLED";
      resultingState = "CANCELLED";
    } else if (text.includes("announced") || text.includes("anunciado")) {
      eventType = "PROJECT_ANNOUNCED";
      resultingState = "ANNOUNCED";
    }

    if (!eventType) return null;

    const confidence = signal.sourceTier === "TIER_1_OFFICIAL" ? "HIGH" : signal.sourceTier === "TIER_2_TRADE_PRESS" ? "HIGH" : "MEDIUM";

    return {
      id: `ev_det_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: signal.projectTitle || signal.entityName || "unknown_project",
      eventType,
      eventDate: signal.publishedAt,
      publishedAt: signal.publishedAt,
      extractedAt: signal.extractedAt,
      source: signal.sourceId,
      url: signal.url,
      sourceTier: signal.sourceTier,
      confidence,
      isEvidenceBased: true,
      claim: signal.title,
      resultingState,
      status: signal.sourceTier === "TIER_1_OFFICIAL" || signal.sourceTier === "TIER_2_TRADE_PRESS" ? "VERIFIED" : "PROPOSED",
    };
  }
}
