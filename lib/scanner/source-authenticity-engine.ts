/**
 * SOURCE AUTHENTICITY ENGINE — PRODUCTION INTELLIGENCE V1.5.2
 * Misterio Color Lab
 * 
 * Deterministic source authenticity verification:
 * HTTP 200 != VALID SOURCE != EVIDENCE
 * 
 * Detects GoDaddy, Sedo, Afternic, HugeDomains, Parked Domains, Domains For Sale,
 * External Redirects, Login Walls, CAPTCHA, Cookie Walls, and non-corporate content.
 */

import { SourceAuthenticityStatus, SourceAuthenticityResult } from "../../types/commercial";

export class SourceAuthenticityEngine {
  private static KNOWN_PARKING_PROVIDERS = [
    "godaddy.com",
    "parkedfree.com",
    "sedo.com",
    "sedoparking.com",
    "afternic.com",
    "hugedomains.com",
    "dan.com",
    "namecheap.com/domains/landing",
    "domain.com/park",
    "bluehost.com/parking",
  ];

  private static PARKED_TEXT_PATTERNS = [
    "domain parked",
    "this domain is parked free",
    "parked free",
    "domain_parked",
    "page-parked",
    "sedoparking",
    "buy this domain",
    "domain for sale",
    "this domain is for sale",
    "inquire about this domain",
    "domain is available for purchase",
    "make an offer on this domain",
    "purchase this domain",
    "future home of something cool",
    "site under construction",
    "cgi-sys/defaultwebpage",
    "default website page",
  ];

  /**
   * Helper to extract domain/hostname from a URL string safely.
   */
  public static extractDomain(urlStr?: string): string {
    if (!urlStr) return "";
    try {
      const cleanUrl = urlStr.trim().startsWith("http") ? urlStr.trim() : `https://${urlStr.trim()}`;
      const parsed = new URL(cleanUrl);
      return parsed.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return urlStr.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    }
  }

