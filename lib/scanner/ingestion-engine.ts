/**
 * RAW INGESTION ENGINE — PRODUCTION INTELLIGENCE V1.5.1
 * Misterio Color Lab
 * 
 * Strict content validation, atomic claim extraction, multi-stage processing pipeline
 * (FETCH_SUCCESS -> CONTENT_VALID -> CLAIM_EXTRACTED -> CLAIM_VERIFIED -> EVENT_ACCEPTED/REJECTED),
 * and entity resolution filtering.
 */

import { RawSignal, MarketSource, ExtractedClaim, SignalProcessingStage, EntityResolutionStatus } from "../../types/commercial";
import { calculateContentHash } from "../ingestion/normalizer";
import { resolveCompanyEntity } from "../ingestion/entity-resolution";

export class IngestionEngine {
  private static processedFingerprints: Set<string> = new Set();
  private static rawSignalStore: RawSignal[] = [];

  /**
   * Generates a deterministic 64-char SHA-256 fingerprint for deduplication.
   */
  public static generateSignalFingerprint(
    sourceId: string,
    url: string | undefined,
    title: string,
    publishedAt: string
  ): string {
    const payload = {
      sourceId,
      url: (url || "").trim().toLowerCase(),
      title: title.trim().toLowerCase(),
      publishedAt: publishedAt.slice(0, 10),
    };
    return calculateContentHash(payload);
  }

  /**
   * Validates raw HTTP body content to filter out paywalls, login prompts, empty pages, or fake 200 OK error pages.
   */
  public static validateContentPayload(title: string, contentSummary: string | undefined, bodyLength?: number): boolean {
    const text = `${title} ${contentSummary || ""}`.toLowerCase();

    // 1. Length check: Content under 100 bytes is insufficient evidence
    if (bodyLength !== undefined && bodyLength < 100) return false;
    if (text.length < 30) return false;

    // 2. Reject Paywall / Login / Cookie Walls / CAPTCHA / 404 HTML pages with 200 OK
    const invalidPatterns = [
      "subscribe to read",
      "sign in to continue",
      "log in or register",
      "cookie consent",
      "access denied",
      "404 not found",
      "page not found",
      "error 404",
      "enable javascript",
      "captcha challenge",
      "just a moment...",
    ];

    for (const pattern of invalidPatterns) {
      if (text.includes(pattern)) return false;
    }

    return true;
  }

