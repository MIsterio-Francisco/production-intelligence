/**
 * CONTENT VALIDATION ENGINE — PRODUCTION INTELLIGENCE V1.5.2
 * Misterio Color Lab
 * 
 * Validates corporate content authenticity and distinguishes VALID CORPORATE CONTENT
 * from parked domains, domain sales, login walls, CAPTCHAs, cookie walls, paywalls,
 * empty HTML, and HTTP 200 error pages.
 */

import { SourceAuthenticityResult, SourceAuthenticityStatus } from "../../types/commercial";
import { SourceAuthenticityEngine } from "./source-authenticity-engine";

export interface ExtendedContentValidationResult {
  isValid: boolean;
  evidenceEligible: boolean;
  stage: "CONTENT_VALID" | "FETCHED_BUT_NOT_EVIDENCE" | "PARKED_DOMAIN_REJECTED";
  authenticityResult: SourceAuthenticityResult;
  reasons: string[];
}

export class ContentValidationEngine {
  /**
   * Performs deep content and authenticity validation on raw HTTP payloads.
   */
  public static validatePayload(payload: {
    sourceId: string;
    url: string;
    httpStatus?: number;
    finalUrl?: string;
    title: string;
    contentSummary?: string;
    body?: string;
    contentLength?: number;
    expectedDomain?: string;
    expectedEntityName?: string;
  }): ExtendedContentValidationResult {
    const authResult = SourceAuthenticityEngine.evaluateSourceAuthenticity({
      sourceId: payload.sourceId,
      url: payload.url,
      httpStatus: payload.httpStatus || 200,
      finalUrl: payload.finalUrl || payload.url,
      body: payload.body || payload.contentSummary,
      title: payload.title,
      expectedDomain: payload.expectedDomain,
      expectedEntityName: payload.expectedEntityName,
      contentLength: payload.contentLength,
    });

    const reasons = [...authResult.reasons];

    if (authResult.authenticityStatus === "PARKED_DOMAIN" || authResult.authenticityStatus === "DOMAIN_FOR_SALE") {
      return {
        isValid: false,
        evidenceEligible: false,
        stage: "PARKED_DOMAIN_REJECTED",
        authenticityResult: authResult,
        reasons,
      };
    }

    if (!authResult.evidenceEligible) {
      return {
        isValid: false,
        evidenceEligible: false,
        stage: "FETCHED_BUT_NOT_EVIDENCE",
        authenticityResult: authResult,
        reasons,
      };
    }

    return {
      isValid: true,
      evidenceEligible: true,
      stage: "CONTENT_VALID",
      authenticityResult: authResult,
      reasons,
    };
  }
}
