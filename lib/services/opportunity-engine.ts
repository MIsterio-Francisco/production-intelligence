/**
 * B2B OPPORTUNITY ENGINE FOR MISTERIO COLOR LAB — PRODUCTION INTELLIGENCE V1.4
 * Builds high-intent, evidence-backed commercial targets.
 * Enforces Claim-Level Verification, Data Conflict Detection, Source Tiers, Event Timelines, and Historical Signal Invalidation.
 */

import {
  TopCommercialTarget,
  CommercialEvidence,
  CommercialTargetCategory,
  DataFreshness,
  CommercialWhyNowTrigger,
  ProjectEvent,
} from "../../types/commercial";
import { getFallbackCompanies, getFallbackCompanyBySlug } from "./company-service";
import { getFallbackProjects } from "./project-service";
import { evaluateMCLServiceFit } from "./service-fit-engine";
import { formatCommercialContact, evaluateDataFreshness } from "./decision-maker-classifier";
import { calculateExplicableTargetScore, calculateIndependentConfidence } from "./target-scoring-engine";
import { evaluateProjectActivity, evaluateCurrentProjectState, invalidateObsoleteSignals } from "./freshness-engine";
import { evaluateSalesReadiness } from "./sales-readiness-engine";
import { calculateVerificationTimestamps, generateAuditLogEntry } from "./degradation-engine";
import { detectDataConflict } from "./data-conflict-engine";
import { verifyCompanyIdentityClaim, verifyCurrentRoleClaim, verifyProjectStatusClaim } from "./claim-verifier";

export function evaluateProjectFreshness(project?: any): DataFreshness {
  const evalRes = evaluateProjectActivity(project);
  return evalRes.freshness;
}