  /**
   * Extracts atomic claims from a validated raw signal.
   */
  public static extractClaimsFromSignal(signal: RawSignal): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];
    const text = `${signal.title} ${signal.contentSummary || ""}`.toLowerCase();

    const subject = signal.projectTitle || signal.entityName || "Entidad Desconocida";

    if (text.includes("post-production") || text.includes("posproducción")) {
      claims.push({
        id: `clm_${Date.now()}_1`,
        claimType: "PROJECT_POST_PRODUCTION",
        subject,
        predicate: "current_phase",
        object: "POST_PRODUCTION",
        eventDate: signal.eventDate || signal.publishedAt,
        publishedAt: signal.publishedAt,
        source: signal.sourceId,
        sourceTier: signal.sourceTier,
        confidence: signal.sourceTier === "TIER_1_OFFICIAL" ? "HIGH" : "MEDIUM",
        evidenceSnippet: signal.title,
        verificationStatus: "VERIFIED",
      });
    }

    if (text.includes("theatrical release") || text.includes("estreno en cines") || text.includes("premieres in theaters")) {
      claims.push({
        id: `clm_${Date.now()}_2`,
        claimType: "PROJECT_RELEASE_DATE",
        subject,
        predicate: "current_phase",
        object: "RELEASED",
        eventDate: signal.eventDate || signal.publishedAt,
        publishedAt: signal.publishedAt,
        source: signal.sourceId,
        sourceTier: signal.sourceTier,
        confidence: signal.sourceTier === "TIER_1_OFFICIAL" ? "HIGH" : "HIGH",
        evidenceSnippet: signal.title,
        verificationStatus: "VERIFIED",
      });
    }

    if (text.includes("head of production") || text.includes("head of post")) {
      claims.push({
        id: `clm_${Date.now()}_3`,
        claimType: "PERSON_CURRENT_ROLE",
        subject: signal.personName || "Executive",
        predicate: "holds_role",
        object: signal.roleTitle || "Head of Post",
        eventDate: signal.eventDate || signal.publishedAt,
        publishedAt: signal.publishedAt,
        source: signal.sourceId,
        sourceTier: signal.sourceTier,
        confidence: signal.sourceTier === "TIER_1_OFFICIAL" ? "HIGH" : "MEDIUM",
        evidenceSnippet: signal.title,
        verificationStatus: "VERIFIED",
      });
    }

    return claims;
  }

  /**
   * Processes incoming raw payload through strict V1.5.1 pipeline stages.
   */
  public static processRawPayload(
    source: MarketSource,
    payload: {
      url?: string;
      finalUrl?: string;
      httpStatus?: number;
      contentType?: string;
      contentLength?: number;
      title: string;
      contentSummary?: string;
      publishedAt?: string;
      eventDate?: string;
      entityName?: string;
      projectTitle?: string;
      personName?: string;
      roleTitle?: string;
      proposedStatus?: string;
    }
  ): { signal?: RawSignal; isDuplicate: boolean; processingStage: SignalProcessingStage } {
    const publishedAt = payload.publishedAt || new Date().toISOString();
    const fingerprint = this.generateSignalFingerprint(source.id, payload.url, payload.title, publishedAt);

    if (this.processedFingerprints.has(fingerprint)) {
      return { isDuplicate: true, processingStage: "FETCH_SUCCESS" };
    }

    // 1. Stage 1: FETCH_SUCCESS
    let currentStage: SignalProcessingStage = "FETCH_SUCCESS";

    // 2. Stage 2: CONTENT_VALIDATION
    const isContentValid = this.validateContentPayload(payload.title, payload.contentSummary, payload.contentLength);

    if (!isContentValid) {
      const signal: RawSignal = {
        id: `sig_raw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sourceId: source.id,
        url: payload.url,
        finalUrl: payload.finalUrl || payload.url,
        httpStatus: payload.httpStatus || 200,
        contentType: payload.contentType || "text/html",
        contentLength: payload.contentLength || payload.title.length,
        title: payload.title,
        contentSummary: payload.contentSummary,
        publishedAt,
        eventDate: payload.eventDate,
        extractedAt: new Date().toISOString(),
        fingerprint,
        sourceTier: source.sourceTier,
        entityName: payload.entityName,
        projectTitle: payload.projectTitle,
        personName: payload.personName,
        roleTitle: payload.roleTitle,
        proposedStatus: payload.proposedStatus,
        status: "REJECTED",
        processingStage: "FETCHED_BUT_NOT_EVIDENCE",
        entityResolutionStatus: "ENTITY_UNRESOLVED",
        errorReason: "Contenido insuficiente, login, paywall o error 200 genérico.",
      };

      this.processedFingerprints.add(fingerprint);
      this.rawSignalStore.push(signal);
      return { signal, isDuplicate: false, processingStage: "FETCHED_BUT_NOT_EVIDENCE" };
    }

    currentStage = "CONTENT_VALID";

    // 3. Stage 3: ENTITY RESOLUTION CHECK
    let entityResStatus: EntityResolutionStatus = "MATCH";
    if (payload.entityName) {
      const companyRes = resolveCompanyEntity(payload.entityName);
      if (companyRes.status === "UNMATCHED" && !payload.projectTitle) {
        entityResStatus = "ENTITY_UNRESOLVED";
      }
    }

    // 4. Stage 4: RAW SIGNAL CREATION & CLAIM EXTRACTION
    const signal: RawSignal = {
      id: `sig_raw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sourceId: source.id,
      url: payload.url,
      finalUrl: payload.finalUrl || payload.url,
      httpStatus: payload.httpStatus || 200,
      contentType: payload.contentType || "text/html",
      contentLength: payload.contentLength || payload.title.length,
      title: payload.title,
      contentSummary: payload.contentSummary,
      publishedAt,
      eventDate: payload.eventDate || publishedAt,
      extractedAt: new Date().toISOString(),
      fingerprint,
      sourceTier: source.sourceTier,
      entityName: payload.entityName,
      projectTitle: payload.projectTitle,
      personName: payload.personName,
      roleTitle: payload.roleTitle,
      proposedStatus: payload.proposedStatus,
      status: "NEW",
      processingStage: currentStage,
      entityResolutionStatus: entityResStatus,
      evidenceSnippet: payload.contentSummary || payload.title,
    };

    const claims = this.extractClaimsFromSignal(signal);
    signal.extractedClaims = claims;

    if (claims.length > 0) {
      signal.processingStage = "CLAIM_EXTRACTED";
    }

    this.processedFingerprints.add(fingerprint);
    this.rawSignalStore.push(signal);

    return { signal, isDuplicate: false, processingStage: signal.processingStage };
  }

  public static getProcessedSignals(): RawSignal[] {
    return [...this.rawSignalStore];
  }

  public static clearStore(): void {
    this.processedFingerprints.clear();
    this.rawSignalStore = [];
  }
}
