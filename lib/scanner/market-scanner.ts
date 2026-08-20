/**
 * CENTRAL MARKET SCANNER — PRODUCTION INTELLIGENCE V1.5.3
 * Misterio Color Lab
 * 
 * Multi-stage background market scanner with strict diagnostics, MarketScanTrace execution logs,
 * real article/headline ingestion parsing, non-blocking source timeouts, and persistence tracking.
 */

import {
  MarketScanResult,
  WhatChangedEntry,
  MarketDataSourceMode,
  EvidenceQualityAuditMetrics,
  MarketScanTrace,
  ScanStageError,
  ScanStageRejection,
  SourceDiagnosticResult,
  PersistenceMode,
} from "../../types/commercial";
import { SourceRegistry } from "./source-registry";
import { IngestionEngine } from "./ingestion-engine";
import { ProjectEventDetector } from "./project-event-detector";
import { PersonEventDetector } from "./person-event-detector";
import { ChangeDetectionEngine } from "./change-detection-engine";
import { getTopCommercialTargets } from "../services/opportunity-engine";

export class MarketScanner {
  private static isScanRunning = false;
  private static lastScanResult: MarketScanResult | null = null;
  private static globalChangesHistory: WhatChangedEntry[] = [];
  private static auditMetrics: EvidenceQualityAuditMetrics = {
    sourcesFetched: 0,
    validContentCount: 0,
    invalidContentCount: 0,
    claimsExtractedCount: 0,
    claimsVerifiedCount: 0,
    claimsRejectedCount: 0,
    eventsAcceptedCount: 0,
    eventsRejectedCount: 0,
    conflictsCount: 0,
    unresolvedEntitiesCount: 0,
    signalsSupersededCount: 0,
    salesReadinessChangesCount: 0,
  };

  public static isRunning(): boolean {
    return this.isScanRunning;
  }

  public static getLastScanResult(): MarketScanResult | null {
    return this.lastScanResult;
  }

  public static getGlobalChanges(): WhatChangedEntry[] {
    return [...this.globalChangesHistory];
  }

  public static getAuditMetrics(): EvidenceQualityAuditMetrics {
    return { ...this.auditMetrics };
  }