  /**
   * Evaluates source authenticity based on HTTP response, final URL, HTML body, title, and metadata.
   */
  public static evaluateSourceAuthenticity(payload: {
    sourceId: string;
    url: string;
    httpStatus: number;
    finalUrl?: string;
    body?: string;
    title?: string;
    metaDescription?: string;
    expectedDomain?: string;
    expectedEntityName?: string;
    contentLength?: number;
  }): SourceAuthenticityResult {
    const reasons: string[] = [];
    const sourceDomain = this.extractDomain(payload.url);
    const finalDomain = this.extractDomain(payload.finalUrl || payload.url);
    const expectedDomainClean = payload.expectedDomain ? this.extractDomain(payload.expectedDomain) : sourceDomain;

    const title = (payload.title || "").toLowerCase();
    const body = (payload.body || "").toLowerCase();
    const meta = (payload.metaDescription || "").toLowerCase();
    const combinedText = `${title} ${body} ${meta}`;
    const contentLength = payload.contentLength || body.length || combinedText.length;

    let authenticityStatus: SourceAuthenticityStatus = "UNKNOWN";
    let domainMatchesExpectedEntity = true;
    let corporateContentDetected = false;
    let parkedDomainDetected = false;
    let domainForSaleDetected = false;
    let redirectedExternal = false;
    let contentValid = false;
    let evidenceEligible = false;
    let confidence = 0;

    // 1. HTTP Status Check
    if (payload.httpStatus !== 200) {
      reasons.push(`HTTP status ${payload.httpStatus} indicates fetch failure.`);
      return {
        sourceId: payload.sourceId,
        url: payload.url,
        httpStatus: payload.httpStatus,
        finalUrl: payload.finalUrl,
        domain: sourceDomain,
        authenticityStatus: "CONTENT_INVALID",
        domainMatchesExpectedEntity: false,
        corporateContentDetected: false,
        parkedDomainDetected: false,
        domainForSaleDetected: false,
        redirectedExternal: false,
        contentValid: false,
        evidenceEligible: false,
        confidence: 95,
        reasons,
        checkedAt: new Date().toISOString(),
      };
    }

    // 2. Domain Match Check
    const sourceSld = sourceDomain.split(".")[0];
    const finalSld = finalDomain.split(".")[0];
    const expectedSld = expectedDomainClean.split(".")[0];

    const isSourceMatch = sourceDomain === expectedDomainClean || (sourceSld.length > 3 && sourceSld === expectedSld);
    const isFinalMatch = finalDomain === expectedDomainClean || (finalSld.length > 3 && finalSld === expectedSld);
    const isDomainMatch = isSourceMatch || isFinalMatch;

    if (!isDomainMatch) {
      domainMatchesExpectedEntity = false;
      reasons.push(`Source domain (${sourceDomain}) does not match expected entity domain (${expectedDomainClean}).`);
    }

    // 3. External Redirect to Parking / Registrar Check
    if (finalDomain && sourceDomain && finalDomain !== sourceDomain) {
      const isKnownParkingProvider = this.KNOWN_PARKING_PROVIDERS.some((p) => finalDomain.includes(p));
      if (isKnownParkingProvider || !isFinalMatch) {
        redirectedExternal = true;
        reasons.push(`Redirected externally from ${sourceDomain} to ${finalDomain}.`);
      }
    }

    // 4. Detection of Parked Domains (GoDaddy, Sedo, Afternic, etc.)
    const isParkingHost = this.KNOWN_PARKING_PROVIDERS.some((p) => finalDomain.includes(p) || sourceDomain.includes(p));
    const hasParkedText = this.PARKED_TEXT_PATTERNS.some((p) => combinedText.includes(p));

    if (isParkingHost || hasParkedText) {
      parkedDomainDetected = true;
      if (
        combinedText.includes("domain for sale") ||
        combinedText.includes("this domain is for sale") ||
        combinedText.includes("buy this domain") ||
        combinedText.includes("make an offer")
      ) {
        domainForSaleDetected = true;
      }
    }

    // 5. Detection of Login / CAPTCHA / Cookie Wall / Empty Content
    const isLoginWall = combinedText.includes("sign in to continue") || combinedText.includes("log in or register");
    const isCaptcha = combinedText.includes("captcha challenge") || combinedText.includes("just a moment...");
    const isCookieWall = combinedText.includes("accept all cookies to proceed") || combinedText.includes("cookie consent wall");
    const isEmptyContent =
      (payload.contentLength !== undefined && payload.contentLength < 100) ||
      combinedText.trim().length < 30;

    // 6. Corporate Content Detection
    const corporateKeywords = [
      "production",
      "films",
      "pictures",
      "slate",
      "entertainment",
      "projects",
      "headquarters",
      "contact",
      "about us",
      "news",
      "post-production",
      "productora",
      "rodaje",
      "estreno",
    ];

    let corporateKeywordHits = 0;
    for (const kw of corporateKeywords) {
      if (combinedText.includes(kw)) corporateKeywordHits++;
    }

    if (payload.expectedEntityName) {
      const normEntity = payload.expectedEntityName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normBody = combinedText.replace(/[^a-z0-9]/g, "");
      if (normBody.includes(normEntity)) {
        corporateKeywordHits += 3;
      }
    }

    corporateContentDetected = corporateKeywordHits >= 2 && !parkedDomainDetected;

    // 7. Decision Hierarchy for Authenticity Status
    if (parkedDomainDetected) {
      authenticityStatus = domainForSaleDetected ? "DOMAIN_FOR_SALE" : "PARKED_DOMAIN";
      reasons.push("GoDaddy / Registrar parked domain or domain-for-sale markers detected.");
      confidence = 98;
    } else if (redirectedExternal) {
      authenticityStatus = "REDIRECTED_EXTERNAL";
      reasons.push(`External redirect to unrelated domain: ${finalDomain}.`);
      confidence = 90;
    } else if (isLoginWall) {
      authenticityStatus = "LOGIN_WALL";
      reasons.push("Login wall prompt detected.");
      confidence = 95;
    } else if (isCaptcha) {
      authenticityStatus = "CAPTCHA";
      reasons.push("CAPTCHA challenge detected.");
      confidence = 95;
    } else if (isCookieWall) {
      authenticityStatus = "COOKIE_WALL";
      reasons.push("Cookie wall blocking content access.");
      confidence = 90;
    } else if (isEmptyContent) {
      authenticityStatus = "EMPTY_CONTENT";
      reasons.push(`Body length (${contentLength}b) below minimum evidence threshold (100b).`);
      confidence = 95;
    } else if (!corporateContentDetected) {
      authenticityStatus = "NON_CORPORATE_CONTENT";
      reasons.push("Page content lacks verifiable corporate/production identity markers.");
      confidence = 85;
    } else {
      authenticityStatus = "AUTHENTIC_CORPORATE";
      reasons.push("Valid corporate content and domain authenticity verified.");
      confidence = 98;
    }

    contentValid = authenticityStatus === "AUTHENTIC_CORPORATE" && corporateContentDetected;
    evidenceEligible = contentValid && domainMatchesExpectedEntity && !redirectedExternal;

    return {
      sourceId: payload.sourceId,
      url: payload.url,
      httpStatus: payload.httpStatus,
      finalUrl: payload.finalUrl || payload.url,
      domain: sourceDomain,
      authenticityStatus,
      domainMatchesExpectedEntity,
      corporateContentDetected,
      parkedDomainDetected,
      domainForSaleDetected,
      redirectedExternal,
      contentValid,
      evidenceEligible,
      confidence,
      reasons,
      checkedAt: new Date().toISOString(),
    };
  }
}
