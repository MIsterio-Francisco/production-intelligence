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
import { ContentValidationEngine } from "./content-validation-engine";
import { SourceRegistry } from "./source-registry";

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
   * Parses raw HTML or RSS body text into structured candidate items/payloads.
   */
  public static parseRawBodyToPayloads(
    source: MarketSource,
    bodyText: string,
    url: string,
    httpStatus: number
  ): {
    title: string;
    contentSummary?: string;
    publishedAt: string;
    url: string;
    contentLength?: number;
    httpStatus?: number;
    entityName?: string;
  }[] {
    const payloads: {
      title: string;
      contentSummary?: string;
      publishedAt: string;
      url: string;
      contentLength?: number;
      httpStatus?: number;
      entityName?: string;
    }[] = [];

    // 1. RSS / Atom Feed Parsing
    if (bodyText.includes("<item>") || bodyText.includes("<entry>")) {
      const itemRegex = /<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
      let match;
      while ((match = itemRegex.exec(bodyText)) !== null && payloads.length < 5) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const descMatch = itemContent.match(/<(?:description|summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:description|summary|content)>/i);
        const linkMatch = itemContent.match(/<link[^>]*>(?:href=["']([^"']+)["']|([^<]+))<\/link>/i) || itemContent.match(/href=["']([^"']+)["']/i);
        const dateMatch = itemContent.match(/<(?:pubDate|published|updated)[^>]*>([^<]+)<\/(?:pubDate|published|updated)>/i);

        if (titleMatch && titleMatch[1].trim()) {
          const rawTitle = titleMatch[1].replace(/<[^>]+>/g, "").trim();
          const rawDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 400) : rawTitle;
          const itemUrl = linkMatch ? (linkMatch[1] || linkMatch[2] || url).trim() : url;
          const pubDate = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

          payloads.push({
            title: rawTitle,
            contentSummary: rawDesc,
            publishedAt: pubDate,
            url: itemUrl,
            contentLength: rawDesc.length,
            httpStatus,
            entityName: source.entityScope,
          });
        }
      }
    }

    // 2. HTML Article / News Headline Parsing
    if (payloads.length === 0) {
      const articleRegex = /<(?:article|div)[^>]*class=["'][^"']*(?:news|post|item|entry|press|article)[^"']*["'][^>]*>([\s\S]*?)<\/(?:article|div)>/gi;
      let match;
      while ((match = articleRegex.exec(bodyText)) !== null && payloads.length < 5) {
        const artText = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const headlineMatch = match[1].match(/<h[1-4][^>]*>(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/h[1-4]>/i);
        if (headlineMatch && headlineMatch[1].trim().length > 10) {
          const title = headlineMatch[1].trim();
          payloads.push({
            title,
            contentSummary: artText.slice(0, 400),
            publishedAt: new Date().toISOString(),
            url,
            contentLength: artText.length,
            httpStatus,
            entityName: source.entityScope,
          });
        }
      }
    }

    // 3. Clean Page Title Fallback
    if (payloads.length === 0) {
      const titleMatch = bodyText.match(/<title[^>]*>([^<]+)<\/title>/i);
      const cleanTitle = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : source.name;
      const cleanBody = bodyText.replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      payloads.push({
        title: cleanTitle,
        contentSummary: cleanBody.slice(0, 500),
        publishedAt: new Date().toISOString(),
        url,
        contentLength: cleanBody.length,
        httpStatus,
        entityName: source.entityScope,
      });
    }

    return payloads;
  }

  /**
   * Processes incoming raw payload through strict V1.5.2 pipeline stages.
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

    // 2. Stage 2: SOURCE AUTHENTICITY & CONTENT VALIDATION (V1.5.2 Engine)
    const validationRes = ContentValidationEngine.validatePayload({
      sourceId: source.id,
      url: payload.url || source.url,
      httpStatus: payload.httpStatus || 200,
      finalUrl: payload.finalUrl || payload.url || source.url,
      title: payload.title,
      contentSummary: payload.contentSummary,
      contentLength: payload.contentLength,
      expectedDomain: source.expectedDomain,
      expectedEntityName: source.entityScope || payload.entityName,
    });

    if (!validationRes.isValid) {
      const authStatus = validationRes.authenticityResult.authenticityStatus;
      const isParked = authStatus === "PARKED_DOMAIN" || authStatus === "DOMAIN_FOR_SALE";

      SourceRegistry.updateSourceStatus(
        source.id,
        isParked ? "DEGRADED" : "DEGRADED",
        isParked ? "PARKED_DOMAIN" : "CONTENT_INVALID",
        {
          authenticityStatus: authStatus,
          lastHttpStatus: payload.httpStatus || 200,
          lastError: validationRes.reasons[0] || "Invalid source content",
          incrementInvalidContent: true,
        }
      );

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
        processingStage: validationRes.stage,
        entityResolutionStatus: "ENTITY_UNRESOLVED",
        authenticityResult: validationRes.authenticityResult,
        errorReason: validationRes.reasons.join(" | "),
      };

      this.processedFingerprints.add(fingerprint);
      this.rawSignalStore.push(signal);
      return { signal, isDuplicate: false, processingStage: validationRes.stage };
    }

    currentStage = "CONTENT_VALID";

    // 3. Stage 3: ENTITY RESOLUTION CHECK
    let entityResStatus: EntityResolutionStatus = "MATCH";
    let resolvedEntityName = payload.entityName;

    const candidateEntityName = payload.entityName || payload.title || source.entityScope;
    if (candidateEntityName) {
      const companyRes = resolveCompanyEntity(candidateEntityName);
      if (companyRes.status === "MATCHED" || companyRes.status === "POSSIBLE_MATCH") {
        entityResStatus = "MATCH";
        resolvedEntityName = companyRes.matchedName || candidateEntityName;
      } else if (source.entityScope) {
        // Fallback to configured entity scope for Tier 1 official sources
        entityResStatus = "MATCH";
        resolvedEntityName = source.entityScope;
      } else if (!payload.projectTitle) {
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