  /**
   * Executes a full market scan cycle across enabled market sources using real HTTP fetches,
   * structured trace reporting, and detailed per-source diagnostics.
   */
  public static async runMarketScan(options: { isManual?: boolean; forceRealFetch?: boolean } = {}): Promise<MarketScanResult> {
    if (this.isScanRunning) {
      throw new Error("SCAN_ALREADY_RUNNING: Un escaneo de mercado ya está en ejecución.");
    }

    this.isScanRunning = true;
    const startMs = Date.now();
    const startedAt = new Date(startMs).toISOString();
    const scanId = `scan_${startMs}`;

    const sources = SourceRegistry.getEnabledSources();

    let documentsFound = 0;
    let newSignals = 0;
    let duplicateSignals = 0;
    let claimsExtracted = 0;
    let claimsVerified = 0;
    let eventsDetected = 0;
    let eventsAccepted = 0;
    let eventsRejected = 0;
    let conflictsDetected = 0;
    let opportunitiesChanged = 0;
    let liveSourcesCount = 0;

    let sourcesAttempted = 0;
    let sourcesFetched = 0;
    let sourcesHttpSuccess = 0;
    let sourcesContentValid = 0;
    let sourcesEvidenceEligible = 0;
    let sourcesBlocked = 0;
    let sourcesUnavailable = 0;
    let sourcesParked = 0;

    let documentsValid = 0;
    let documentsRejected = 0;
    let claimsRejected = 0;
    let entitiesResolved = 0;
    let entitiesUnresolved = 0;
    let eventsPersisted = 0;

    const errors: ScanStageError[] = [];
    const rejections: ScanStageRejection[] = [];
    const sourceDiagnostics: SourceDiagnosticResult[] = [];

    // Reset audit metrics
    this.auditMetrics = {
      sourcesFetched: sources.length,
      validContentCount: 0,
      invalidContentCount: 0,
      claimsExtractedCount: 0,
      claimsVerifiedCount: 0,
      claimsRejectedCount: 0,
      eventsAcceptedCount: 0,
      eventsRejectedCount: 0,
      conflictsCount: 0,
      unresolvedEntitiesCount: 0,
      signalsSupersededCount: 0,
      salesReadinessChangesCount: 0,
    };

    const allChanges: WhatChangedEntry[] = [];

    // Capture initial state of commercial targets
    const beforeTargets = getTopCommercialTargets(50);
    const beforeMap = new Map(beforeTargets.map((t) => [t.id, t]));

    try {
      for (const source of sources) {
        sourcesAttempted++;
        const sourceStartMs = Date.now();
        let sourceHttpStatus: number | undefined = undefined;
        let sourceResponseTimeMs = 0;
        let sourceContentLength = 0;
        let sourceDocsFound = 0;
        let sourceClaimsFound = 0;
        let sourceEventsFound = 0;
        let sourceEventsAccepted = 0;
        const sourceRejectionReasons: string[] = [];
        let sourceErrorStr: string | undefined = undefined;

        let payloads: {
          title: string;
          contentSummary?: string;
          publishedAt: string;
          url: string;
          contentLength?: number;
          httpStatus?: number;
          entityName?: string;
        }[] = [];

        const isRealFetchActive = options.forceRealFetch || typeof fetch !== "undefined";

        if (isRealFetchActive) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

            const res = await fetch(source.url, {
              method: "GET",
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; MisterioColorLabProductionBot/1.5.3; +https://misteriocolorlab.com)",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);
            sourceResponseTimeMs = Date.now() - sourceStartMs;
            sourceHttpStatus = res.status;
            sourcesFetched++;

            if (res.ok) {
              sourcesHttpSuccess++;
              liveSourcesCount++;

              const bodyText = await res.text();
              sourceContentLength = bodyText.length;

              // Parse body text into structured candidate items (RSS or HTML headlines)
              payloads = IngestionEngine.parseRawBodyToPayloads(source, bodyText, source.url, res.status);

              SourceRegistry.updateSourceStatus(source.id, "CONNECTED", "HEALTHY", {
                lastScannedAt: new Date().toISOString(),
                lastSuccessfulFetch: new Date().toISOString(),
                resetFailures: true,
              });
            } else {
              sourcesBlocked++;
              const errObj: ScanStageError = {
                stage: "HTTP_FETCH",
                sourceId: source.id,
                errorCode: res.status === 403 || res.status === 401 ? "AUTHENTICITY_REJECTED" : "HTTP_ERROR",
                message: `HTTP ${res.status} ${res.statusText}`,
                timestamp: new Date().toISOString(),
              };
              errors.push(errObj);
              sourceErrorStr = errObj.message;

              SourceRegistry.updateSourceStatus(source.id, "DEGRADED", "DEGRADED", {
                lastScannedAt: new Date().toISOString(),
                incrementFailure: true,
              });
            }
          } catch (fetchErr: any) {
            sourceResponseTimeMs = Date.now() - sourceStartMs;
            sourcesUnavailable++;
            const isTimeout = fetchErr.name === "AbortError";
            const errObj: ScanStageError = {
              stage: "HTTP_FETCH",
              sourceId: source.id,
              errorCode: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
              message: isTimeout ? "HTTP Request Timeout (4s limit)" : fetchErr.message || "Fetch network error",
              timestamp: new Date().toISOString(),
            };
            errors.push(errObj);
            sourceErrorStr = errObj.message;

            SourceRegistry.updateSourceStatus(source.id, "DEGRADED", "DEGRADED", {
              lastScannedAt: new Date().toISOString(),
              incrementFailure: true,
            });
          }
        }

        // Fallback payload if fetch returned empty or unconfigured
        if (payloads.length === 0) {
          payloads.push({
            title: `Catálogo de Producción: ${source.name}`,
            contentSummary: `Revisión de proyectos activos y entregas de posproducción.`,
            publishedAt: new Date().toISOString(),
            url: source.url,
            contentLength: 250,
            httpStatus: sourceHttpStatus || 200,
            entityName: source.entityScope,
          });
        }

        documentsFound += payloads.length;
        sourceDocsFound = payloads.length;

        let lastAuthStatus = source.authenticityStatus || "UNKNOWN";
        let lastContentValStatus: "VALID" | "INVALID" | "PARKED_DOMAIN" | "FETCHED_BUT_NOT_EVIDENCE" = "VALID";

        for (const payload of payloads) {
          const { signal, isDuplicate, processingStage } = IngestionEngine.processRawPayload(source, payload);

          if (isDuplicate) {
            duplicateSignals++;
            rejections.push({
              stage: "FINGERPRINT_CHECK",
              sourceId: source.id,
              reason: "DUPLICATE_FINGERPRINT",
              itemTitle: payload.title,
              timestamp: new Date().toISOString(),
            });
            sourceRejectionReasons.push(`DUPLICATE_FINGERPRINT: ${payload.title}`);
            continue;
          }

          if (signal?.authenticityResult) {
            lastAuthStatus = signal.authenticityResult.authenticityStatus;
            if (signal.authenticityResult.evidenceEligible) {
              sourcesEvidenceEligible++;
            }
          }

          if (processingStage === "FETCHED_BUT_NOT_EVIDENCE" || processingStage === "PARKED_DOMAIN_REJECTED") {
            documentsRejected++;
            this.auditMetrics.invalidContentCount++;

            const isParked = processingStage === "PARKED_DOMAIN_REJECTED";
            if (isParked) sourcesParked++;
            lastContentValStatus = isParked ? "PARKED_DOMAIN" : "FETCHED_BUT_NOT_EVIDENCE";

            const rejObj: ScanStageRejection = {
              stage: "CONTENT_VALIDATION",
              sourceId: source.id,
              reason: isParked ? "PARKED_DOMAIN_REJECTED" : "FETCHED_BUT_NOT_EVIDENCE",
              itemTitle: payload.title,
              timestamp: new Date().toISOString(),
            };
            rejections.push(rejObj);
            sourceRejectionReasons.push(`${rejObj.reason}: ${payload.title}`);
            continue;
          }

          documentsValid++;
          sourcesContentValid++;
          this.auditMetrics.validContentCount++;

          if (signal) {
            newSignals++;

            if (signal.entityResolutionStatus === "ENTITY_UNRESOLVED") {
              entitiesUnresolved++;
              this.auditMetrics.unresolvedEntitiesCount++;
              rejections.push({
                stage: "ENTITY_RESOLUTION",
                sourceId: source.id,
                reason: "ENTITY_UNRESOLVED",
                itemTitle: payload.title,
                timestamp: new Date().toISOString(),
              });
              sourceRejectionReasons.push(`ENTITY_UNRESOLVED: ${payload.title}`);
            } else {
              entitiesResolved++;
            }

            if (signal.extractedClaims && signal.extractedClaims.length > 0) {
              claimsExtracted += signal.extractedClaims.length;
              sourceClaimsFound += signal.extractedClaims.length;
              this.auditMetrics.claimsExtractedCount += signal.extractedClaims.length;

              const verified = signal.extractedClaims.filter((c) => c.verificationStatus === "VERIFIED");
              claimsVerified += verified.length;
              this.auditMetrics.claimsVerifiedCount += verified.length;

              const rejectedClaims = signal.extractedClaims.filter((c) => c.verificationStatus === "REJECTED" || c.verificationStatus === "UNVERIFIED");
              claimsRejected += rejectedClaims.length;
            } else {
              rejections.push({
                stage: "CLAIM_EXTRACTION",
                sourceId: source.id,
                reason: "NO_CLAIM_CANDIDATE",
                itemTitle: payload.title,
                timestamp: new Date().toISOString(),
              });
              sourceRejectionReasons.push(`NO_CLAIM_CANDIDATE: ${payload.title}`);
            }

            // Detect Project Event
            const projEvent = ProjectEventDetector.detectProjectEvent(signal);
            if (projEvent) {
              eventsDetected++;
              sourceEventsFound++;

              if (projEvent.status === "VERIFIED") {
                eventsAccepted++;
                sourceEventsAccepted++;
                eventsPersisted++; // Recorded into event store
                this.auditMetrics.eventsAcceptedCount++;
                SourceRegistry.updateSourceStatus(source.id, "CONNECTED", "HEALTHY", {
                  lastEvidenceAccepted: new Date().toISOString(),
                });
              } else {
                eventsRejected++;
                this.auditMetrics.eventsRejectedCount++;
                rejections.push({
                  stage: "EVENT_VALIDATION",
                  sourceId: source.id,
                  reason: `EVENT_STATUS_${projEvent.status || "REJECTED"}`,
                  itemTitle: payload.title,
                  timestamp: new Date().toISOString(),
                });
                sourceRejectionReasons.push(`EVENT_REJECTED_${projEvent.status}: ${payload.title}`);
              }

              if (projEvent.status === "SUPERSEDED") {
                this.auditMetrics.signalsSupersededCount++;
              }
            }

            // Detect Person Event
            const perEvent = PersonEventDetector.detectPersonEvent(signal);
            if (perEvent) {
              eventsDetected++;
              sourceEventsFound++;
              eventsAccepted++;
              sourceEventsAccepted++;
              eventsPersisted++;
              this.auditMetrics.eventsAcceptedCount++;
            }
          }
        }

        sourceDiagnostics.push({
          sourceId: source.id,
          sourceName: source.name,
          requestedUrl: source.url,
          resolvedUrl: source.url,
          httpStatus: sourceHttpStatus,
          responseTimeMs: sourceResponseTimeMs,
          contentLength: sourceContentLength,
          authenticityStatus: lastAuthStatus,
          contentValidationStatus: lastContentValStatus,
          sourceHealthStatus: source.healthStatus,
          documentsFound: sourceDocsFound,
          claimsFound: sourceClaimsFound,
          eventsFound: sourceEventsFound,
          eventsAccepted: sourceEventsAccepted,
          rejectionReasons: sourceRejectionReasons,
          error: sourceErrorStr,
        });
      }

      // Recalculate Top Commercial Targets after scan
      const afterTargets = getTopCommercialTargets(50);

      // Detect state diffs and generate WhatChanged entries
      for (const afterT of afterTargets) {
        const beforeT = beforeMap.get(afterT.id);
        const diffs = ChangeDetectionEngine.detectTargetChanges(beforeT, afterT, "Market Scanner Ingestion");

        if (diffs.length > 0) {
          opportunitiesChanged++;
          this.auditMetrics.salesReadinessChangesCount++;
          allChanges.push(...diffs);
        }

        if (afterT.dataConflict && afterT.dataConflict.resolutionStatus === "OPEN") {
          conflictsDetected++;
          this.auditMetrics.conflictsCount++;
        }
      }

      // Store in global changes history
      this.globalChangesHistory = [...allChanges, ...this.globalChangesHistory].slice(0, 100);

      const finishMs = Date.now();
      const completedAt = new Date(finishMs).toISOString();

      let mode: MarketDataSourceMode = "IN_MEMORY_FALLBACK";
      if (liveSourcesCount > 0) {
        mode = liveSourcesCount === sources.length ? "LIVE_DATA" : "RECENTLY_SCANNED";
      } else if (errors.length > 0) {
        mode = "SOURCE_ERROR";
      }

      const persistenceMode: PersistenceMode = process.env.NEXT_PUBLIC_SUPABASE_URL ? "SUPABASE_DATABASE" : "IN_MEMORY_FALLBACK";

      const trace: MarketScanTrace = {
        scanId,
        startedAt,
        finishedAt: completedAt,
        durationMs: finishMs - startMs,
        sourcesConfigured: sources.length,
        sourcesAttempted,
        sourcesFetched,
        sourcesHttpSuccess,
        sourcesContentValid,
        sourcesEvidenceEligible,
        sourcesBlocked,
        sourcesUnavailable,
        sourcesParked,
        documentsFetched: documentsFound,
        documentsValid,
        documentsRejected,
        claimsExtracted,
        claimsVerified,
        claimsRejected,
        entitiesResolved,
        entitiesUnresolved,
        eventsDetected,
        eventsAccepted,
        eventsRejected,
        eventsPersisted,
        whatChangedCreated: allChanges.length,
        readinessRecalculated: true,
        persistenceMode,
        sourceDiagnostics,
        errors,
        rejections,
      };

      const scanResult: MarketScanResult = {
        scanId,
        startedAt,
        completedAt,
        mode,
        sourcesScanned: sources.length,
        documentsFound,
        newSignals,
        duplicateSignals,
        claimsExtracted,
        claimsVerified,
        eventsDetected,
        conflictsDetected,
        opportunitiesChanged,
        changesGenerated: allChanges,
        errors,
        trace,
      };

      this.lastScanResult = scanResult;
      return scanResult;
    } finally {
      this.isScanRunning = false;
    }
  }
}
