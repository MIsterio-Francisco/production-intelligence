/**
 * SOURCE RECOVERY ENGINE — PRODUCTION INTELLIGENCE V1.5.2
 * Misterio Color Lab
 * 
 * Handles fallback evidence recovery when a Tier 1 official source fails or is parked.
 * 
 * PRINCIPLES:
 * - NO synthetic data generation.
 * - NO artificial elevation of Tier 2 sources to Tier 1.
 * - Mark official source as UNAVAILABLE or PARKED_DOMAIN.
 * - Retrieve verified evidence from registered secondary/trade press sources.
 * - Maintain explicit provenance separation (Official vs Trade Press).
 */

import { MarketSource, SourceHealthStatus, ExtractedClaim, RawSignal } from "../../types/commercial";
import { SourceRegistry } from "./source-registry";

export interface SourceRecoveryResult {
  entityName: string;
  officialSourceId: string;
  officialSourceStatus: SourceHealthStatus;
  officialSourceAvailable: boolean;
  recoveredFromFallback: boolean;
  fallbackSourceId?: string;
  fallbackSourceTier?: string;
  evidenceClaims: ExtractedClaim[];
  provenanceSummary: string;
}

export class SourceRecoveryEngine {
  /**
   * Evaluates fallback recovery for an entity when its primary official source is unavailable or parked.
   */
  public static evaluateSourceRecovery(
    entityName: string,
    primarySourceId: string,
    existingSignals: RawSignal[] = []
  ): SourceRecoveryResult {
    const primarySource = SourceRegistry.getSourceById(primarySourceId);
    const officialStatus: SourceHealthStatus = primarySource?.healthStatus || "UNAVAILABLE";
    const officialAvailable = officialStatus === "HEALTHY";

    if (officialAvailable) {
      return {
        entityName,
        officialSourceId: primarySourceId,
        officialSourceStatus: officialStatus,
        officialSourceAvailable: true,
        recoveredFromFallback: false,
        evidenceClaims: [],
        provenanceSummary: `Official Source (${primarySource?.name || primarySourceId}) is HEALTHY.`,
      };
    }

    // Official source is down or parked: look for registered fallback sources
    const fallbackSourceIds = primarySource?.fallbackSources || [
      "src_trade_variety",
      "src_trade_hollywoodreporter",
      "src_trade_cineuropa",
    ];

    const validFallbackSignals = existingSignals.filter(
      (s) =>
        fallbackSourceIds.includes(s.sourceId) &&
        s.entityResolutionStatus === "MATCH" &&
        s.processingStage === "CLAIM_EXTRACTED" &&
        (s.entityName?.toLowerCase().includes(entityName.toLowerCase()) ||
          s.title.toLowerCase().includes(entityName.toLowerCase()))
    );

    if (validFallbackSignals.length > 0) {
      const bestSignal = validFallbackSignals[0];
      const claims = bestSignal.extractedClaims || [];

      return {
        entityName,
        officialSourceId: primarySourceId,
        officialSourceStatus: officialStatus,
        officialSourceAvailable: false,
        recoveredFromFallback: true,
        fallbackSourceId: bestSignal.sourceId,
        fallbackSourceTier: bestSignal.sourceTier,
        evidenceClaims: claims,
        provenanceSummary: `Official Source (${primarySource?.name || primarySourceId}) is ${officialStatus}. Evidence recovered from ${bestSignal.sourceId} (${bestSignal.sourceTier}).`,
      };
    }

    return {
      entityName,
      officialSourceId: primarySourceId,
      officialSourceStatus: officialStatus,
      officialSourceAvailable: false,
      recoveredFromFallback: false,
      evidenceClaims: [],
      provenanceSummary: `Official Source (${primarySource?.name || primarySourceId}) is ${officialStatus}. No valid fallback evidence currently available.`,
    };
  }
}