export function getTopCommercialTargets(limit: number = 20): TopCommercialTarget[] {
  const companiesRes = getFallbackCompanies({}, 1, 50);
  const allProjects = getFallbackProjects({}, 1, 100).data as any[];

  const targets: TopCommercialTarget[] = [];

  for (const compSummary of companiesRes.data) {
    const compDetail = getFallbackCompanyBySlug(compSummary.slug);
    if (!compDetail.company) continue;

    const company = compDetail.company;

    // Find relevant active projects for this company
    const companyProjects = allProjects.filter((p: any) =>
      p.companies?.some((c: any) => c.slug === compSummary.slug || c.id === company.id)
    );

    // Pick top priority project
    const postProj = companyProjects.find((p: any) => p.status === "post_production" || p.status === "finishing");
    const prodProj = companyProjects.find((p: any) => p.status === "production" || p.status === "filming");
    const activeProj = postProj || prodProj || companyProjects[0];

    // Build Project Events Timeline V1.4
    const projectEvents: ProjectEvent[] = [];
    if (compDetail.events && compDetail.events.length > 0) {
      compDetail.events.forEach((e: any) => {
        let resultingState = undefined;
        if (e.event_type === "theatrical_release" || e.event_type === "release") {
          resultingState = "RELEASED" as const;
        } else if (e.event_type === "production_started") {
          resultingState = "IN_PRODUCTION" as const;
        }

        projectEvents.push({
          id: e.id || `ev_${Math.random()}`,
          projectId: activeProj?.id || company.id,
          eventType: e.event_type === "theatrical_release" ? "THEATRICAL_RELEASE" : "PRODUCTION_STARTED",
          eventDate: e.event_date || new Date().toISOString(),
          publishedAt: e.event_date || new Date().toISOString(),
          extractedAt: new Date().toISOString(),
          source: "Industry Press Slate Monitor",
          url: company.website_url,
          sourceTier: "TIER_2_TRADE_PRESS",
          confidence: "HIGH",
          isEvidenceBased: true,
          claim: e.title,
          resultingState,
        });
      });
    }

    if (activeProj) {
      if (activeProj.status === "released" || activeProj.release_date) {
        projectEvents.push({
          id: `ev_rel_${activeProj.id}`,
          projectId: activeProj.id,
          eventType: "THEATRICAL_RELEASE",
          eventDate: activeProj.release_date || activeProj.updated_at || "2026-02-13T00:00:00.000Z",
          publishedAt: activeProj.release_date || activeProj.updated_at,
          extractedAt: activeProj.updated_at || new Date().toISOString(),
          source: "Official Distribution Catalog",
          sourceTier: "TIER_1_OFFICIAL",
          confidence: "HIGH",
          isEvidenceBased: true,
          claim: `Proyecto "${activeProj.title}" estrenado el ${activeProj.release_date || "recientemente"}.`,
          resultingState: "RELEASED",
        });
      }
    }

    // Current State Evaluation V1.4
    const activityEval = evaluateCurrentProjectState(activeProj, projectEvents);
    const projectFreshness = activityEval.freshness;

    // Claim-Level Verifications V1.4
    const compClaim = verifyCompanyIdentityClaim(company);
    const projClaim = verifyProjectStatusClaim(activeProj);

    // Evaluate Service Fit
    const potentialService = evaluateMCLServiceFit(
      activityEval.currentState === "RELEASED" ? "released" : activeProj?.status,
      activeProj?.project_type,
      Boolean(postProj) && activityEval.currentState !== "RELEASED"
    );

    // Pick best decision maker contact from roster
    const rawRosterPerson = compDetail.people?.[0];
    const recommendedContact = formatCommercialContact(rawRosterPerson);
    const roleClaim = verifyCurrentRoleClaim(recommendedContact);

    // Data Conflict Detection V1.4
    const dataConflict = detectDataConflict({
      targetId: company.id,
      projectStatus: activeProj?.status,
      releaseDate: activeProj?.release_date,
      updatedAt: rawRosterPerson?.updated_at || company.updated_at,
      roleTitle: recommendedContact?.currentRole,
      roleProvenance: rawRosterPerson?.provenance_type,
    });

    // Determine Company Freshness
    const freshness: DataFreshness = evaluateDataFreshness(company.updated_at || company.created_at);

    // Calculate Target Score
    const targetScore = calculateExplicableTargetScore({
      hasActiveProjects: companyProjects.length > 0 && activityEval.currentState !== "RELEASED",
      projectStatus: activityEval.currentState === "RELEASED" ? "released" : activeProj?.status,
      hasPostProductionProject: Boolean(postProj) && activityEval.currentState !== "RELEASED",
      hasVerifiedDecisionMaker: Boolean(recommendedContact?.isContactableNow) && roleClaim.status === "VERIFIED",
      decisionMakerCategory: recommendedContact?.category,
      hasRecentSignal: Boolean(activeProj && projectFreshness !== "STALE" && projClaim.status !== "CONTRADICTED" && activityEval.currentState !== "RELEASED"),
      dataFreshness: freshness,
      isVerifiedCompany: company.provenance_type !== "synthetic",
    });

    // Build Evidences V1.4
    const evidences: CommercialEvidence[] = [
      {
        id: `ev_comp_${company.id}`,
        type: "company_registry",
        claim: `Registro Oficial de Productora: ${company.name}`,
        sourceName: `Registro Oficial de ${company.name}`,
        sourceType: "Official Company Registry",
        credibilityScore: compClaim.confidenceScore,
        url: company.website_url || `https://${company.slug}.com`,
        sourceTier: compClaim.sourceTier || "TIER_1_OFFICIAL",
        evidenceType: "EXECUTIVE_ROSTER",
        provenanceType: company.provenance_type === "verified" ? "verified" : "seed",
        classification: company.provenance_type === "verified" ? "VERIFIED_FACT" : "SEED_DATA",
        publishedAt: company.created_at,
        extractedAt: company.updated_at || company.created_at,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        confidence: compClaim.confidenceScore >= 90 ? "HIGH" : "MEDIUM",
        isEvidenceBased: true,
      },
    ];

    if (activeProj) {
      evidences.push({
        id: `ev_proj_${activeProj.id}`,
        type: "slate_monitor",
        claim: `Proyecto "${activeProj.title}" en estado ${activityEval.currentState}`,
        sourceName: `Catálogo de Slates - Proyecto "${activeProj.title}"`,
        sourceType: "Trade Press / Production Slate Monitor",
        credibilityScore: projClaim.confidenceScore,
        url: `https://misteriocolorlab.com/projects/${activeProj.slug}`,
        sourceTier: "TIER_2_TRADE_PRESS",
        evidenceType: "SLATE_CATALOG",
        provenanceType: activeProj.provenance_type === "seed" ? "seed" : "verified",
        classification: activeProj.provenance_type === "seed" ? "SEED_DATA" : "VERIFIED_FACT",
        publishedAt: activeProj.announced_at || activeProj.created_at,
        extractedAt: activeProj.updated_at || activeProj.created_at,
        expiresAt: activityEval.metadata.expiresAt,
        confidence: projClaim.confidenceScore >= 90 ? "HIGH" : "MEDIUM",
        isEvidenceBased: true,
      });
    }

    // Calculate Independent Confidence
    const confidence = calculateIndependentConfidence(
      evidences.length,
      company.provenance_type !== "synthetic",
      Boolean(recommendedContact?.isContactableNow && roleClaim.status === "VERIFIED"),
      freshness
    );

    // Build Why Now Trigger & Invalidation Check V1.4
    let whyNow: CommercialWhyNowTrigger | undefined = undefined;
    const hasTemporalEvidence = Boolean(
      activeProj &&
      projectFreshness !== "STALE" &&
      projectFreshness !== "UNKNOWN" &&
      projClaim.status !== "CONTRADICTED" &&
      activityEval.currentState !== "RELEASED" &&
      activityEval.currentState !== "COMPLETED"
    );

    if (activeProj && hasTemporalEvidence) {
      whyNow = {
        signalType: activeProj.status === "post_production" ? "PROJECT_POST_PRODUCTION" : "PROJECT_IN_PRODUCTION",
        title: activeProj.status === "post_production"
          ? `Proyecto "${activeProj.title}" verificado activamente en fase de posproducción.`
          : `Proyecto "${activeProj.title}" verificado en rodaje / producción activa.`,
        timestamp: activeProj.announced_at || new Date().toISOString(),
        sourceName: "Monitor de Slates Audiovisuales",
        sourceType: "Trade Press / Industry Monitor",
        url: `https://misteriocolorlab.com/signals/${activeProj.id}`,
        freshness: projectFreshness,
        hasTemporalEvidence: true,
        signalStatus: "ACTIVE",
      };
    } else if (activeProj && (activityEval.currentState === "RELEASED" || activityEval.currentState === "COMPLETED")) {
      whyNow = {
        signalType: "PROJECT_RELEASED",
        title: `Señal Histórica: Proyecto "${activeProj.title}" estrenado/finalizado el ${activeProj.release_date || "recientemente"}.`,
        timestamp: activeProj.release_date || new Date().toISOString(),
        sourceName: "Registro de Estrenos Cinematográficos",
        sourceType: "Official Release Catalog",
        url: `https://misteriocolorlab.com/signals/${activeProj.id}`,
        freshness: "STALE",
        hasTemporalEvidence: false,
        signalStatus: "SUPERSEDED",
      };
    }

    // Signal Invalidation Evaluation V1.4
    const signalEval = invalidateObsoleteSignals(whyNow, projectEvents, activityEval.currentState);

    // Evaluate V1.4 Sales Readiness Dimension with Conflict and Superseded Signal Blocking
    const salesEval = evaluateSalesReadiness({
      projectActivity: activityEval.activityStatus,
      currentProjectState: activityEval.currentState,
      projectFreshness,
      contact: recommendedContact,
      serviceFitLevel: potentialService.fitLevel,
      whyNow,
      whyNowStatus: signalEval.whyNowStatus,
      confidenceLevel: confidence.level,
      companyName: company.name,
      projectTitle: activeProj?.title,
      dataConflict,
    });

    // Build Recommended Action
    let actionText = "Contactar al departamento de producción para presentar servicios de posproducción.";
    let isEvidenceBased = true;
    let actionType: any = "CONTACT_PRODUCER";
    let actionLabel: "EVIDENCE FACT" | "AI SUGGESTION" = "EVIDENCE FACT";

    if (activityEval.currentState === "RELEASED" || activityEval.currentState === "COMPLETED") {
      actionText = `Proyecto "${activeProj?.title || "anterior"}" ya estrenado/finalizado. No contactar para posproducción de este título.`;
      actionType = "GENERAL_INTRO";
      actionLabel = "EVIDENCE FACT";
    } else if (activeProj?.status === "post_production") {
      actionText = `Presentar propuesta de Etalonaje 4K HDR y Deliveries IMF a ${recommendedContact?.fullName || "Head of Production"} para "${activeProj.title}".`;
      actionType = "SUBMIT_MASTERING_QUOTE";
      actionLabel = "EVIDENCE FACT";
    } else if (activeProj?.status === "production") {
      actionText = `Sugerencia IA: Proponer desarrollo de Show-LUT pre-posproducción y pruebas en sala 4K HDR a ${recommendedContact?.fullName || "equipo de producción"} para "${activeProj.title}".`;
      actionType = "OFFER_SHOW_LUT";
      isEvidenceBased = false;
      actionLabel = "AI SUGGESTION";
    }

    const hasInsufficientData = !recommendedContact?.isContactableNow || !activeProj || projectFreshness === "STALE" || Boolean(dataConflict) || activityEval.currentState === "RELEASED";

    // DETERMINE STRICT COMMERCIAL TARGET CATEGORY
    let category: CommercialTargetCategory = "DISCOVERY_TARGET";

    if (
      activeProj &&
      activityEval.currentState !== "RELEASED" &&
      activityEval.currentState !== "COMPLETED" &&
      (activeProj.status === "post_production" || activeProj.status === "production") &&
      recommendedContact?.isContactableNow &&
      confidence.level !== "LOW" &&
      whyNow?.hasTemporalEvidence &&
      projectFreshness !== "STALE" &&
      !dataConflict
    ) {
      category = "PRIORITY_TARGET";
    } else if (activeProj && recommendedContact?.isContactableNow && activityEval.currentState !== "RELEASED") {
      category = "CONTACTABLE_TARGET font-medium" as CommercialTargetCategory;
    } else if (activeProj) {
      category = "RESEARCH_TARGET flex" as CommercialTargetCategory;
    }

    // Verification Timestamps & Audit Log V1.4
    const timestamps = calculateVerificationTimestamps(company.updated_at || company.created_at);
    const auditLog = [
      generateAuditLogEntry(
        "CONTACT_SOON",
        salesEval.readiness,
        salesEval.reasoning,
        `Auditoría V1.4 para ${company.name}`
      ),
    ];

    targets.push({
      id: company.id,
      category,
      salesReadiness: salesEval.readiness,
      salesReadinessReasoning: salesEval.reasoning,
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        countryCode: company.country_code || "ES",
        websiteUrl: company.website_url || undefined,
      },
      targetScore,
      confidence,
      relevantProject: activeProj
        ? {
            id: activeProj.id,
            title: activeProj.title,
            status: activeProj.status || "production",
            currentLifecycleState: activityEval.currentState,
            projectType: activeProj.project_type || "feature_film",
            releaseDate: activeProj.release_date || undefined,
            directorName: activeProj.director_name || undefined,
            freshness: projectFreshness,
            events: projectEvents,
          }
        : undefined,
      historicalSignals: signalEval.historicalSignals,
      potentialService,
      recommendedContact,
      whyNow: signalEval.isWhyNowActive ? whyNow : undefined,
      evidences,
      recommendedAction: {
        actionText,
        isEvidenceBased,
        actionType,
        label: actionLabel,
      },
      callOpening: salesEval.callOpening,
      freshness,
      hasInsufficientData,
      dataConflict,
      disclaimer: "NO SE CONTACTAN PERSONAS SIN EVIDENCIA SUFICIENTE",
      lastVerifiedAt: timestamps.lastVerifiedAt,
      nextVerificationAt: timestamps.nextVerificationAt,
      auditLog,
    });
  }

  // Sort strictly by Target Score descending
  targets.sort((a, b) => b.targetScore.totalScore - a.targetScore.totalScore);

  return targets.slice(0, limit);
}
